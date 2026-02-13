import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Auth Routes ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            const { password, ...user } = row; // Exclude password from response
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// --- Researchers Routes ---
app.get('/api/researchers', (req, res) => {
    db.all("SELECT * FROM researchers", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/researchers', (req, res) => {
    const {
        fullName, institution, department, faculty, city, phone, fax,
        email, center, fiscalAddress, invoiceAddress, idNumber, tariff,
        accountingOffice, managementBody, processingUnit, proposingBody
    } = req.body;

    const stmt = db.prepare(`
        INSERT INTO researchers (
            fullName, institution, department, faculty, city, phone, fax,
            email, center, fiscalAddress, invoiceAddress, idNumber, tariff,
            accountingOffice, managementBody, processingUnit, proposingBody
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        fullName, institution, department, faculty, city, phone, fax,
        email, center, fiscalAddress, invoiceAddress, idNumber, tariff,
        accountingOffice, managementBody, processingUnit, proposingBody,
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        }
    );
    stmt.finalize();
});

// --- Services Routes ---
app.get('/api/services', (req, res) => {
    db.all("SELECT * FROM services", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/services', (req, res) => {
    const { name, categoryId, format, priceA, priceB, priceC } = req.body;
    const stmt = db.prepare("INSERT INTO services (name, categoryId, format, priceA, priceB, priceC) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(name, categoryId, format, priceA, priceB, priceC, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
    stmt.finalize();
});

// --- Institutions Routes ---
app.get('/api/institutions', (req, res) => {
    db.all("SELECT * FROM institutions", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/institutions', (req, res) => {
    const { name } = req.body;
    const stmt = db.prepare("INSERT INTO institutions (name) VALUES (?)");
    stmt.run(name, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.json({ id: this.lastID, name, existed: true });
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name });
    });
    stmt.finalize();
});

// --- Technicians Routes ---
app.get('/api/technicians', (req, res) => {
    db.all("SELECT * FROM technicians", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/technicians', (req, res) => {
    const { name } = req.body;
    const stmt = db.prepare("INSERT INTO technicians (name) VALUES (?)");
    stmt.run(name, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.json({ id: this.lastID, name, existed: true });
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name });
    });
    stmt.finalize();
});

// --- Researcher Associates Routes ---
app.get('/api/researchers/:id/associates', (req, res) => {
    const { id } = req.params;
    db.all("SELECT * FROM researcher_associates WHERE researcherId = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/researchers/:id/associates', (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const stmt = db.prepare("INSERT INTO researcher_associates (researcherId, name, email) VALUES (?, ?, ?)");
    stmt.run(id, name, email, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, researcherId: id, name, email });
    });
    stmt.finalize();
});

app.put('/api/researchers/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Filter out fields that shouldn't be updated or strictly control them if needed
    // For now, allow dynamic update of all provided fields matches columns
    const keys = Object.keys(updates).filter(k => k !== 'id');
    const values = keys.map(k => updates[k]);
    const placeholders = keys.map(k => `${k} = ?`).join(', ');

    if (keys.length === 0) return res.status(400).json({ error: "No fields to update" });

    db.run(`UPDATE researchers SET ${placeholders} WHERE id = ?`, [...values, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Researcher not found" });
        res.json({ success: true, updated: this.changes });
    });
});

// --- Researcher Associates Routes ---
app.get('/api/associates', (req, res) => {
    // Get ALL associates (for autocomplete/search across all researchers)
    db.all("SELECT * FROM researcher_associates", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/researchers/:id/associates', (req, res) => {
    const { id } = req.params;
    db.all("SELECT * FROM researcher_associates WHERE researcherId = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/researchers/:id/associates', (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const stmt = db.prepare("INSERT INTO researcher_associates (researcherId, name, email) VALUES (?, ?, ?)");
    stmt.run(id, name, email, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, researcherId: id, name, email });
    });
    stmt.finalize();
});

// Delete Associate
app.delete('/api/associates/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM researcher_associates WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Associate not found" });
        res.json({ success: true, deleted: this.changes });
    });
});

// Update Associate
app.put('/api/associates/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, researcherId } = req.body;

    // Build dynamic update
    const updates = [];
    const values = [];
    if (name) { updates.push("name = ?"); values.push(name); }
    if (email !== undefined) { updates.push("email = ?"); values.push(email); }
    if (researcherId) { updates.push("researcherId = ?"); values.push(researcherId); }

    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(id);

    db.run(`UPDATE researcher_associates SET ${updates.join(", ")} WHERE id = ?`, values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Associate not found" });
        res.json({ success: true, updated: this.changes });
    });
});

// --- Requests Routes ---
app.get('/api/requests', (req, res) => {
    db.all("SELECT * FROM requests", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/requests', (req, res) => {
    const {
        registrationNumber, entryDate, researcherId, serviceId,
        samplesCount, finalSamplesCount, format, additionalInfo, requestedBy,
        status = 'pending', technician, resultSentDate
    } = req.body;

    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
        INSERT INTO requests (
            registrationNumber, entryDate, researcherId, serviceId, 
            samplesCount, finalSamplesCount, format, additionalInfo, requestedBy,
            status, technician, resultSentDate, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        registrationNumber, entryDate, researcherId, serviceId,
        samplesCount, finalSamplesCount, format, additionalInfo, requestedBy,
        status, technician, resultSentDate, createdAt,
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body, createdAt });
        }
    );
    stmt.finalize();
});

app.put('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    console.log(`[PUT] /api/requests/${id}`, updates);

    // Dynamic Update Query with Allowed Fields whitelist
    const allowedFields = [
        'registrationNumber', 'entryDate', 'researcherId', 'serviceId',
        'samplesCount', 'finalSamplesCount', 'format', 'additionalInfo',
        'requestedBy', 'status', 'technician', 'resultSentDate'
    ];

    const keys = Object.keys(updates).filter(k => allowedFields.includes(k));
    const values = keys.map(k => updates[k]);
    const placeholders = keys.map(k => `${k} = ?`).join(', ');

    if (keys.length === 0) {
        console.warn(`[PUT] Request ${id}: No valid fields to update`);
        return res.status(400).json({ error: "No fields to update" });
    }

    console.log(`[PUT] Updating fields: ${keys.join(', ')}`);

    db.run(`UPDATE requests SET ${placeholders} WHERE id = ?`, [...values, id], function (err) {
        if (err) {
            console.error(`[PUT] DB Error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            console.warn(`[PUT] Request ${id} not found or not modified`);
            return res.status(404).json({ error: "Request not found" });
        }
        console.log(`[PUT] Success. Updated ${this.changes} row(s).`);
        res.json({ success: true, updated: this.changes });
    });
});

