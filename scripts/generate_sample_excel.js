import XLSX from 'xlsx';
import fs from 'fs';

const headers = [
    'InvestigadorPrincipal',
    'Departamento',
    'Facultad',
    'Ciudad',
    'Telefono',
    'FAX',
    'e-mail',
    'CIF',
    'Direiion Fiscal', // Intentional typo matching common variations or just literal
    'Direccion Factura',
    'Oficina Contable',
    'Organo Gestor',
    'Unidad Tramitadora',
    'Organo Proponente',
    'Tarifa'
];

// Correcting key mapping in my head: "Direccion Fiscal"
// The script should use the exact headers the user asked for.
const headersExact = [
    'InvestigadorPrincipal', 'Departamento', 'Facultad', 'Ciudad',
    'Telefono', 'FAX', 'e-mail', 'CIF', 'Direccion Fiscal',
    'Direccion Factura', 'Oficina Contable', 'Organo Gestor',
    'Unidad Tramitadora', 'Organo Proponente'
];

const data = [
    {
        'InvestigadorPrincipal': 'Dra. María García',
        'Departamento': 'Biología Celular',
        'Facultad': 'Ciencias',
        'Ciudad': 'Madrid',
        'Telefono': '911223344',
        'FAX': '911223345',
        'e-mail': 'maria.garcia@univ.es',
        'CIF': '12345678Z',
        'Direccion Fiscal': 'Av. Complutense s/n',
        'Direccion Factura': 'Calle Admin 1',
        'Oficina Contable': 'OC-001',
        'Organo Gestor': 'OG-100',
        'Unidad Tramitadora': 'UT-500',
        'Organo Proponente': 'OP-A',
        'Tarifa': 'A'
    },
    {
        'InvestigadorPrincipal': 'Dr. Pedro Rodriguez',
        'Departamento': 'Química Orgánica',
        'Facultad': 'Química',
        'Ciudad': 'Barcelona',
        'Telefono': '933445566',
        'FAX': '933445567',
        'e-mail': 'pedro.rodriguez@univ.cat',
        'CIF': '87654321X',
        'Direccion Fiscal': 'Gran Via 500',
        'Direccion Factura': 'Calle Finanzas 2',
        'Oficina Contable': 'OC-002',
        'Organo Gestor': 'OG-101',
        'Unidad Tramitadora': 'UT-501',
        'Organo Proponente': 'OP-B',
        'Tarifa': 'B'
    }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data, { header: headersExact });
XLSX.utils.book_append_sheet(wb, ws, "Investigadores");

const outputPath = './sample_researchers.xlsx';
XLSX.writeFile(wb, outputPath);

console.log(`Created ${outputPath}`);
