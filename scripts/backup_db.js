import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../server/database.sqlite');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate timestamped filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `database_${timestamp}.sqlite`);

// Copy database file
try {
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`✅ Database backed up to: ${backupPath}`);
} catch (error) {
    console.error('❌ Error backing up database:', error);
    process.exit(1);
}

// Optional: Prune old backups (keep last 7 days)
const MAX_BACKUPS = 7;
try {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('database_') && file.endsWith('.sqlite'))
        .map(file => ({
            name: file,
            time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Newest first

    if (files.length > MAX_BACKUPS) {
        const toDelete = files.slice(MAX_BACKUPS);
        toDelete.forEach(file => {
            const filePath = path.join(BACKUP_DIR, file.name);
            fs.unlinkSync(filePath);
            console.log(`🗑️  Deleted old backup: ${file.name}`);
        });
    }
} catch (err) {
    console.warn("⚠️ Warning: Could not prune old backups", err.message);
}
