// Test script untuk mengecek API notes dan products
// Jalankan di browser console setelah login

async function testAPIs() {
    console.log('=== TESTING APIS ===\n');
    
    // Test 1: Check auth status
    console.log('1. Checking auth status...');
    const authRes = await fetch('/auth/status');
    const authData = await authRes.json();
    console.log('Auth:', authData);
    
    // Test 2: Fetch products stats
    console.log('\n2. Fetching products stats...');
    const statsRes = await fetch('/api/products/stats');
    console.log('Stats status:', statsRes.status);
    if (statsRes.ok) {
        const stats = await statsRes.json();
        console.log('Stats:', stats);
    }
    
    // Test 3: Fetch products
    console.log('\n3. Fetching products...');
    const prodRes = await fetch('/api/products');
    console.log('Products status:', prodRes.status);
    if (prodRes.ok) {
        const data = await prodRes.json();
        console.log('Products count:', data.products?.length || 0);
    }
    
    // Test 4: Fetch notes (CRITICAL)
    console.log('\n4. Fetching notes...');
    const notesRes = await fetch('/api/notes');
    console.log('Notes status:', notesRes.status);
    if (notesRes.ok) {
        const notesData = await notesRes.json();
        console.log('Notes count:', notesData.notes?.length || 0);
        console.log('Notes data:', notesData);
    }
    
    // Test 5: Check DOM elements
    console.log('\n5. Checking DOM elements...');
    const statsGrid = document.getElementById('statsGrid');
    console.log('Stats grid found:', !!statsGrid);
    
    if (statsGrid) {
        const statCards = statsGrid.querySelectorAll('.stat-card .stat-value');
        console.log('Stat cards found:', statCards.length);
        statCards.forEach((card, i) => {
            console.log(`  Card ${i+1}: ${card.textContent}`);
        });
    }
    
    console.log('\n=== TEST COMPLETE ===');
}

// Run the test
testAPIs();
