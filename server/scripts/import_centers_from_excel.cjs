const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const ExcelJS = require('exceljs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

/**
 * Import research centers from Excel file with researcher assignments
 * Expected columns: InvestigadorPrincipal, Institucion, Tarifa
 */

async function importCentersFromExcel(excelPath) {
    console.log('=== IMPORTING RESEARCH CENTERS FROM EXCEL ===\n');
    console.log(`Reading file: ${excelPath}\n`);

    // Step 1: Read Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    const worksheet = workbook.worksheets[0];

    const data = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const investigador = row.getCell(1).value;
        const institucion = row.getCell(2).value;
        const tarifa = row.getCell(3).value;

        if (investigador && institucion && tarifa) {
            data.push({
                investigador: String(investigador).trim(),
                institucion: String(institucion).trim(),
                tarifa: String(tarifa).trim().toUpperCase()
            });
        }
    });

    console.log(`📊 Total rows read: ${data.length}\n`);

    // Step 2: Extract unique institutions with their most common tariff
    const institutionMap = new Map();
    data.forEach(row => {
        if (!institutionMap.has(row.institucion)) {
            institutionMap.set(row.institucion, {
                name: row.institucion,
                tariff: row.tarifa,
                count: 1
            });
        } else {
            const existing = institutionMap.get(row.institucion);
            existing.count++;
            // Keep the tariff if it's more specific (A > B > C in priority)
            if (row.tarifa < existing.tariff) {
                existing.tariff = row.tarifa;
            }
        }
    });

    const uniqueInstitutions = Array.from(institutionMap.values());
    console.log(`🏢 Unique institutions found: ${uniqueInstitutions.length}\n`);

    // Step 3: Determine centerType based on tariff
    const determineCenterType = (tariff) => {
        switch (tariff) {
            case 'A': return 'UCM';
            case 'B': return 'PUBLICO';
            case 'C': return 'PRIVADO';
            default: return 'PRIVADO';
        }
    };

    // Step 4: Insert centers into database
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Get existing centers
            db.all('SELECT id, name FROM research_centers', [], (err, existingCenters) => {
                if (err) {
                    console.error('Error reading existing centers:', err);
                    return reject(err);
                }

                console.log(`📋 Existing centers in DB: ${existingCenters.length}\n`);

                const insertStmt = db.prepare(`
                    INSERT INTO research_centers (name, centerType, tariff)
                    VALUES (?, ?, ?)
                `);

                let insertedCount = 0;
                const centerIdMap = new Map(); // Map institution name to center ID

                // Add existing centers to map
                existingCenters.forEach(center => {
                    centerIdMap.set(center.name, center.id);
                });

                // Insert new centers
                uniqueInstitutions.forEach(institution => {
                    const exists = existingCenters.find(ec => ec.name === institution.name);

                    if (!exists) {
                        const centerType = determineCenterType(institution.tariff);

                        insertStmt.run(institution.name, centerType, institution.tariff, function (err) {
                            if (err) {
                                console.error(`❌ Error inserting "${institution.name}":`, err.message);
                            } else {
                                insertedCount++;
                                centerIdMap.set(institution.name, this.lastID);
                                console.log(`✅ Created: "${institution.name}" (${centerType}, Tarifa ${institution.tariff})`);
                            }
                        });
                    } else {
                        console.log(`⊘ Skipped: "${institution.name}" (already exists)`);
                    }
                });

                insertStmt.finalize((err) => {
                    if (err) {
                        console.error('Error finalizing center insert:', err);
                        return reject(err);
                    }

                    console.log(`\n✅ Centers migration complete! Created ${insertedCount} new centers.\n`);

                    // Step 5: Update researchers to link to centers
                    console.log('🔗 Linking researchers to centers...\n');

                    // Wait a bit to ensure all inserts are complete
                    setTimeout(() => {
                        // Re-fetch all centers to get the IDs of newly inserted ones
                        db.all('SELECT id, name FROM research_centers', [], (err, allCenters) => {
                            if (err) {
                                console.error('Error fetching centers:', err);
                                return reject(err);
                            }

                            // Update centerIdMap with all centers
                            allCenters.forEach(center => {
                                centerIdMap.set(center.name, center.id);
                            });

                            const updateStmt = db.prepare(`
                                UPDATE researchers 
                                SET centerId = ?, center = ?, institution = ?, tariff = ?
                                WHERE fullName = ?
                            `);

                            let updatedCount = 0;
                            let notFoundCount = 0;
                            const notFound = [];

                            data.forEach(row => {
                                const centerId = centerIdMap.get(row.institucion);

                                if (centerId) {
                                    updateStmt.run(
                                        centerId,
                                        row.institucion,
                                        row.institucion,
                                        row.tarifa,
                                        row.investigador,
                                        function (err) {
                                            if (err) {
                                                console.error(`Error updating researcher "${row.investigador}":`, err.message);
                                            } else if (this.changes > 0) {
                                                updatedCount++;
                                            } else {
                                                notFoundCount++;
                                                notFound.push(row.investigador);
                                            }
                                        }
                                    );
                                } else {
                                    console.error(`⚠️  Center not found for institution: "${row.institucion}"`);
                                }
                            });

                            updateStmt.finalize((err) => {
                                if (err) {
                                    console.error('Error finalizing researcher update:', err);
                                    return reject(err);
                                }

                                console.log(`\n✅ Researcher linking complete!`);
                                console.log(`   - Updated: ${updatedCount} researchers`);
                                console.log(`   - Not found in DB: ${notFoundCount} researchers`);

                                if (notFound.length > 0 && notFound.length < 20) {
                                    console.log(`\n⚠️  Researchers not found in database:`);
                                    notFound.forEach(name => console.log(`   - ${name}`));
                                }

                                resolve({
                                    centersInserted: insertedCount,
                                    researchersUpdated: updatedCount,
                                    researchersNotFound: notFoundCount
                                });
                            });
                        });
                    }, 500);
                });
            });
        });
    });
}

// Main execution
const excelFilePath = process.argv[2];

if (!excelFilePath) {
    console.error('❌ Error: Please provide the Excel file path as argument');
    console.log('Usage: node import_centers_from_excel.cjs <path_to_excel_file>');
    console.log('Example: node import_centers_from_excel.cjs ../investigadores.xlsx');
    process.exit(1);
}

const fullPath = path.resolve(excelFilePath);

importCentersFromExcel(fullPath)
    .then(result => {
        console.log('\n=== IMPORT SUMMARY ===');
        console.log(`Centers created: ${result.centersInserted}`);
        console.log(`Researchers linked: ${result.researchersUpdated}`);
        console.log(`Researchers not found: ${result.researchersNotFound}`);
        console.log('======================\n');
        db.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Import failed:', err);
        db.close();
        process.exit(1);
    });
