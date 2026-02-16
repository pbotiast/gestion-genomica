import http from 'http';

const SERVER_PORT = 3000;
const BASE_URL = `http://localhost:${SERVER_PORT}`;

console.log("🚀 Starting security verification against running server...");

// Start tests immediately
runTests();

async function runTests() {
    console.log("✅ Server assumed running. Running tests...");

    try {
        await testSecurityHeaders();
        await testInputValidation();
        await testRateLimiting();
        console.log("\n✨ All security tests passed!");
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        process.exitCode = 1;
    }
}

async function testSecurityHeaders() {
    console.log("\n🔹 Testing Security Headers...");
    const res = await fetch(`${BASE_URL}/api/login`, { method: 'POST' }); // Method doesn't matter for headers generally on middleware

    // Helmet headers
    const headers = [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Strict-Transport-Security'
    ];

    let missing = [];
    headers.forEach(h => {
        if (!res.headers.get(h.toLowerCase())) {
            // Strict-Transport-Security might not be set on http localhost by default helmet, but others should
            if (h !== 'Strict-Transport-Security') missing.push(h);
        }
    });

    if (missing.length > 0) {
        throw new Error(`Missing security headers: ${missing.join(', ')}`);
    }
    console.log("   ✅ Headers present for X-Frame-Options, CSP, etc.");
}

async function testInputValidation() {
    console.log("\n🔹 Testing Input Validation...");

    // Empty body
    const res = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });

    if (res.status === 400) {
        const data = await res.json();
        if (data.errors && data.errors.length > 0) {
            console.log("   ✅ Rejected empty body with 400 and errors.");
        } else {
            throw new Error("Got 400 but no error details.");
        }
    } else {
        throw new Error(`Expected 400 for empty login, got ${res.status}`);
    }

    // Invalid email format for researcher
    // Note: We need a token for this, so we might skip or mock login first.
    // Let's stick to login validation for now as it doesn't require auth.
}

async function testRateLimiting() {
    console.log("\n🔹 Testing Rate Limiting (Login)...");

    // We configured max 5 attempts
    const MAX_ATTEMPTS = 5;

    // Send 5 requests
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test', password: 'password' })
        });
    }

    // 6th request should fail
    const res = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'password' })
    });

    if (res.status === 429) {
        console.log("   ✅ Rate limit triggered (429) after 5 attempts.");
    } else {
        throw new Error(`Expected 429 after limit, got ${res.status}`);
    }
}
