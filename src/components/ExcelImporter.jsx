import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, FileUp } from 'lucide-react';
import { cn } from '../lib/utils';

const ExcelImporter = ({ onImport, type, templateHeaders }) => {
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error, dragging
    const [message, setMessage] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;

        // Check type
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            setStatus('error');
            setMessage('Formato no válido. Usa Excel (.xlsx, .xls)');
            return;
        }

        setStatus('uploading');
        setMessage('Procesando archivo...');

        try {
            const data = await parseExcel(file);
            await onImport(data);
            setStatus('success');
            setMessage(`Importación de ${type} completada exitosamente.`);

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

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
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
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                    if (jsonData.length < 2) throw new Error("El archivo está vacío o no tiene datos.");

                    // Re-read as object
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
        <div
            className={cn(
                "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center group",
                dragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50",
                status === 'error' && "border-red-300 bg-red-50",
                status === 'success' && "border-green-300 bg-green-50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleChange}
                accept=".xlsx, .xls"
                className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
                <div className={cn(
                    "p-3 rounded-full bg-slate-100 transition-colors group-hover:bg-white shadow-sm",
                    status === 'success' && "bg-green-100 text-green-600",
                    status === 'error' && "bg-red-100 text-red-600"
                )}>
                    {status === 'success' ? <CheckCircle size={24} /> :
                        status === 'error' ? <AlertCircle size={24} /> :
                            <FileUp size={24} className="text-slate-500 group-hover:text-blue-500" />}
                </div>

                <div className="space-y-1">
                    <p className="font-medium text-slate-700">
                        {status === 'idle' ? `Importar ${type}` :
                            status === 'uploading' ? 'Subiendo...' :
                                status === 'success' ? '¡Importado!' : 'Error'}
                    </p>

                    {status === 'idle' && (
                        <div className="text-sm text-slate-500">
                            <span className="cursor-pointer text-blue-600 hover:underline" onClick={() => fileInputRef.current?.click()}>
                                Haz click
                            </span> o arrastra el archivo aquí
                        </div>
                    )}

                    {(status === 'success' || status === 'error') && (
                        <p className={cn("text-xs font-medium", status === 'success' ? "text-green-600" : "text-red-500")}>
                            {message}
                        </p>
                    )}
                </div>

                {templateHeaders && status === 'idle' && (
                    <div className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                        Columnas: {templateHeaders.slice(0, 3).join(', ')}...
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExcelImporter;
