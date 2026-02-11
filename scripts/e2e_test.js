
const API_URL = 'http://localhost:3000/api';

async function runE2ETest() {
    console.log("=== STARTING E2E SYSTEM TEST ===\n");

    try {
        // 1. Create Technician
        console.log("1. CREATING TECHNICIAN...");
        const techName = `Tech_${Date.now()}`;
        const techRes = await fetch(`${API_URL}/technicians`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: techName })
        });
        if (!techRes.ok) throw new Error("Failed to create technician");
        console.log(`   ✅ Technician created: ${techName}`);

        // 2. Create Researcher
        console.log("\n2. CREATING RESEARCHER...");
        const resName = `Researcher_${Date.now()}`;
        const resRes = await fetch(`${API_URL}/researchers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: resName,
                institution: "Test Institute",
                email: "test@example.com",
                tariff: "A"
            })
        });
        if (!resRes.ok) throw new Error("Failed to create researcher");
        const researcher = await resRes.json();
        console.log(`   ✅ Researcher created: ${researcher.fullName} (ID: ${researcher.id})`);

        // 3. Add Associate (Authorized User)
        console.log("\n3. ADDING ASSOCIATE (AUTHORIZED USER)...");
        const assocName = `Associate_${Date.now()}`;
        const assocRes = await fetch(`${API_URL}/researchers/${researcher.id}/associates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: assocName,
                email: "super_student@example.com"
            })
        });
        if (!assocRes.ok) throw new Error("Failed to add associate");
        const associate = await assocRes.json();
        console.log(`   ✅ Associate added: ${associate.name} linked to Researcher ID ${associate.researcherId}`);

        // 4. Simulate Frontend Logic: Select Associate -> Find Researcher
        console.log("\n4. SIMULATING FRONTEND LOGIC (AUTO-FILL)...");
        // Fetch all associates
        const allAssocRes = await fetch(`${API_URL}/associates`);
        const allAssociates = await allAssocRes.json();

        // Find our associate
        const foundAssoc = allAssociates.find(a => a.name === assocName);
        if (!foundAssoc) throw new Error("Could not find created associate in global list");

        console.log(`   ✅ Found Associate in global list.`);

        if (foundAssoc.researcherId !== researcher.id) {
            throw new Error(`Mismatch! Associate linked to ${foundAssoc.researcherId}, expected ${researcher.id}`);
        }
        console.log(`   ✅ Linkage Verified: Associate points to correct Researcher ID.`);

        // 5. Create Request using this data
        console.log("\n5. CREATING REQUEST...");
        const reqData = {
            registrationNumber: `TEST-${Date.now()}`, // Normally auto-generated
            entryDate: new Date().toISOString().split('T')[0],
            researcherId: foundAssoc.researcherId, // Auto-filled from associate
            requestedBy: foundAssoc.name,          // User selection
            serviceId: 1, // Assuming service ID 1 exists (created in previous tests/seed)
            samplesCount: 5,
            technician: techName,
            status: 'pending'
        };

        const reqRes = await fetch(`${API_URL}/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqData)
        });

        if (!reqRes.ok) throw new Error(`Failed to create request: ${await reqRes.text()}`);
        const request = await reqRes.json();
        console.log(`   ✅ Request created successfully (ID: ${request.id})`);
        console.log(`      - Registration: ${request.registrationNumber}`);
        console.log(`      - Researcher ID: ${request.researcherId}`);
        console.log(`      - Requested By: ${request.requestedBy}`);

        console.log("\n=== CONGRATULATIONS! FULL SYSTEM TEST PASSED ===");

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
        process.exit(1);
    }
}

runE2ETest();
