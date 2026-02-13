import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQlite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            name TEXT
        )`);

        // Researchers Table
        db.run(`CREATE TABLE IF NOT EXISTS researchers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT,
            institution TEXT,
            department TEXT,
            faculty TEXT,
            city TEXT,
            phone TEXT,
            fax TEXT,
            email TEXT,
            center TEXT,
            fiscalAddress TEXT,
            invoiceAddress TEXT,
            idNumber TEXT,
            tariff TEXT,
            accountingOffice TEXT,
            managementBody TEXT,
            processingUnit TEXT,
            proposingBody TEXT
        )`);

        // Services Table
        db.run(`CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            categoryId TEXT,
            format TEXT,
            priceA REAL,
            priceB REAL,
            priceC REAL
        )`);

        // Institutions Table
        db.run(`CREATE TABLE IF NOT EXISTS institutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )`);

        // Technicians Table
        db.run(`CREATE TABLE IF NOT EXISTS technicians (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )`);

        // Researcher Associates (Authorized Users)
        db.run(`CREATE TABLE IF NOT EXISTS researcher_associates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            researcherId INTEGER,
            name TEXT,
            email TEXT,
            FOREIGN KEY(researcherId) REFERENCES researchers(id)
        )`);

        // Requests Table
        db.run(`CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            registrationNumber TEXT UNIQUE,
            entryDate TEXT,
            researcherId INTEGER,
            serviceId INTEGER,
            samplesCount INTEGER,
            finalSamplesCount INTEGER,
            format TEXT,
            additionalInfo TEXT,
            requestedBy TEXT, 
            status TEXT,
            resultSentDate TEXT,
            technician TEXT,
            createdAt TEXT,
            FOREIGN KEY(researcherId) REFERENCES researchers(id),
            FOREIGN KEY(researcherId) REFERENCES researchers(id),
            FOREIGN KEY(serviceId) REFERENCES services(id)
        )`);

        // Check if invoiceId exists in requests (for migration)
        db.all("PRAGMA table_info(requests)", (err, rows) => {
            if (rows && !rows.some(r => r.name === 'invoiceId')) {
                db.run("ALTER TABLE requests ADD COLUMN invoiceId INTEGER REFERENCES invoices(id)");
            }
        });

        // Invoices Table
        db.run(`CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoiceNumber TEXT UNIQUE,
            researcherId INTEGER,
            amount REAL,
            status TEXT, -- paid, pending
            createdAt TEXT,
            FOREIGN KEY(researcherId) REFERENCES researchers(id)
            FOREIGN KEY(serviceId) REFERENCES services(id)
        )`);

        // Check if invoiceId exists in requests (for migration)
        db.all("PRAGMA table_info(requests)", (err, rows) => {
            if (rows && !rows.some(r => r.name === 'invoiceId')) {
                db.run("ALTER TABLE requests ADD COLUMN invoiceId INTEGER REFERENCES invoices(id)");
            }
        });

        // Invoices Table
        db.run(`CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoiceNumber TEXT UNIQUE,
            researcherId INTEGER,
            amount REAL,
            status TEXT, -- paid, pending
            createdAt TEXT,
            FOREIGN KEY(researcherId) REFERENCES researchers(id)
        )`);

        // Seed Users if empty
        db.get("SELECT count(*) as count FROM users", (err, row) => {
            if (row.count === 0) {
                console.log("Seeding Users...");
                const stmt = db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)");
                stmt.run("admin", "admin123", "admin", "Administrador");
                stmt.run("tecnico", "tecnico123", "technician", "Técnico de Laboratorio");
                stmt.finalize();
            }
        });

        // Seed Services (Example)
        db.get("SELECT count(*) as count FROM services", (err, row) => {
            if (row.count === 0) {
                console.log("Seeding Services...");
                // Basic seed, in real app app should import full list
                // Using a few examples from previous context
                const stmt = db.prepare("INSERT INTO services (name, categoryId, format, priceA, priceB, priceC) VALUES (?, ?, ?, ?, ?, ?)");
                stmt.run("Extracción ADN", "DNA", "Tubo", 10.5, 15.0, 20.0);
                stmt.run("PCR Convencional", "PCR", "Placa", 5.0, 7.5, 10.0);
                stmt.run("Secuenciación Sanger", "SEQ", "Capilar", 3.0, 4.5, 6.0);
                stmt.finalize();
            }
        });
    });
}

export default db;
