import React, { forwardRef } from 'react';

const InvoiceTemplate = forwardRef(({ data, invoiceNumber, date }, ref) => {
    const { researcher = {}, items = [], total = 0 } = data || {};

    // Helper to format currency
    const formatCurrency = (amount) => {
        return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
    };

    const totalVAT = total * 0.21;
    const totalWithVAT = total * 1.21;

    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans text-xs print:p-0 print:w-full max-w-[210mm] mx-auto">
            {/* Header with Logos */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-slate-300 pb-4">
                <div className="text-center w-1/3">
                    {/* Placeholder for UCM Logo */}
                    <div className="mb-2">
                        <span className="text-2xl font-serif font-bold text-red-800 block">UCM</span>
                    </div>
                    <p className="font-bold">UNIVERSIDAD COMPLUTENSE</p>
                    <p>MADRID</p>
                    <p className="mt-2 font-bold">N.I.F.: Q2818014I</p>
                </div>

                <div className="w-1/3 bg-slate-100 p-2 text-center text-xs border border-slate-300">
                    <h2 className="font-bold italic text-slate-700 text-sm">Servicio de GESTIÓN ECONÓMICA</h2>
                    <h2 className="font-bold italic text-slate-700 text-sm">DE INVESTIGACIÓN y CENTROS</h2>
                    <p className="text-[10px] mt-1">Centros de Asistencia a la Investigación (C.A.I.s)</p>
                    <p>Avda. de Séneca, 2 - 4ª planta</p>
                    <p>Tfno.: 913943503/04 - Fax.: 3445</p>
                    <p>e-mail.: jgarciae@ucm.es</p>
                </div>
            </div>

            {/* Invoice Number and Header Info */}
            <div className="flex justify-end mb-2 items-center">
                <h1 className="text-lg font-bold mr-2">ALBARÁN Nº</h1>
                <span className="bg-yellow-200 px-4 py-1 font-mono font-bold border border-slate-300">{invoiceNumber || 'PENDIENTE'}</span>
            </div>

            {/* Main Info Box */}
            <div className="border border-black mb-1">
                <div className="grid grid-cols-[150px_1fr_100px_1fr] border-b border-black">
                    <div className="p-1 font-bold border-r border-black">Código Centro:</div>
                    <div className="p-1 border-r border-black font-mono font-bold text-center">I5P0B717</div>
                    <div className="p-1 font-bold border-r border-black">Fecha:</div>
                    <div className="p-1 text-center">{date}</div>
                </div>
                <div className="grid grid-cols-[150px_1fr] border-b border-black">
                    <div className="p-1 font-bold border-r border-black">Usuario:</div>
                    <div className="p-1">{researcher?.fullName || '-'}</div>
                </div>
                <div className="grid grid-cols-[150px_1fr] border-b border-black">
                    <div className="p-1 font-bold border-r border-black">Empresa / Organismo:</div>
                    <div className="p-1">{researcher.institution}</div>
                </div>
                <div className="grid grid-cols-[150px_1fr] border-b border-black">
                    <div className="p-1 font-bold border-r border-black">Domicilio fiscal:</div>
                    <div className="p-1">{researcher.fiscalAddress || researcher.invoiceAddress || '-'}</div>
                </div>
                <div className="grid grid-cols-[150px_1fr]">
                    <div className="p-1 font-bold border-r border-black">C.I.F. ó N.I.F.:</div>
                    <div className="p-1">{researcher.idNumber || '-'}</div>
                </div>
            </div>

            {/* FACe Info Header */}
            <div className="bg-slate-300 border border-black border-t-0 p-1 text-center font-bold text-[10px] uppercase">
                DATOS A RELLENAR SI EL ORGANISMO ESTÁ ADHERIDO A FACe (Facturación electrónica) o similar CCAA
            </div>

            {/* FACe Info Box */}
            <div className="border border-black border-t-0 mb-4 text-[10px]">
                <div className="grid grid-cols-[100px_80px_100px_80px_110px_80px_80px_1fr]">
                    <div className="p-1 font-bold border-r border-black">Oficina Contable:</div>
                    <div className="p-1 border-r border-black text-center">{researcher.accountingOffice || '_______'}</div>
                    <div className="p-1 font-bold border-r border-black">Organo Gestor:</div>
                    <div className="p-1 border-r border-black text-center">{researcher.managementBody || '_______'}</div>
                    <div className="p-1 font-bold border-r border-black">Unidad Tramitadora:</div>
                    <div className="p-1 border-r border-black text-center">{researcher.processingUnit || '_______'}</div>
                    <div className="p-1 font-bold border-r border-black leading-tight">Organo Proponente:</div>
                    <div className="p-1 text-center">{researcher.proposingBody || '_______'}</div>
                </div>
                <div className="grid grid-cols-[180px_1fr] border-t border-black">
                    <div className="p-1 font-bold border-r border-black">Domicilio de envío documentación:</div>
                    <div className="p-1">{researcher.invoiceAddress || researcher.fiscalAddress || '-'}</div>
                </div>
                <div className="grid grid-cols-[180px_1fr] border-t border-black">
                    <div className="p-1 font-bold border-r border-black">Teléfono contacto y correo-e:</div>
                    <div className="p-1">{researcher.phone || ''} ; {researcher.email || ''}</div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-black text-[11px] mb-4">
                <thead>
                    <tr className="border-b border-black">
                        <th className="border-r border-black p-1 w-24">Nº</th>
                        <th className="border-r border-black p-1">DESCRIPCIÓN</th>
                        <th className="border-r border-black p-1 w-24">UNIDAD/TIEMPO</th>
                        <th className="border-r border-black p-1 w-28">PRECIO UNIDAD/TIEMPO</th>
                        <th className="p-1 w-28">PRECIO TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} className="h-6">
                            <td className="border-r border-black p-1 align-top">{item.registrationNumber}</td>
                            <td className="border-r border-black p-1 align-top">
                                {item.serviceName}
                                <span className="block text-[10px] text-slate-500 italic">Fecha: {item.entryDate}</span>
                            </td>
                            <td className="border-r border-black p-1 text-center align-top">{item.quantity}</td>
                            <td className="border-r border-black p-1 text-right align-top">
                                {(item.cost / item.quantity).toFixed(2)} €
                            </td>
                            <td className="p-1 text-right align-top">{item.cost.toFixed(2)} €</td>
                        </tr>
                    ))}
                    {/* Empty rows to fill space matching the image style roughly */}
                    {/* Empty rows to fill space matching the image style roughly */}
                    {[...Array(Math.max(0, 5 - items.length))].map((_, i) => (
                        <tr key={`empty-${i}`} className="h-6">
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className=""></td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t border-black">
                        <td colSpan="3" rowSpan="3" className="border-r border-black p-2 align-top text-left">
                            <span className="font-bold underline">OBSERVACIONES:</span>
                        </td>
                        <td className="border-r border-black p-1 font-bold text-right">TOTAL sin IVA.......</td>
                        <td className="p-1 text-right font-bold">{formatCurrency(total)}</td>
                    </tr>
                    <tr className="border-t border-slate-300">
                        <td className="border-r border-black p-1 font-bold text-right bg-yellow-100/50">
                            I.V.A. tipo: <span className="bg-yellow-200 px-1 ml-1">21.00%</span>
                        </td>
                        <td className="p-1 text-right">{formatCurrency(totalVAT)}</td>
                    </tr>
                    <tr className="border-t border-black font-bold">
                        <td className="border-r border-black p-1 text-right text-sm">TOTAL A PAGAR ....</td>
                        <td className="p-1 text-right text-sm">{formatCurrency(totalWithVAT)}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer Bank Info */}
            <div className="text-[11px] border-t-0 p-1">
                <div className="font-bold">Ingresar en: CAIXABANK</div>
                <div className="font-bold">Titular: Tesorería U.C.M. - Recaudatoria (Sección de Centros de Investigación)</div>
                <div className="flex justify-between">
                    <div className="font-bold">I.B.A.N.: ES05 2100 7770 5113 00076072</div>
                    <div className="font-bold">B.I.C.: CAIXESBBXXX</div>
                </div>
                <div className="font-bold mt-1">Haciendo constar Nº de Factura y C.A.I. que le ha prestado el servicio</div>
                <div className="font-bold text-base mt-2 text-center uppercase">SE RUEGA COMPRUEBEN DATOS BANCARIOS ANTES DE REALIZAR EL PAGO</div>
            </div>

            {/* Director Signature Placeholder */}
            <div className="absolute top-[50mm] left-4 border border-black p-2 w-48 text-center bg-white/90">
                <p className="text-[9px] mb-8">Sello y Firma del Director de la Unidad de Genómica</p>
                <div className="text-blue-600 font-bold opacity-50 rotate-[-10deg] text-xl border-4 border-blue-600 rounded-full p-2 inline-block">
                    SELLO CAI
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
