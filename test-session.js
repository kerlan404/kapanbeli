// Test session sederhana
const http = require('http');

// Test 1: Login
const loginData = JSON.stringify({
    email: 'admin@kapanbeli.com',
    password: 'admin123'
});

const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

const loginReq = http.request(loginOptions, (res) => {
    console.log('=== LOGIN RESPONSE ===');
    console.log(`Status: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    
    let cookie = '';
    if (res.headers['set-cookie']) {
        cookie = res.headers['set-cookie'][0];
        console.log('Set-Cookie:', cookie);
    }
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Body:', JSON.parse(data));
        
        // Test 2: Access protected route with cookie
        if (cookie) {
            const protectedOptions = {
                hostname: 'localhost',
                port: 3000,
                path: '/admin/user/18',
                method: 'GET',
                headers: {
                    'Cookie': cookie.split(';')[0] // Send only the session cookie
                }
            };
            
            console.log('\n=== TESTING PROTECTED ROUTE ===');
            const protectedReq = http.request(protectedOptions, (res2) => {
                console.log(`Status: ${res2.statusCode}`);
                let data2 = '';
                res2.on('data', (chunk) => data2 += chunk);
                res2.on('end', () => {
                    console.log('Body:', data2);
                });
            });
            
            protectedReq.on('error', (e) => console.error('Error:', e.message));
            protectedReq.end();
        }
    });
});

loginReq.on('error', (e) => console.error('Login Error:', e.message));
loginReq.write(loginData);
loginReq.end();

console.log('=== SENDING LOGIN REQUEST ===');
