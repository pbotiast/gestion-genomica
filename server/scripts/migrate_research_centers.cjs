const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

/**
 * Script to populate research_centers table from existing researcher data
 * Extracts unique institutions/centers and creates research center records
 */

async function migrateResearchCenters() {
    return new Promise((resolve, reject) => {
        console.log('Starting research centers migration...\n');

        // Step 1: Get unique combinations of institution/center with their most common tariff
        const query = `
            SELECT 
                COALESCE(center, institution, 'Sin Centro Asignado') as centerName,
                tariff,
                COUNT(*) as researcherCount
            FROM researchers
            WHERE tariff IS NOT NULL
            GROUP BY centerName, tariff
            ORDER BY centerName, researcherCount DESC
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error querying researchers:', err);
                return reject(err);
            }

            console.log(`Found ${rows.length} unique center-tariff combinations:\n`);

            // Group by center name and pick the most common tariff
            const centerMap = new Map();
            rows.forEach(row => {
                if (!centerMap.has(row.centerName)) {
                    centerMap.set(row.centerName, {
                        name: row.centerName,
                        tariff: row.tariff,
                        researcherCount: row.researcherCount
                    });
                } else {
                    // Keep the tariff with more researchers
                    const existing = centerMap.get(row.centerName);
                    if (row.researcherCount > existing.researcherCount) {
                        centerMap.set(row.centerName, {
                            name: row.centerName,
                            tariff: row.tariff,
                            researcherCount: row.researcherCount
                        });
                    }
                }
            });

            const uniqueCenters = Array.from(centerMap.values());
            console.log(`Consolidated to ${uniqueCenters.length} unique centers:\n`);

            uniqueCenters.forEach(center => {
                console.log(`  - ${center.name} (Tarifa ${center.tariff}, ${center.researcherCount} investigadores)`);
            });

            // Step 2: Check what's already in research_centers
            db.all('SELECT * FROM research_centers', [], (err, existingCenters) => {
                if (err) {
                    console.error('Error reading research_centers:', err);
                    return reject(err);
                }

                console.log(`\nExisting research centers: ${existingCenters.length}`);

                // Step 3: Insert only new centers
                const insertStmt = db.prepare(`
                    INSERT OR IGNORE INTO research_centers (name, centerType, tariff)
                    VALUES (?, ?, ?)
                `);

                let insertedCount = 0;
                uniqueCenters.forEach(center => {
                    const exists = existingCenters.find(ec => ec.name === center.name);
                    if (!exists) {
                        const centerType = center.name.includes('UCM') || center.name.includes('Universidad Complutense')
                            ? 'Interno UCM'
                            : center.name === 'Sin Centro Asignado'
                                ? 'Sin Asignar'
                                : 'Externo';

                        insertStmt.run(center.name, centerType, center.tariff, function (err) {
                            if (err) {
                                console.error(`Error inserting ${center.name}:`, err);
                            } else {
                                insertedCount++;
                                console.log(`✓ Inserted: ${center.name} (ID: ${this.lastID})`);
                            }
                        });
                    } else {
                        console.log(`⊘ Skipped (exists): ${center.name}`);
                    }
                });

                insertStmt.finalize((err) => {
                    if (err) {
                        console.error('Error finalizing insert:', err);
                        return reject(err);
                    }

                    console.log(`\n✅ Migration complete! Inserted ${insertedCount} new centers.`);

                    // Step 4: Now update researchers to link to centers by name
                    console.log('\nUpdating researcher centerId references...');

                    db.all('SELECT id, name FROM research_centers', [], (err, centers) => {
                        if (err) {
                            console.error('Error fetching centers:', err);
                            return reject(err);
                        }

                        const updateStmt = db.prepare(`
                            UPDATE researchers 
                            SET centerId = ? 
                            WHERE (center = ? OR institution = ?) AND centerId IS NULL
                        `);

                        let updatedCount = 0;
                        centers.forEach(center => {
                            updateStmt.run(center.id, center.name, center.name, function (err) {
                                if (err) {
                                    console.error(`Error updating researchers for ${center.name}:`, err);
                                } else if (this.changes > 0) {
                                    updatedCount += this.changes;
                                    console.log(`✓ Linked ${this.changes} researchers to "${center.name}"`);
                                }
                            });
                        });

                        updateStmt.finalize((err) => {
                            if (err) {
                                console.error('Error finalizing update:', err);
                                return reject(err);
                            }

                            console.log(`\n✅ Updated ${updatedCount} researcher centerId links.`);
                            resolve({ inserted: insertedCount, updated: updatedCount });
                        });
                    });
                });
            });
        });
    });
}

// Run migration
migrateResearchCenters()
    .then(result => {
        console.log('\n=== MIGRATION SUMMARY ===');
        console.log(`Centers inserted: ${result.inserted}`);
        console.log(`Researchers linked: ${result.updated}`);
        console.log('=========================\n');
        db.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Migration failed:', err);
        db.close();
        process.exit(1);
    });
