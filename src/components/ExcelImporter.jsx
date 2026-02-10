import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { cn } from '../lib/utils';

const ExcelImporter = ({ onImport, type, templateHeaders }) => {
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [message, setMessage] = useState('');

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setStatus('uploading');
        setMessage('Procesando archivo...');

        try {
            const data = await parseExcel(file);
            await onImport(data);
            setStatus('success');
            setMessage(`Importación de ${type} completada exitosamente.`);

            // Reset after delay
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
                if (fileInputRef.current) fileInputRef.current.value = '';
            }, 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage(error.message || 'Error al importar datos.');
        }
    };

    const parseExcel = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Header 1 gives array of arrays

                    if (jsonData.length < 2) throw new Error("El archivo está vacío o no tiene datos.");

                    const headers = jsonData[0];
                    // Validate headers if needed (simplified check)
                    // console.log("Headers:", headers);

                    const rows = jsonData.slice(1);
                    const mappedData = rows.map(row => {
                        // Map row to object based on type
                        // This mapping would ideally be passed as prop or handled by parent, 
                        // but logic here keeps this component focused on the file act.
                        // Actually, let's just return the raw rows (array of objects if we use sheet_to_json normally)
                        return row;
                    }).filter(r => r.length > 0);

                    // Re-read as object to get keys automatically if headers match
                    const objectData = XLSX.utils.sheet_to_json(sheet);
                    resolve(objectData);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsBinaryString(file);
        });
    };

    return (
        <div className="p-4 border rounded-lg bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <FileSpreadsheet size={18} />
                    Importar {type}
                </h3>
                {templateHeaders && (
                    <div className="text-xs text-slate-500">
                        Columnas requeridas: {templateHeaders.join(', ')}
                    </div>
                )}
            </div>

            <div className="flex gap-4 items-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={status === 'uploading'}
                    className={cn(
                        "btn-secondary text-sm py-1.5",
                        status === 'uploading' && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Upload size={16} className="inline mr-2" />
                    Seleccionar Excel
                </button>

                {status === 'success' && (
                    <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle size={16} /> {message}
                    </span>
                )}
                {status === 'error' && (
                    <span className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle size={16} /> {message}
                    </span>
                )}
                {status === 'uploading' && (
                    <span className="text-indigo-600 text-sm animate-pulse">
                        {message}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ExcelImporter;
