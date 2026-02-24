// Test script untuk debug error 500
const http = require('http');

// First, get session cookie by making a request
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users/17',
    method: 'DELETE',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('Testing DELETE /api/users/17...');
console.log('Sending request...');

const req = http.request(options, (res) => {
    console.log(`\n=== RESPONSE ===`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log(`\n=== RESPONSE BODY ===`);
        console.log('Raw:', data);
        try {
            const json = JSON.parse(data);
            console.log('Parsed:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Not JSON - plain text response');
        }
    });
});

req.on('error', (e) => {
    console.error('\n=== REQUEST ERROR ===');
    console.error(e.message);
    console.error('Stack:', e.stack);
});

req.end();

console.log('Request sent, waiting for response...');