// --- Dashboard Routes ---
app.get('/api/dashboard/stats', (req, res) => {
    const stats = {};

    db.serialize(() => {
        // Total Requests
        db.get("SELECT count(*) as total FROM requests", (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.totalRequests = row.total;

            // Pending Requests (not processed/billed)
            db.get("SELECT count(*) as pending FROM requests WHERE status != 'processed' AND status != 'billed'", (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.pendingRequests = row.pending;

                // Processed/Invoiced Requests
                db.get("SELECT count(*) as invoiced FROM requests WHERE status = 'processed' OR status = 'billed'", (err, row) => {
                    if (err) return res.status(500).json({ error: err.message });
                    stats.invoicedRequests = row.invoiced;

                    // Requests per Year
                    db.all("SELECT strftime('%Y', entryDate) as year, count(*) as count FROM requests GROUP BY year ORDER BY year DESC", [], (err, rows) => {
                        if (err) return res.status(500).json({ error: err.message });
                        stats.requestsPerYear = rows;

                        res.json(stats);
                    });
                });
            });
        });
    });
});

// --- Invoices Routes ---
app.get('/api/invoices', (req, res) => {
    db.all("SELECT * FROM invoices ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/invoices', (req, res) => {
    const { researcherId, amount, requestIds } = req.body;

    // Generate Invoice Number: YYYY-001
    const year = new Date().getFullYear();
    db.get("SELECT count(*) as count FROM invoices WHERE invoiceNumber LIKE ?", [`${year}-%`], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        const nextNum = (row.count + 1).toString().padStart(3, '0');
        const invoiceNumber = `${year}-${nextNum}`;
        const createdAt = new Date().toISOString();
        const status = 'pending';

        const stmt = db.prepare("INSERT INTO invoices (invoiceNumber, researcherId, amount, status, createdAt) VALUES (?, ?, ?, ?, ?)");
        stmt.run(invoiceNumber, researcherId, amount, status, createdAt, function (err) {
            if (err) return res.status(500).json({ error: err.message });

            const invoiceId = this.lastID;

            // Link requests to invoice
            if (requestIds && requestIds.length > 0) {
                const placeholders = requestIds.map(() => '?').join(',');
                db.run(`UPDATE requests SET invoiceId = ?, status = 'billed' WHERE id IN (${placeholders})`, [invoiceId, ...requestIds], (err) => {
                    if (err) console.error("Error linking requests to invoice:", err);
                });
            }

            res.json({ id: invoiceId, invoiceNumber, createdAt });
        });
        stmt.finalize();
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
