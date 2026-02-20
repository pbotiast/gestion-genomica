import express from 'express';
import cors from 'cors';
import db from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

const app = express();
const PORT = 3000;
const SECRET_KEY = 'super_secret_key_change_in_production'; // TODO: Move to .env

app.use(cors());
app.use(helmet()); // Security Headers
app.use(express.json());
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Limit each IP to 2000 requests per windowMs (Increased for bulk imports)
    message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Login-specific rate limit (stricter)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Limit login attempts (increased for development/testing)
    message: 'Too many login attempts, please try again later'
});

// --- Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- Helper for Audit Logs ---
function logAudit(action, entity, entityId, details, user = 'system') {
    const timestamp = new Date().toISOString();
    const stmt = db.prepare("INSERT INTO audit_logs (action, entity, entityId, details, user, timestamp) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(action, entity, entityId, JSON.stringify(details), user, timestamp, (err) => {
        if (err) console.error("Error logging audit:", err);
    });
    stmt.finalize();
}

// --- Audit Routes ---
app.get('/api/audit', authenticateToken, (req, res) => {
    const { startDate, endDate, action, entity } = req.query;

    let query = "SELECT * FROM audit_logs WHERE 1=1";
    const params = [];

    if (startDate) {
        query += " AND timestamp >= ?";
        params.push(startDate);
    }

    if (endDate) {
        query += " AND timestamp <= ?";
        params.push(endDate + ' 23:59:59');
    }

    if (action) {
        query += " AND action = ?";
        params.push(action);
    }

    if (entity) {
        query += " AND entity = ?";
        params.push(entity);
    }

    query += " ORDER BY timestamp DESC LIMIT 500";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Auth Routes ---
app.post('/api/login', loginLimiter, [
    body('username').notEmpty().trim().escape(),
    body('password').notEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            // Check if password is hashed (starts with $2b$) or plain text (legacy)
            let match = false;
            try {
                // Try bcrypt comparison first (will fail gracefully if password is plain text)
                match = await bcrypt.compare(password, row.password);
            } catch (bcryptError) {
                // Bcrypt failed, likely because password is plain text
                match = false;
            }

            // Fallback for legacy plain text passwords
            const isLegacyMatch = row.password === password;

            if (match || isLegacyMatch) {
                // If legacy, we should ideally hash it now, but let's keep it simple
                const userForToken = { id: row.id, username: row.username, role: row.role };
                const token = jwt.sign(userForToken, SECRET_KEY, { expiresIn: '8h' });

                const { password, ...user } = row;
                res.json({ success: true, user, token });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// --- Register Route ---
app.post('/api/register', loginLimiter, [
    body('username').notEmpty().trim().escape(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, name } = req.body;

    // Check if username already exists
    db.get("SELECT id FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ success: false, message: 'El usuario ya existe' });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const role = 'technician';

            db.run(
                "INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
                [username, hashedPassword, role, name],
                function (errInsert) {
                    if (errInsert) return res.status(500).json({ error: errInsert.message });
                    const userId = this.lastID;

                    // Also add to technicians table
                    db.run("INSERT OR IGNORE INTO technicians (name) VALUES (?)", [name], (errTech) => {
                        if (errTech) console.error("Error adding to technicians:", errTech);
                    });

                    logAudit('CREATE', 'USER', userId, { username, role, name }, username);
                    res.json({ success: true, message: 'Usuario registrado correctamente' });
                }
            );
        } catch (hashError) {
            res.status(500).json({ error: 'Error procesando la contraseña' });
        }
    });
});

// --- Researchers Routes ---
app.get('/api/researchers', authenticateToken, (req, res) => {
    db.all("SELECT * FROM researchers", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/researchers', authenticateToken, [
    body('fullName').notEmpty().trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('institution').notEmpty().trim().escape(),
    body('idNumber').optional().trim().escape() // CIF/NIF
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

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

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        stmt.run(
            fullName, institution, department, faculty, city, phone, fax,
            email, center, fiscalAddress, invoiceAddress, idNumber, tariff,
            accountingOffice, managementBody, processingUnit, proposingBody,
            function (err) {
                if (err) {
                    console.error("Error inserting researcher:", err);
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err.message });
                }

                const researcherId = this.lastID;
                const associates = req.body.associates || [];

                // Insert associates if present
                if (associates.length > 0) {
                    const assocStmt = db.prepare("INSERT INTO researcher_associates (researcherId, name, email) VALUES (?, ?, ?)");
                    for (const assoc of associates) {
                        assocStmt.run(researcherId, assoc.name, assoc.email);
                    }
                    assocStmt.finalize();
                }

                db.run("COMMIT", (err) => {
                    if (err) {
                        console.error("Error committing transaction:", err);
                        return res.status(500).json({ error: "Transaction commit failed" });
                    }
                    logAudit('CREATE', 'RESEARCHER', researcherId, req.body, req.user.username);
                    res.json({ id: researcherId, ...req.body });
                });
            }
        );
        stmt.finalize();
    });
});

