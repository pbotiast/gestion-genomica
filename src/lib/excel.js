import * as XLSX from 'xlsx';

export const parseServicesExcel = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Transform data to match our model
                // Expected columns: Servicio, Formato, Precio A, Precio B, Precio C
                const services = jsonData.map(row => ({
                    name: row['Servicio'] || row['Nombre'] || '',
                    format: row['Formato'] || '',
                    priceA: row['Precio A'] || row['Tarifa A'] || 0,
                    priceB: row['Precio B'] || row['Tarifa B'] || 0,
                    priceC: row['Precio C'] || row['Tarifa C'] || 0,
                })).filter(s => s.name); // Filter empty rows

                resolve(services);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

export const generateBillingExcel = (groupedData, period) => {
    return new Promise((resolve, reject) => {
        try {
            // Iterate over each group to create separate files
            groupedData.forEach(group => {
                const wb = XLSX.utils.book_new();
                const rows = [];
                const { researcher, items, total } = group;

                rows.push(['Investigador:', researcher.fullName]);
                rows.push(['Institución:', researcher.institution]);
                rows.push(['Centro:', researcher.center || '']);
                rows.push(['CIF/NIF:', researcher.idNumber || '']);
                rows.push(['Dirección Fiscal:', researcher.fiscalAddress || '']);
                rows.push(['Periodo:', `${period.start} - ${period.end}`]);
                rows.push([]);

                rows.push(['Servicio', 'Formato', 'Cantidad', 'Precio Unitario', 'Total']);

                items.forEach(item => {
                    const quantity = item.quantity || item.finalSamplesCount || item.samplesCount || 1;
                    const unitPrice = item.cost / quantity;

                    // Concatenate additional info if present
                    let serviceDisplayName = item.serviceName || 'Servicio eliminado';
                    if (item.additionalInfo && item.additionalInfo.trim() !== '') {
                        serviceDisplayName += ` - ${item.additionalInfo}`;
                    }

                    rows.push([
                        serviceDisplayName,
                        item.format || '-',
                        quantity,
                        unitPrice,
                        item.cost
                    ]);
                });

                rows.push([]);
                rows.push(['', '', '', 'Subtotal:', total]);
                rows.push(['', '', '', 'IVA (21%):', total * 0.21]);
                rows.push(['', '', '', 'TOTAL A PAGAR:', total * 1.21]);
                rows.push([]);
                rows.push(['--------------------------------------------------']);
                rows.push([]);

                const ws = XLSX.utils.aoa_to_sheet(rows);

                // Apply number format to Price and Total columns (Columns D=3 and E=4)
                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cell_address = { c: C, r: R };
                        const cell_ref = XLSX.utils.encode_cell(cell_address);
                        const cell = ws[cell_ref];

                        if (cell && cell.t === 'n') {
                            if (C === 3 || C === 4) { // Columns D and E
                                cell.z = '#,##0.00 "€"';
                            }
                        }
                    }
                }

                // Adjust column widths
                ws['!cols'] = [
                    { wch: 40 }, // Service Name (wider for additional info)
                    { wch: 15 }, // Format
                    { wch: 10 }, // Quantity
                    { wch: 15 }, // Unit Price
                    { wch: 15 }  // Total
                ];

                XLSX.utils.book_append_sheet(wb, ws, "Factura");

                // File name: ResearcherName_Date.xlsx
                // Sanitize filename
                const safeName = researcher.fullName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const dateStr = new Date().toISOString().split('T')[0];
                const filename = `Factura_${safeName}_${dateStr}.xlsx`;

                XLSX.writeFile(wb, filename);
            });

            resolve();
        } catch (error) {
            reject(error);
        }
    });
};
