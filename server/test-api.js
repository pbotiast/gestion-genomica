// Quick diagnostic script to test API endpoints
const API_URL = 'http://localhost:3000/api';

async function testLogin() {
    console.log('🔐 Testing login...');
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (data.token) {
            console.log('✅ Login successful! Token:', data.token.substring(0, 20) + '...');
            return data.token;
        } else {
            console.log('❌ No token received');
            return null;
        }
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        return null;
    }
}

async function testEndpoint(endpoint, token) {
    console.log(`\n📡 Testing ${endpoint}...`);
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: headers
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${endpoint} - Returned ${Array.isArray(data) ? data.length : 'N/A'} items`);
            if (Array.isArray(data) && data.length > 0) {
                console.log('Sample:', data[0]);
            }
        } else {
            const text = await response.text();
            console.log(`❌ ${endpoint} - Error:`, text);
        }
    } catch (error) {
        console.error(`❌ ${endpoint} - Failed:`, error.message);
    }
}

async function runDiagnostics() {
    console.log('🏥 API Diagnostics Starting...\n');

    // Test login first
    const token = await testLogin();

    if (!token) {
        console.log('\n❌ Cannot proceed without token. Check backend logs.');
        return;
    }

    // Test endpoints with token
    await testEndpoint('/researchers', token);
    await testEndpoint('/requests', token);
    await testEndpoint('/services', token);
    await testEndpoint('/centers', token);
    await testEndpoint('/associates', token);
    await testEndpoint('/dashboard/stats', token);

    console.log('\n✅ Diagnostics complete!');
}

runDiagnostics();