app.delete('/api/researchers/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    // Check constraints if needed (e.g. has requests?)
    db.get("SELECT count(*) as count FROM requests WHERE researcherId = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row.count > 0) return res.status(400).json({ error: "Cannot delete researcher with existing requests" });

        db.run("DELETE FROM researchers WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Researcher not found" });
            logAudit('DELETE', 'RESEARCHER', id, {}, req.user.username);
            res.json({ success: true, deleted: this.changes });
        });
    });
});



// --- Services Routes ---
app.get('/api/services', authenticateToken, (req, res) => {
    db.all("SELECT * FROM services", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/services', authenticateToken, (req, res) => {
    const { name, categoryId, format, priceA, priceB, priceC } = req.body;
    const stmt = db.prepare("INSERT INTO services (name, categoryId, format, priceA, priceB, priceC) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(name, categoryId, format, priceA, priceB, priceC, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
    stmt.finalize();
});

app.delete('/api/services/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    // Check constraints
    db.get("SELECT count(*) as count FROM requests WHERE serviceId = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row.count > 0) return res.status(400).json({ error: "Cannot delete service with existing requests" });

        db.run("DELETE FROM services WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Service not found" });
            res.json({ success: true, deleted: this.changes });
        });
    });
});

// --- Institutions Routes ---
app.get('/api/institutions', authenticateToken, (req, res) => {
    db.all("SELECT * FROM institutions", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/institutions', authenticateToken, (req, res) => {
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
app.get('/api/technicians', authenticateToken, (req, res) => {
    db.all("SELECT * FROM technicians", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/technicians', authenticateToken, (req, res) => {
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
app.get('/api/researchers/:id/associates', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.all("SELECT * FROM researcher_associates WHERE researcherId = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/researchers/:id/associates', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const stmt = db.prepare("INSERT INTO researcher_associates (researcherId, name, email) VALUES (?, ?, ?)");
    stmt.run(id, name, email, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, researcherId: id, name, email });
    });
    stmt.finalize();
});

app.put('/api/researchers/:id', authenticateToken, (req, res) => {
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
        logAudit('UPDATE', 'RESEARCHER', id, updates, req.user.username);
        res.json({ success: true, updated: this.changes });
    });
});

// --- Researcher Associates Routes ---
app.get('/api/associates', authenticateToken, (req, res) => {
    // Get ALL associates (for autocomplete/search across all researchers)
    db.all("SELECT * FROM researcher_associates", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/researchers/:id/associates', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.all("SELECT * FROM researcher_associates WHERE researcherId = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// Delete Associate
app.delete('/api/associates/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM researcher_associates WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Associate not found" });
        res.json({ success: true, deleted: this.changes });
    });
});

// Update Associate
app.put('/api/associates/:id', authenticateToken, (req, res) => {
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

app.delete('/api/technicians/:name', authenticateToken, (req, res) => {
    const { name } = req.params;
    db.run("DELETE FROM technicians WHERE name = ?", [name], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Technician not found" });
        res.json({ success: true, deleted: this.changes });
    });
});

// --- Requests Routes ---
app.delete('/api/requests/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM requests WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Request not found" });
        logAudit('DELETE', 'REQUEST', id, {}, req.user.username);
        res.json({ success: true, deleted: this.changes });
    });
});

