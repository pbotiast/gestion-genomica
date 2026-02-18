// Dashboard Export Utilities - PDF and Excel
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'exceljs';

/**
 * Export dashboard data to PDF
 * @param {Object} stats - Dashboard statistics
 * @param {string} period - Selected period (week/month/quarter/year)
 */
export const exportDashboardPDF = (stats, period) => {
    try {
        console.log('Starting PDF export with stats:', stats);
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.text('Reporte de Dashboard', 14, 20);

        // Subtitle
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139); // slate-500
        const periodLabels = {
            week: 'Última Semana',
            month: 'Último Mes',
            quarter: 'Último Trimestre',
            year: 'Último Año',
            all: 'Todo el Histórico'
        };
        doc.text(`Período: ${periodLabels[period] || period}`, 14, 28);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 34);

        // KPI Summary
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Resumen de KPIs', 14, 45);

        const kpiData = [
            ['Total Solicitudes', stats.totalRequests || 0],
            ['Pendientes', stats.pendingRequests || 0],
            ['Facturadas', stats.invoicedRequests || 0],
            ['Ingresos Totales', `€${(stats.totalRevenue || 0).toLocaleString('es-ES')}`],
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Métrica', 'Valor']],
            body: kpiData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 10 }
        });

        // Requests Per Year
        if (stats.requestsPerYear && stats.requestsPerYear.length > 0) {
            doc.setFontSize(14);
            doc.text('Solicitudes por Año', 14, doc.lastAutoTable.finalY + 15);

            const yearData = stats.requestsPerYear.map(item => [
                item.year,
                item.count
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Año', 'Cantidad']],
                body: yearData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }
            });
        }

        // Top Services
        if (stats.servicePopularity && stats.servicePopularity.length > 0) {
            doc.addPage();
            doc.setFontSize(14);
            doc.text('Top 5 Servicios Más Solicitados', 14, 20);

            const serviceData = stats.servicePopularity.slice(0, 5).map(item => [
                item.serviceName,
                item.count,
                `€${(item.revenue || 0).toLocaleString('es-ES')}`
            ]);

            autoTable(doc, {
                startY: 25,
                head: [['Servicio', 'Solicitudes', 'Ingresos']],
                body: serviceData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }
            });
        }

        // Top Centers
        if (stats.centerStats && stats.centerStats.length > 0) {
            doc.setFontSize(14);
            doc.text('Top 5 Centros de Investigación', 14, doc.lastAutoTable.finalY + 15);

            const centerData = stats.centerStats.slice(0, 5).map(item => [
                item.centerName,
                item.requestCount,
                `€${(item.revenue || 0).toLocaleString('es-ES')}`
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Centro', 'Solicitudes', 'Ingresos']],
                body: centerData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }
            });
        }

        // Tariff Distribution
        if (stats.tariffDistribution && stats.tariffDistribution.length > 0) {
            doc.setFontSize(14);
            doc.text('Distribución por Tarifa', 14, doc.lastAutoTable.finalY + 15);

            const tariffData = stats.tariffDistribution.map(item => [
                `Tarifa ${item.tariff}`,
                item.count,
                `${item.percentage}%`
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Tarifa', 'Cantidad', 'Porcentaje']],
                body: tariffData,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] }
            });
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Página ${i} de ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Save
        const filename = `dashboard-report-${period}-${Date.now()}.pdf`;
        console.log('Saving PDF as:', filename);
        doc.save(filename);
        console.log('PDF export completed successfully');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error al generar PDF: ' + error.message);
    }
};

/**
 * Export dashboard data to Excel
 * @param {Object} stats - Dashboard statistics
 * @param {string} period - Selected period
 */
export const exportDashboardExcel = async (stats, period) => {
    const workbook = new XLSX.Workbook();

    workbook.creator = 'Gestión Genómica';
    workbook.created = new Date();

    // KPIs Sheet
    const kpiSheet = workbook.addWorksheet('KPIs');

    kpiSheet.columns = [
        { header: 'Métrica', key: 'metric', width: 30 },
        { header: 'Valor', key: 'value', width: 20 }
    ];

    kpiSheet.addRow({ metric: 'Período', value: period });
    kpiSheet.addRow({ metric: 'Fecha de generación', value: new Date().toLocaleDateString('es-ES') });
    kpiSheet.addRow({ metric: '', value: '' }); // Empty row
    kpiSheet.addRow({ metric: 'Total Solicitudes', value: stats.totalRequests || 0 });
    kpiSheet.addRow({ metric: 'Pendientes', value: stats.pendingRequests || 0 });
    kpiSheet.addRow({ metric: 'Facturadas', value: stats.invoicedRequests || 0 });
    kpiSheet.addRow({ metric: 'Ingresos Totales', value: `€${(stats.totalRevenue || 0).toLocaleString('es-ES')}` });

    // Style header
    kpiSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    kpiSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
    };

    // Requests by Year Sheet
    if (stats.requestsPerYear && stats.requestsPerYear.length > 0) {
        const yearSheet = workbook.addWorksheet('Solicitudes por Año');

        yearSheet.columns = [
            { header: 'Año', key: 'year', width: 15 },
            { header: 'Cantidad', key: 'count', width: 15 }
        ];

        stats.requestsPerYear.forEach(item => {
            yearSheet.addRow({ year: item.year, count: item.count });
        });

        // Style header
        yearSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        yearSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
    }

    // Services Sheet
    if (stats.servicePopularity && stats.servicePopularity.length > 0) {
        const serviceSheet = workbook.addWorksheet('Servicios');

        serviceSheet.columns = [
            { header: 'Servicio', key: 'name', width: 40 },
            { header: 'Solicitudes', key: 'count', width: 15 },
            { header: 'Ingresos', key: 'revenue', width: 20 }
        ];

        stats.servicePopularity.forEach(item => {
            serviceSheet.addRow({
                name: item.serviceName,
                count: item.count,
                revenue: `€${(item.revenue || 0).toLocaleString('es-ES')}`
            });
        });

        // Style header
        serviceSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        serviceSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
    }

    // Centers Sheet
    if (stats.centerStats && stats.centerStats.length > 0) {
        const centerSheet = workbook.addWorksheet('Centros');

        centerSheet.columns = [
            { header: 'Centro', key: 'name', width: 40 },
            { header: 'Solicitudes', key: 'count', width: 15 },
            { header: 'Ingresos', key: 'revenue', width: 20 }
        ];

        stats.centerStats.forEach(item => {
            centerSheet.addRow({
                name: item.centerName,
                count: item.requestCount,
                revenue: `€${(item.revenue || 0).toLocaleString('es-ES')}`
            });
        });

        // Style header
        centerSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        centerSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
    }

    // Tariff Distribution Sheet
    if (stats.tariffDistribution && stats.tariffDistribution.length > 0) {
        const tariffSheet = workbook.addWorksheet('Distribución Tarifas');

        tariffSheet.columns = [
            { header: 'Tarifa', key: 'tariff', width: 15 },
            { header: 'Cantidad', key: 'count', width: 15 },
            { header: 'Porcentaje', key: 'percentage', width: 15 }
        ];

        stats.tariffDistribution.forEach(item => {
            tariffSheet.addRow({
                tariff: `Tarifa ${item.tariff}`,
                count: item.count,
                percentage: `${item.percentage}%`
            });
        });

        // Style header
        tariffSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        tariffSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
    }

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-report-${period}-${Date.now()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
};
