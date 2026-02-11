// import fetch from 'node-fetch'; // Native fetch used

const researcher = {
    fullName: "Dr. Juan Pérez",
    department: "Genética",
    faculty: "Biología",
    city: "Madrid",
    phone: "912345678",
    fax: "912345679",
    email: "juan.perez@uni.edu",
    center: "Centro de Biología Molecular",
    fiscalAddress: "Calle Principal 123",
    invoiceAddress: "Calle Pagos 456",
    accountingOffice: "Oficina 1",
    managementBody: "Gerencia",
    processingUnit: "Unidad A",
    proposingBody: "Consejo",
    idNumber: "12345678A",
    tariff: "A"
};

async function testImport() {
    try {
        console.log("Sending researcher data...");
        const response = await fetch('http://localhost:3000/api/researchers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(researcher)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response:", data);

        if (data.id && data.department === researcher.department) {
            console.log("SUCCESS: Researcher imported with new fields.");
        } else {
            console.error("FAILURE: Response missing fields or ID.");
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testImport();
