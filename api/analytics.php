<?php
/**
 * Kapan Beli Analytics API
 * Sistem Analitik Pertumbuhan - PHP Native + MySQL
 * 
 * Features:
 * - New Users Analytics (Today, 7 Days, Month)
 * - Daily Login Analytics
 * - Growth Percentage Calculation
 * - Daily Active Users (DAU)
 * - Timezone: Asia/Jakarta (WIB)
 * 
 * API Endpoints:
 * GET /api/analytics.php?range=today|7days|month
 * GET /api/analytics.php?action=summary
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "range": "7days",
 *   "period": "7 Hari Terakhir",
 *   "timestamp": "2024-01-15T10:30:00+07:00",
 *   "timezone": "Asia/Jakarta",
 *   "summary": {
 *     "totalUsers": 150,
 *     "totalLogins": 500,
 *     "dailyActiveUsers": 45,
 *     "newUsers": 25,
 *     "growth": { ... }
 *   },
 *   "chart": {
 *     "labels": ["01 Jan", "02 Jan", ...],
 *     "users": [5, 3, 8, ...],
 *     "logins": [20, 15, 30, ...]
 *   }
 * }
 */

// ============================================
// CONFIGURATION
// ============================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET.'
    ]);
    exit();
}

// Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'kapanbeli');
define('TIMEZONE', 'Asia/Jakarta');
define('TIMEZONE_OFFSET', '+07:00');

// ============================================
// DATABASE CONNECTION
// ============================================
class Database {
    private $connection;
    
    public function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            
            // Set timezone
            $this->connection->exec("SET time_zone = '" . TIMEZONE_OFFSET . "'");
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ]);
            exit();
        }
    }
    
    public function getConnection() {
        return $this->connection;
    }
}

// ============================================
// ANALYTICS CLASS
// ============================================
class AnalyticsAPI {
    private $db;
    private $config;
    
    public function __construct($db) {
        $this->db = $db;
        $this->config = [
            'ranges' => [
                'today' => ['days' => 1, 'previousDays' => 1, 'label' => 'Hari Ini'],
                '7days' => ['days' => 7, 'previousDays' => 7, 'label' => '7 Hari Terakhir'],
                'month' => ['days' => 30, 'previousDays' => 30, 'label' => 'Bulan Ini']
            ]
        ];
    }
    
    /**
     * Main analytics endpoint
     */
    public function getAnalytics($range = '7days') {
        try {
            // Validate range
            if (!isset($this->config['ranges'][$range])) {
                return $this->errorResponse(
                    400, 
                    'Invalid range. Use: today, 7days, or month'
                );
            }
            
            // Get analytics data
            $analyticsData = $this->getAnalyticsData($range);
            $growthData = $this->calculateGrowthPercentage($range);
            
            // Build response
            $response = [
                'success' => true,
                'range' => $range,
                'period' => $this->config['ranges'][$range]['label'],
                'timestamp' => date('c'),
                'timezone' => TIMEZONE,
                'summary' => [
                    'totalUsers' => $analyticsData['totalUsers'],
                    'totalLogins' => $analyticsData['totalLogins'],
                    'dailyActiveUsers' => $analyticsData['dailyActiveUsers'],
                    'newUsers' => $analyticsData['newUsersCount'],
                    'growth' => $growthData
                ],
                'chart' => [
                    'labels' => $analyticsData['labels'],
                    'users' => $analyticsData['usersData'],
                    'logins' => $analyticsData['loginsData']
                ]
            ];
            
            return $this->jsonResponse($response);
            
        } catch (Exception $e) {
            return $this->errorResponse(500, 'Analytics error: ' . $e->getMessage());
        }
    }
    
