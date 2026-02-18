// Script to hash passwords for existing users
import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite');

async function hashPassword(plainPassword) {
    return await bcrypt.hash(plainPassword, 10);
}

async function updateUserPasswords() {
    console.log('🔐 Hashing user passwords...\n');

    const users = [
        { username: 'admin', password: 'admin123' },
        { username: 'tecnico', password: 'tecnico123' }
    ];

    for (const user of users) {
        try {
            const hashedPassword = await hashPassword(user.password);

            db.run(
                `UPDATE users SET password = ? WHERE username = ?`,
                [hashedPassword, user.username],
                (err) => {
                    if (err) {
                        console.error(`❌ Error updating ${user.username}:`, err.message);
                    } else {
                        console.log(`✅ Updated ${user.username} with hashed password`);
                    }
                }
            );
        } catch (error) {
            console.error(`❌ Error hashing password for ${user.username}:`, error);
        }
    }

    setTimeout(() => {
        db.close();
        console.log('\n✅ Password hashing complete!');
        console.log('\nYou can now login with:');
        console.log('  Username: admin');
        console.log('  Password: admin123');
        process.exit(0);
    }, 1000);
}

updateUserPasswords();