app.get('/api/requests', authenticateToken, (req, res) => {
    db.all("SELECT * FROM requests", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Helper function: Generate automatic registrationNumber (YYYY-XXXX format)
async function generateRegistrationNumber(db) {
    return new Promise((resolve, reject) => {
        const year = new Date().getFullYear();
        const prefix = `${year}-`;

        // Get last number of the year
        db.get(
            "SELECT registrationNumber FROM requests WHERE registrationNumber LIKE ? ORDER BY id DESC LIMIT 1",
            [`${year}-%`],
            (err, row) => {
                if (err) return reject(err);

                let nextNumber = 1;
                if (row && row.registrationNumber) {
                    const parts = row.registrationNumber.split('-');
                    if (parts.length === 2) {
                        const lastNum = parseInt(parts[1]);
                        if (!isNaN(lastNum)) {
                            nextNumber = lastNum + 1;
                        }
                    }
                }

                if (nextNumber > 10000) {
                    return reject(new Error('Límite anual de solicitudes alcanzado (10,000)'));
                }

                // Format: 2026-0001
                const registrationNumber = `${prefix}${String(nextNumber).padStart(4, '0')}`;
                resolve(registrationNumber);
            }
        );
    });
}

app.post('/api/requests', authenticateToken, [
    body('researcherId').isInt(),
    body('serviceId').isInt(),
    body('samplesCount').isInt({ min: 1 }),
    body('status').isIn(['pending', 'received', 'analysis', 'validation', 'completed', 'processed', 'billed']).optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        entryDate, researcherId, serviceId, orderNumber,
        samplesCount, finalSamplesCount, format, additionalInfo, requestedBy,
        status = 'pending', technician, resultSentDate
    } = req.body;

    try {
        // 1. Generar registrationNumber automáticamente
        const registrationNumber = await generateRegistrationNumber(db);

        // 2. Obtener tarifa del investigador (vía centro)
        const researcher = await new Promise((resolve, reject) => {
            db.get(`
                SELECT r.*, c.tariff 
                FROM researchers r 
                LEFT JOIN research_centers c ON r.centerId = c.id 
                WHERE r.id = ?
            `, [researcherId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!researcher) {
            return res.status(404).json({ error: 'Investigador no encontrado' });
        }

        // 3. Obtener precio del servicio según tarifa
        const service = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM services WHERE id = ?", [serviceId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!service) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        // Seleccionar precio según tarifa (o usar tarifa del investigador si no tiene centro)
        const tariff = researcher.tariff || 'C'; // Default C si no tiene centro
        let unitPrice;
        switch (tariff) {
            case 'A': unitPrice = service.priceA; break;
            case 'B': unitPrice = service.priceB; break;
            case 'C': unitPrice = service.priceC; break;
            default: unitPrice = service.priceC;
        }

        const totalCost = unitPrice * samplesCount;
        const createdAt = new Date().toISOString();

        const stmt = db.prepare(`
            INSERT INTO requests (
                registrationNumber, orderNumber, entryDate, researcherId, serviceId, 
                samplesCount, finalSamplesCount, format, additionalInfo, requestedBy,
                status, technician, resultSentDate, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            registrationNumber, orderNumber, entryDate, researcherId, serviceId,
            samplesCount, finalSamplesCount, format, additionalInfo, requestedBy,
            status, technician, resultSentDate, createdAt,
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                logAudit('CREATE', 'REQUEST', this.lastID, { registrationNumber, researcherId }, req.user.username);
                res.json({
                    id: this.lastID,
                    registrationNumber,
                    orderNumber,
                    ...req.body,
                    createdAt,
                    calculatedPrice: { tariff, unitPrice, totalCost }
                });
            }
        );
        stmt.finalize();
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/requests/:id', authenticateToken, (req, res) => {
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
        logAudit('UPDATE', 'REQUEST', id, updates, req.user.username);
        res.json({ success: true, updated: this.changes });
    });
});

// --- Dashboard Routes ---
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const { period = 'month' } = req.query;

    // Calculate date filter based on period
    const getDateFilter = (period) => {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'all':
            default:
                startDate = new Date('2000-01-01'); // Far past
                break;
        }

        return startDate.toISOString().split('T')[0];
    };

    const dateFilter = getDateFilter(period);
    const stats = {};

    db.serialize(() => {
        // Total Requests (filtered by period)
        db.get("SELECT count(*) as total FROM requests WHERE entryDate >= ?", [dateFilter], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.totalRequests = row.total;

            // Pending Requests (filtered)
            db.get("SELECT count(*) as pending FROM requests WHERE status != 'processed' AND status != 'billed' AND entryDate >= ?", [dateFilter], (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.pendingRequests = row.pending;

                // Processed/Invoiced Requests (filtered)
                db.get("SELECT count(*) as invoiced FROM requests WHERE (status = 'processed' OR status = 'billed') AND entryDate >= ?", [dateFilter], (err, row) => {
                    if (err) return res.status(500).json({ error: err.message });
                    stats.invoicedRequests = row.invoiced;

                    // Requests per Year
                    db.all("SELECT strftime('%Y', entryDate) as year, count(*) as count FROM requests GROUP BY year ORDER BY year DESC", [], (err, rows) => {
                        if (err) return res.status(500).json({ error: err.message });
                        stats.requestsPerYear = rows;

                        // Revenue Per Month (Last 12 months)
                        db.all("SELECT strftime('%Y-%m', createdAt) as month, SUM(amount) as revenue FROM invoices GROUP BY month ORDER BY month DESC LIMIT 12", [], (err, rows) => {
                            if (err) return res.status(500).json({ error: err.message });
                            stats.revenuePerMonth = rows.reverse(); // Chronological order

                            // Service Popularity (filtered)
                            db.all("SELECT s.name, count(r.id) as count FROM requests r JOIN services s ON r.serviceId = s.id WHERE r.entryDate >= ? GROUP BY s.name ORDER BY count DESC LIMIT 5", [dateFilter], (err, rows) => {
                                if (err) return res.status(500).json({ error: err.message });
                                stats.servicePopularity = rows;

                                // NEW: Trend Data (based on period)
                                let trendQuery;
                                if (period === 'week') {
                                    trendQuery = "SELECT strftime('%Y-%m-%d', entryDate) as period, count(*) as count FROM requests WHERE entryDate >= ? GROUP BY period ORDER BY period";
                                } else if (period === 'month' || period === 'quarter') {
                                    trendQuery = "SELECT strftime('%Y-%m-%d', entryDate) as period, count(*) as count FROM requests WHERE entryDate >= ? GROUP BY period ORDER BY period";
                                } else if (period === 'year') {
                                    trendQuery = "SELECT strftime('%Y-%m', entryDate) as period, count(*) as count FROM requests WHERE entryDate >= ? GROUP BY period ORDER BY period";
                                } else {
                                    trendQuery = "SELECT strftime('%Y', entryDate) as period, count(*) as count FROM requests GROUP BY period ORDER BY period";
                                }

                                db.all(trendQuery, [dateFilter], (err, rows) => {
                                    if (err) return res.status(500).json({ error: err.message });
                                    stats.trendData = rows;

                                    // NEW: Center Statistics (filtered)
                                    db.all(`
                                        SELECT 
                                            res.center as centerName,
                                            count(r.id) as count,
                                            SUM(CASE 
                                                WHEN s.priceA IS NOT NULL AND res.tariff = 'A' THEN s.priceA * r.samplesCount
                                                WHEN s.priceB IS NOT NULL AND res.tariff = 'B' THEN s.priceB * r.samplesCount
                                                WHEN s.priceC IS NOT NULL AND res.tariff = 'C' THEN s.priceC * r.samplesCount
                                                ELSE 0
                                            END) as revenue
                                        FROM requests r
                                        LEFT JOIN researchers res ON r.researcherId = res.id
                                        LEFT JOIN services s ON r.serviceId = s.id
                                        WHERE r.entryDate >= ?
                                        GROUP BY res.center
                                        ORDER BY count DESC
                                        LIMIT 5
                                    `, [dateFilter], (err, rows) => {
                                        if (err) return res.status(500).json({ error: err.message });
                                        stats.centerStats = rows;

                                        // NEW: Tariff Distribution (filtered)
                                        db.all(`
                                            SELECT 
                                                COALESCE(res.tariff, 'Sin Definir') as tariff,
                                                count(r.id) as count
                                            FROM requests r
                                            LEFT JOIN researchers res ON r.researcherId = res.id
                                            WHERE r.entryDate >= ?
                                            GROUP BY res.tariff
                                            ORDER BY count DESC
                                        `, [dateFilter], (err, rows) => {
                                            if (err) return res.status(500).json({ error: err.message });
                                            stats.tariffDistribution = rows;

                                            res.json(stats);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get('/api/emails/history', authenticateToken, (req, res) => {
    db.all("SELECT * FROM email_history ORDER BY sent_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Invoices Routes ---
app.get('/api/invoices', authenticateToken, (req, res) => {
    db.all("SELECT * FROM invoices ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/invoices', authenticateToken, (req, res) => {
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
            logAudit('CREATE', 'INVOICE', invoiceId, { invoiceNumber, amount, researcherId }, req.user.username);
            res.json({ id: invoiceId, invoiceNumber, createdAt });
        });
        stmt.finalize();
    });
});

app.put('/api/invoices/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { payment_status } = req.body;

    db.run("UPDATE invoices SET payment_status = ? WHERE id = ?", [payment_status, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, payment_status });
        // logAudit('UPDATE', 'INVOICE', id, { payment_status }, req.user.username);
    });
});

// Email dispatch route - Moved up to avoid conflicts
app.post('/api/invoices/:id/email', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { email, subject } = req.body;
    console.log(`[POST] /api/invoices/${id}/email`, req.body);

    if (!email) return res.status(400).json({ error: 'Email destination is required' });

    const status = 'sent';
    const sent_at = new Date().toISOString();

    db.run(`INSERT INTO email_history (invoice_id, recipient_email, subject, sent_at, status) VALUES (?, ?, ?, ?, ?)`,
        [id, email, subject || 'Factura Genómica UCM', sent_at, status],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Email registrado correctamente' });
        });
});

app.listen(PORT, () => {
    console.log(`\n\n==================================================`);
    console.log(`✅ SERVER RESTARTED SUCCESSFULLY AT ${new Date().toISOString()}`);
    console.log(`Routes loaded:`);
    console.log(`   - POST /api/invoices/:id/email (DISPATCH)`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`==================================================\n\n`);
});
