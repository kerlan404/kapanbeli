// Test script untuk API Analytics
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/analytics?range=7days',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('\nResponse:', JSON.parse(data));
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.end();
