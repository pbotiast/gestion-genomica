// Combined migration script - indexes + payment tracking
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.db');

console.log('Running database migrations...\n');
console.log(`Database path: ${dbPath}\n`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to database:', err.message);
        process.exit(1);
    }
    console.log('✓ Connected to database\n');
});

// All SQL statements to execute
const migrations = [
    // 1. Add payment_status column
    {
        name: 'Add payment_status to invoices',
        sql: `ALTER TABLE invoices ADD COLUMN payment_status TEXT DEFAULT 'Pending'`,
        skipIfExists: true
    },
    // 2. Create email_history table
    {
        name: 'Create email_history table',
        sql: `CREATE TABLE IF NOT EXISTS email_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER,
            recipient_email TEXT,
            subject TEXT,
            sent_at TEXT,
            status TEXT,
            error_message TEXT,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id)
        )`
    },
    // 3. Update existing invoices
    {
        name: 'Set default payment_status',
        sql: `UPDATE invoices SET payment_status = 'Pending' WHERE payment_status IS NULL`
    },
];

let completed = 0;
let skipped = 0;
let failed = 0;

function executeMigration(index) {
    if (index >= migrations.length) {
        console.log(`\n✅ Migration completed: ${completed} successful, ${skipped} skipped, ${failed} failed`);
        db.close();
        process.exit(failed > 0 ? 1 : 0);
        return;
    }

    const migration = migrations[index];

    db.run(migration.sql, (err) => {
        if (err) {
            if (migration.skipIfExists && err.message.includes('duplicate column')) {
                console.log(`⚠ ${migration.name}: Already exists, skipping`);
                skipped++;
            } else {
                console.error(`✗ ${migration.name}: ${err.message}`);
                failed++;
            }
        } else {
            console.log(`✓ ${migration.name}`);
            completed++;
        }

        // Execute next migration
        executeMigration(index + 1);
    });
}

// Start executing migrations sequentially
executeMigration(0);
