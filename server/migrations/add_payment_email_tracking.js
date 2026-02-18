// Migration: Add payment_status to invoices and create email_history table
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Running migration: Adding payment_status and email_history...\n');

db.serialize(() => {
    // Add payment_status column to invoices table
    db.run(`
        ALTER TABLE invoices ADD COLUMN payment_status TEXT DEFAULT 'Pending'
    `, (err) => {
        if (err) {
            if (err.message.includes('duplicate column')) {
                console.log('✓ Column payment_status already exists in invoices table');
            } else {
                console.error('✗ Error adding payment_status column:', err.message);
            }
        } else {
            console.log('✓ Added payment_status column to invoices table');
        }
    });

    // Create email_history table
    db.run(`
        CREATE TABLE IF NOT EXISTS email_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER,
            recipient_email TEXT,
            subject TEXT,
            sent_at TEXT,
            status TEXT,
            error_message TEXT,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id)
        )
    `, (err) => {
        if (err) {
            console.error('✗ Error creating email_history table:', err.message);
        } else {
            console.log('✓ Created email_history table');
        }
    });

    // Create index on email_history for faster lookups
    db.run(`
        CREATE INDEX IF NOT EXISTS idx_email_history_invoice ON email_history(invoice_id)
    `, (err) => {
        if (err) {
            console.error('✗ Error creating email_history index:', err.message);
        } else {
            console.log('✓ Created index on email_history table');
        }
    });

    // Update existing invoices to have default status
    db.run(`
        UPDATE invoices SET payment_status = 'Pending' WHERE payment_status IS NULL
    `, (err) => {
        if (err) {
            console.error('✗ Error updating existing invoices:', err.message);
        } else {
            console.log('✓ Updated existing invoices with default payment status');
        }
    });

    console.log('\n✅ Migration completed successfully!');

    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        process.exit(0);
    });
});