    /**
     * Summary endpoint for dashboard cards
     */
    public function getSummary() {
        try {
            $db = $this->db;
            
            // Get summary data
            $totalUsers = $this->querySingle("SELECT COUNT(*) as count FROM users");
            $newUsersToday = $this->querySingle("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()");
            $loginsToday = $this->querySingle("SELECT COUNT(*) as count FROM login_logs WHERE DATE(login_at) = CURDATE()");
            $dau = $this->querySingle("SELECT COUNT(DISTINCT user_id) as count FROM login_logs WHERE DATE(login_at) = CURDATE()");
            $onlineUsers = $this->querySingle("
                SELECT COUNT(DISTINCT user_id) as count 
                FROM login_logs 
                WHERE login_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ");
            
            $response = [
                'success' => true,
                'data' => [
                    'totalUsers' => (int)$totalUsers,
                    'newUsersToday' => (int)$newUsersToday,
                    'loginsToday' => (int)$loginsToday,
                    'dailyActiveUsers' => (int)$dau,
                    'onlineUsers' => (int)$onlineUsers
                ],
                'timestamp' => date('c')
            ];
            
            return $this->jsonResponse($response);
            
        } catch (Exception $e) {
            return $this->errorResponse(500, 'Summary error: ' . $e->getMessage());
        }
    }
    
    /**
     * Get analytics data for specified range
     */
    private function getAnalyticsData($range) {
        $config = $this->config['ranges'][$range];
        $isToday = $range === 'today';
        $dateFormat = $isToday ? '%H:00' : '%Y-%m-%d';
        
        // Date conditions
        $userDateCondition = $isToday 
            ? 'DATE(created_at) = CURDATE()' 
            : "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL " . ($config['days'] - 1) . " DAY)";
        
        $loginDateCondition = $isToday
            ? 'DATE(login_at) = CURDATE()'
            : "DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL " . ($config['days'] - 1) . " DAY)";
        
        // Get new users per period
        $usersQuery = "
            SELECT 
                DATE_FORMAT(created_at, ?) as period,
                COUNT(*) as count
            FROM users
            WHERE {$userDateCondition}
            GROUP BY DATE_FORMAT(created_at, ?)
            ORDER BY period ASC
        ";
        $usersResults = $this->query($usersQuery, [$dateFormat, $dateFormat]);
        
        // Get logins per period
        $loginsQuery = "
            SELECT 
                DATE_FORMAT(login_at, ?) as period,
                COUNT(*) as count
            FROM login_logs
            WHERE {$loginDateCondition}
            GROUP BY DATE_FORMAT(login_at, ?)
            ORDER BY period ASC
        ";
        $loginsResults = $this->query($loginsQuery, [$dateFormat, $dateFormat]);
        
        // Get totals
        $totalUsers = (int)$this->querySingle("SELECT COUNT(*) as count FROM users");
        $totalLogins = (int)$this->querySingle("SELECT COUNT(*) as count FROM login_logs WHERE {$loginDateCondition}");
        $dailyActiveUsers = (int)$this->querySingle("SELECT COUNT(DISTINCT user_id) as count FROM login_logs WHERE {$loginDateCondition}");
        
        // Calculate new users count
        $newUsersCount = array_sum(array_column($usersResults, 'count'));
        
        // Generate chart data with zero-filling
        $chartData = $this->generateChartData($range, $usersResults, $loginsResults);
        
        return [
            'totalUsers' => $totalUsers,
            'totalLogins' => $totalLogins,
            'dailyActiveUsers' => $dailyActiveUsers,
            'newUsersCount' => $newUsersCount,
            'labels' => $chartData['labels'],
            'usersData' => $chartData['usersData'],
            'loginsData' => $chartData['loginsData']
        ];
    }
    
    /**
     * Generate chart data with zero-filling for missing dates
     */
    private function generateChartData($range, $usersResults, $loginsResults) {
        $labels = [];
        $usersData = [];
        $loginsData = [];
        $isToday = $range === 'today';
        $config = $this->config['ranges'][$range];
        
        // Generate date ranges
        $dateRanges = $this->generateDateRanges($range);
        
        // Convert results to associative arrays for lookup
        $usersMap = [];
        foreach ($usersResults as $row) {
            $usersMap[$row['period']] = (int)$row['count'];
        }
        
        $loginsMap = [];
        foreach ($loginsResults as $row) {
            $loginsMap[$row['period']] = (int)$row['count'];
        }
        
        // Fill data with zeros for missing dates
        foreach ($dateRanges as $date) {
            $labels[] = $this->formatLabel($date, $range);
            $usersData[] = isset($usersMap[$date]) ? $usersMap[$date] : 0;
            $loginsData[] = isset($loginsMap[$date]) ? $loginsMap[$date] : 0;
        }
        
        return ['labels' => $labels, 'usersData' => $usersData, 'loginsData' => $loginsData];
    }
    
    /**
     * Generate date ranges based on filter
     */
    private function generateDateRanges($range) {
        $ranges = [];
        $isToday = $range === 'today';
        $config = $this->config['ranges'][$range];
        
        if ($isToday) {
            // Generate 24 hours for today
            for ($i = 0; $i < 24; $i++) {
                $ranges[] = str_pad($i, 2, '0', STR_PAD_LEFT) . ':00';
            }
        } else {
            // Generate dates for 7 days or 30 days
            $days = $config['days'];
            for ($i = $days - 1; $i >= 0; $i--) {
                $date = new DateTime();
                $date->sub(new DateInterval("P{$i}D"));
                $ranges[] = $date->format('Y-m-d');
            }
        }
        
        return $ranges;
    }
    
    /**
     * Format label for chart display
     */
    private function formatLabel($date, $range) {
        if ($range === 'today') {
            return $date; // Format: 00:00, 01:00, etc.
        }
        
        // Format date in Indonesian locale
        $dateObj = DateTime::createFromFormat('Y-m-d', $date);
        $months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];
        
        return $dateObj->format('j') . ' ' . $months[(int)$dateObj->format('n') - 1];
    }
    
