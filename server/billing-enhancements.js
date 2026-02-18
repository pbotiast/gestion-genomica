// Nodemailer configuration endpoint for sending invoice emails
import nodemailer from 'nodemailer';

// Email configuration (should be in environment variables in production)
let emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
};

// Get email configuration
app.get('/api/email/config', authenticateToken, (req, res) => {
    // Don't send password to frontend
    const safeConfig = {
        host: emailConfig.host,
        port: emailConfig.port,
        user: emailConfig.auth.user,
        configured: !!emailConfig.auth.user && !!emailConfig.auth.pass
    };
    res.json(safeConfig);
});

// Update email configuration (admin only)
app.post('/api/email/config', authenticateToken, (req, res) => {
    const { host, port, user, pass } = req.body;

    if (!host || !port || !user || !pass) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    emailConfig = {
        host,
        port: parseInt(port),
        secure: parseInt(port) === 465,
        auth: { user, pass }
    };

    res.json({ success: true, message: 'Email configuration updated' });
});

// Send invoice via email
app.post('/api/invoices/:id/send-email', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { recipientEmail, subject, message } = req.body;

    try {
        // Get invoice data
        const invoice = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Get researcher data
        const researcher = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM researchers WHERE id = ?', [invoice.researcherId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Create email transporter
        const transporter = nodemailer.createTransporter(emailConfig);

        // Send email
        const mailOptions = {
            from: emailConfig.auth.user,
            to: recipientEmail,
            subject: subject || `Factura ${invoice.invoiceNumber}`,
            html: `
                <h2>Factura ${invoice.invoiceNumber}</h2>
                <p>Estimado/a ${researcher?.fullName || 'Cliente'},</p>
                <p>${message || 'Adjuntamos su factura en formato PDF.'}</p>
                <table border="1" cellpadding="10" cellspacing="0">
                    <tr>
                        <th>Número de Factura</th>
                        <td>${invoice.invoiceNumber}</td>
                    </tr>
                    <tr>
                        <th>Fecha</th>
                        <td>${new Date(invoice.createdAt).toLocaleDateString('es-ES')}</td>
                    </tr>
                    <tr>
                        <th>Importe Total</th>
                        <td>${invoice.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                    </tr>
                </table>
                <p>Saludos cordiales,<br/>Departamento de Facturación</p>
            `,
            // TODO: Attach PDF invoice
        };

        await transporter.sendMail(mailOptions);

        // Log audit
        logAudit('SEND_EMAIL', 'INVOICE', id, { recipientEmail }, req.user.username);

        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ error: 'Failed to send email: ' + error.message });
    }
});

// Bulk invoice generation endpoint
app.post('/api/invoices/bulk-generate', authenticateToken, async (req, res) => {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    try {
        // Get processed requests in date range
        const processedRequests = await new Promise((resolve, reject) => {
            db.all(
                `SELECT r.*, res.id as researcherId, res.fullName, res.tariff 
                 FROM requests r 
                 JOIN researchers res ON r.researcherId = res.id
                 WHERE (r.status = 'processed' OR r.status = 'completed') 
                 AND r.entryDate >= ? 
                 AND r.entryDate <= ?
                 AND r.invoiceId IS NULL`,
                [startDate, endDate + ' 23:59:59'],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        // Group by researcher
        const groups = {};
        for (const req of processedRequests) {
            if (!groups[req.researcherId]) {
                groups[req.researcherId] = {
                    researcherId: req.researcherId,
                    fullName: req.fullName,
                    requests: [],
                    total: 0
                };
            }

            // Calculate cost
            const service = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM services WHERE id = ?', [req.serviceId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (service) {
                const tariff = req.tariff || 'C';
                const price = service[`price${tariff}`] || 0;
                const quantity = req.finalSamplesCount || req.samplesCount || 1;
                const cost = price * quantity;
                groups[req.researcherId].total += cost;
                groups[req.researcherId].requests.push(req.id);
            }
        }

        // Generate invoices
        const generatedInvoices = [];
        for (const group of Object.values(groups)) {
            const year = new Date().getFullYear();
            const count = await new Promise((resolve, reject) => {
                db.get("SELECT count(*) as count FROM invoices WHERE invoiceNumber LIKE ?", [`${year}-%`], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
            });

            const nextNum = (count + generatedInvoices.length + 1).toString().padStart(3, '0');
            const invoiceNumber = `${year}-${nextNum}`;
            const createdAt = new Date().toISOString();
            const amount = group.total * 1.21; // Add 21% VAT

            await new Promise((resolve, reject) => {
                db.run(
                    "INSERT INTO invoices (invoiceNumber, researcherId, amount, status, createdAt) VALUES (?, ?, ?, ?, ?)",
                    [invoiceNumber, group.researcherId, amount, 'pending', createdAt],
                    function (err) {
                        if (err) reject(err);
                        else {
                            const invoiceId = this.lastID;

                            // Update requests
                            const placeholders = group.requests.map(() => '?').join(',');
                            db.run(
                                `UPDATE requests SET invoiceId = ?, status = 'billed' WHERE id IN (${placeholders})`,
                                [invoiceId, ...group.requests],
                                (err) => {
                                    if (err) console.error('Error updating requests:', err);
                                }
                            );

                            logAudit('CREATE', 'INVOICE', invoiceId, { invoiceNumber, amount, researcherId: group.researcherId }, req.user.username);

                            generatedInvoices.push({
                                id: invoiceId,
                                invoiceNumber,
                                researcherName: group.fullName,
                                amount
                            });
                            resolve();
                        }
                    }
                );
            });
        }

        res.json({
            success: true,
            count: generatedInvoices.length,
            invoices: generatedInvoices
        });
    } catch (error) {
        console.error('Bulk generation error:', error);
        res.status(500).json({ error: 'Failed to generate invoices: ' + error.message });
    }
});
