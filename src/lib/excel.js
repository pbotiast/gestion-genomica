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