    /**
     * Calculate growth percentage compared to previous period
     */
    private function calculateGrowthPercentage($range) {
        $config = $this->config['ranges'][$range];
        $conditions = $this->getGrowthConditions($range);
        
        // Get user counts
        $prevUsers = (int)$this->querySingle("SELECT COUNT(*) as count FROM users WHERE {$conditions['prevUsers']}");
        $currUsers = (int)$this->querySingle("SELECT COUNT(*) as count FROM users WHERE {$conditions['currUsers']}");
        
        // Get login counts
        $prevLogins = (int)$this->querySingle("SELECT COUNT(*) as count FROM login_logs WHERE {$conditions['prevLogins']}");
        $currLogins = (int)$this->querySingle("SELECT COUNT(*) as count FROM login_logs WHERE {$conditions['currLogins']}");
        
        // Calculate percentages
        $usersGrowth = $this->calculatePercentage($prevUsers, $currUsers);
        $loginsGrowth = $this->calculatePercentage($prevLogins, $currLogins);
        
        return [
            'users' => [
                'current' => $currUsers,
                'previous' => $prevUsers,
                'percentage' => $usersGrowth,
                'trend' => $usersGrowth >= 0 ? 'up' : 'down'
            ],
            'logins' => [
                'current' => $currLogins,
                'previous' => $prevLogins,
                'percentage' => $loginsGrowth,
                'trend' => $loginsGrowth >= 0 ? 'up' : 'down'
            ]
        ];
    }
    
    /**
     * Get growth conditions for current and previous periods
     */
    private function getGrowthConditions($range) {
        if ($range === 'today') {
            return [
                'prevUsers' => 'DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)',
                'currUsers' => 'DATE(created_at) = CURDATE()',
                'prevLogins' => 'DATE(login_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)',
                'currLogins' => 'DATE(login_at) = CURDATE()'
            ];
        } elseif ($range === '7days') {
            return [
                'prevUsers' => 'DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
                'currUsers' => 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)',
                'prevLogins' => 'DATE(login_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
                'currLogins' => 'DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)'
            ];
        } else { // month
            return [
                'prevUsers' => 'DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 59 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)',
                'currUsers' => 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)',
                'prevLogins' => 'DATE(login_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 59 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)',
                'currLogins' => 'DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)'
            ];
        }
    }
    
    /**
     * Calculate percentage growth
     */
    private function calculatePercentage($previous, $current) {
        if ($previous === 0) {
            return $current > 0 ? 100.00 : 0.00;
        }
        return round((($current - $previous) / $previous) * 100, 2);
    }
    
    /**
     * Execute query with parameters
     */
    private function query($sql, $params = []) {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    /**
     * Execute query and return single value
     */
    private function querySingle($sql) {
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch();
        return $result['count'] ?? 0;
    }
    
    /**
     * JSON response helper
     */
    private function jsonResponse($data) {
        http_response_code(200);
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    /**
     * Error response helper
     */
    private function errorResponse($code, $message) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// ============================================
// ROUTING
// ============================================
try {
    // Initialize database
    $database = new Database();
    $analytics = new AnalyticsAPI($database->getConnection());
    
    // Get action parameter
    $action = isset($_GET['action']) ? $_GET['action'] : null;
    $range = isset($_GET['range']) ? $_GET['range'] : '7days';
    
    // Route handling
    if ($action === 'summary') {
        $analytics->getSummary();
    } else {
        $analytics->getAnalytics($range);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
