/**
 * Dashboard Stats Manager
 * Module untuk mengelola statistik dashboard dengan auto-refresh
 * 
 * Cara penggunaan:
 * 1. Include script ini di HTML: <script src="/js/dashboard-stats.js"></script>
 * 2. Panggil DashboardStats.init() saat halaman dimuat
 * 3. Stats akan otomatis terupdate setiap 30 detik
 */

const DashboardStats = (function() {
    // Konfigurasi
    const CONFIG = {
        API_URL: '/api/dashboard/stats',
        QUICK_STATS_URL: '/api/dashboard/quick-stats',
        ALERTS_URL: '/api/dashboard/alerts',
        REFRESH_INTERVAL: 30000, // 30 detik
        DEBUG: true
    };

    // State
    let refreshTimer = null;
    let currentStats = null;
    let isInitialized = false;

    // Logger untuk debug
    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[DashboardStats]', ...args);
        }
    }

    /**
     * Fetch statistik dari API
     * @returns {Promise<Object>} Stats object
     */
    async function fetchStats() {
        try {
            log('Fetching stats from API...');
            
            const response = await fetch(CONFIG.API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin' // Include cookies untuk session
            });

            if (response.status === 401) {
                log('User not authenticated');
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                log('Stats received:', data.stats);
                currentStats = data.stats;
                return data.stats;
            } else {
                log('API returned error:', data.message);
                return null;
            }

        } catch (error) {
            console.error('[DashboardStats] Error fetching stats:', error);
            return null;
        }
    }

    /**
     * Update tampilan statistik di DOM
     * @param {Object} stats - Stats object dari API
     */
    function updateStatsDisplay(stats) {
        if (!stats) {
            log('No stats to display');
            return;
        }

        // Mapping antara property stats dan selector DOM
        const statMappings = [
            { key: 'totalProducts', selectors: ['#totalProducts', '.stat-total-products', '[data-stat="totalProducts"]'] },
            { key: 'lowStock', selectors: ['#lowStock', '.stat-low-stock', '[data-stat="lowStock"]'] },
            { key: 'shoppingList', selectors: ['#shoppingList', '.stat-shopping-list', '[data-stat="shoppingList"]'] },
            { key: 'expired', selectors: ['#expired', '.stat-expired', '[data-stat="expired"]'] },
            { key: 'expiringSoon', selectors: ['#expiringSoon', '.stat-expiring-soon', '[data-stat="expiringSoon"]'] },
            { key: 'totalNotes', selectors: ['#totalNotes', '.stat-total-notes', '[data-stat="totalNotes"]'] }
        ];

        // Update setiap stat
        statMappings.forEach(({ key, selectors }) => {
            const value = stats[key] ?? 0;
            
            // Coba setiap selector
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    elements.forEach(el => {
                        // Animasi angka jika ada
                        if (typeof animateNumber === 'function') {
                            animateNumber(el, value);
                        } else {
                            el.textContent = value;
                        }
                        log(`Updated ${key} (${selector}) to ${value}`);
                    });
                    break; // Stop setelah menemukan elemen pertama
                }
            }
        });

        // Update badge counts jika ada
        updateBadges(stats);

        log('All stats updated in DOM');
    }

    /**
     * Update badge/notification counts
     * @param {Object} stats 
     */
    function updateBadges(stats) {
        // Badge untuk shopping list
        const shoppingListBadges = document.querySelectorAll('.badge-shopping-list, [data-badge="shoppingList"]');
        shoppingListBadges.forEach(badge => {
            badge.textContent = stats.shoppingList || 0;
            badge.style.display = stats.shoppingList > 0 ? 'inline-block' : 'none';
        });

        // Badge untuk alerts (low stock + expired)
        const alertCount = (stats.lowStock || 0) + (stats.expired || 0);
        const alertBadges = document.querySelectorAll('.badge-alerts, [data-badge="alerts"]');
        alertBadges.forEach(badge => {
            badge.textContent = alertCount;
            badge.style.display = alertCount > 0 ? 'inline-block' : 'none';
        });
    }

    /**
     * Animasi angka (opsional, untuk efek visual)
     * @param {HTMLElement} element 
     * @param {number} target 
     */
    function animateNumber(element, target) {
        const current = parseInt(element.textContent) || 0;
        const increment = target > current ? 1 : -1;
        
        if (current !== target) {
            element.textContent = current + increment;
            setTimeout(() => animateNumber(element, target), 30);
        } else {
            element.textContent = target;
        }
    }

    /**
     * Load dan update stats
     */
    async function loadStats() {
        const stats = await fetchStats();
        if (stats) {
            updateStatsDisplay(stats);
            
            // Dispatch custom event untuk listener lain
            window.dispatchEvent(new CustomEvent('statsUpdated', { 
                detail: { stats, timestamp: new Date() }
            }));
        }
    }

    /**
     * Start auto-refresh
     */
    function startAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }

        log('Starting auto-refresh every', CONFIG.REFRESH_INTERVAL / 1000, 'seconds');
        
        refreshTimer = setInterval(() => {
            loadStats();
        }, CONFIG.REFRESH_INTERVAL);
    }

    /**
     * Stop auto-refresh
     */
    function stopAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
            log('Auto-refresh stopped');
        }
    }

    /**
     * Force refresh stats (manual trigger)
     */
    function refresh() {
        log('Manual refresh triggered');
        loadStats();
    }

    /**
     * Get current stats (cached)
     * @returns {Object|null}
     */
    function getCurrentStats() {
        return currentStats;
    }

    /**
     * Initialize Dashboard Stats
     * @param {Object} options - Configuration options
     */
    function init(options = {}) {
        if (isInitialized) {
            log('Already initialized');
            return;
        }

        // Merge options dengan config default
        Object.assign(CONFIG, options);

        log('Initializing with config:', CONFIG);

        // Load stats pertama kali
        loadStats();

        // Start auto-refresh
        startAutoRefresh();

        // Listen untuk event dari halaman lain
        window.addEventListener('productAdded', refresh);
        window.addEventListener('productUpdated', refresh);
        window.addEventListener('productDeleted', refresh);
        window.addEventListener('noteAdded', refresh);
        window.addEventListener('noteDeleted', refresh);

        // Cleanup saat halaman unload
        window.addEventListener('beforeunload', stopAutoRefresh);

        isInitialized = true;
        log('Dashboard Stats initialized successfully');
    }

    // Public API
    return {
        init,
        refresh,
        getCurrentStats,
        startAutoRefresh,
        stopAutoRefresh,
        fetchStats,
        CONFIG
    };

})();

// Auto-init jika DOM sudah loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DashboardStats.init();
    });
} else {
    DashboardStats.init();
}
