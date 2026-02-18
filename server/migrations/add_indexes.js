// Migration script to add indexes for performance optimization
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath);

console.log('Creating database indexes for performance optimization...\n');

const indexes = [
    // Requests table indexes - most frequently queried
    { name: 'idx_requests_entry_date', sql: 'CREATE INDEX IF NOT EXISTS idx_requests_entry_date ON requests(entryDate)' },
    { name: 'idx_requests_researcher_id', sql: 'CREATE INDEX IF NOT EXISTS idx_requests_researcher_id ON requests(researcherId)' },
    { name: 'idx_requests_status', sql: 'CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status)' },
    { name: 'idx_requests_service_id', sql: 'CREATE INDEX IF NOT EXISTS idx_requests_service_id ON requests(serviceId)' },
    { name: 'idx_requests_invoice_id', sql: 'CREATE INDEX IF NOT EXISTS idx_requests_invoice_id ON requests(invoiceId)' },

    // Researchers table indexes
    { name: 'idx_researchers_center_id', sql: 'CREATE INDEX IF NOT EXISTS idx_researchers_center_id ON researchers(centerId)' },
    { name: 'idx_researchers_email', sql: 'CREATE INDEX IF NOT EXISTS idx_researchers_email ON researchers(email)' },

    // Research centers table indexes
    { name: 'idx_centers_tariff', sql: 'CREATE INDEX IF NOT EXISTS idx_centers_tariff ON research_centers(tariff)' },
    { name: 'idx_centers_type', sql: 'CREATE INDEX IF NOT EXISTS idx_centers_type ON research_centers(centerType)' },

    // Invoices table indexes
    { name: 'idx_invoices_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(createdAt)' },
    { name: 'idx_invoices_researcher_id', sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_researcher_id ON invoices(researcherId)' },
    { name: 'idx_invoices_number', sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoiceNumber)' },

    // Services table indexes
    { name: 'idx_services_name', sql: 'CREATE INDEX IF NOT EXISTS idx_services_name ON services(name)' },
];

let completed = 0;
let failed = 0;

db.serialize(() => {
    indexes.forEach((index, i) => {
        db.run(index.sql, (err) => {
            if (err) {
                console.error(`✗ Error creating ${index.name}:`, err.message);
                failed++;
            } else {
                console.log(`✓ Created ${index.name} (${i + 1}/${indexes.length})`);
                completed++;
            }

            if (completed + failed === indexes.length) {
                console.log(`\n✅ Indexing complete: ${completed} created, ${failed} failed`);
                db.close();
                process.exit(failed > 0 ? 1 : 0);
            }
        });
    });
});
