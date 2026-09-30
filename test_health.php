<?php
header('Content-Type: application/json');

$checks = [];

// 1. Check PHP version
$checks['php_version'] = PHP_VERSION;

// 2. Check vendor/autoload.php
$vendorPath = __DIR__ . '/backend/vendor/autoload.php';
$checks['vendor_exists'] = file_exists($vendorPath);

// 3. Check .env
$envPath = __DIR__ . '/backend/.env';
$checks['env_exists'] = file_exists($envPath);

// 4. Check storage permissions
$storagePath = __DIR__ . '/backend/storage';
$checks['storage_writable'] = is_writable($storagePath);
$checks['logs_writable'] = is_writable($storagePath . '/logs');
$checks['cache_writable'] = is_writable(__DIR__ . '/backend/bootstrap/cache');

// 5. Test MySQL connection if .env exists
if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    preg_match('/DB_HOST=(.*)/', $envContent, $host);
    preg_match('/DB_PORT=(.*)/', $envContent, $port);
    preg_match('/DB_DATABASE=(.*)/', $envContent, $db);
    preg_match('/DB_USERNAME=(.*)/', $envContent, $user);
    preg_match('/DB_PASSWORD=(.*)/', $envContent, $pass);

    $dbHost = trim($host[1] ?? '127.0.0.1');
    $dbPort = trim($port[1] ?? '3306');
    $dbName = trim($db[1] ?? '');
    $dbUser = trim($user[1] ?? '');
    $dbPass = trim($pass[1] ?? '');

    $checks['db_config'] = [
        'host' => $dbHost,
        'database' => $dbName,
        'username' => $dbUser,
    ];

    try {
        $pdo = new PDO("mysql:host={$dbHost};port={$dbPort};dbname={$dbName}", $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3,
        ]);
        $checks['db_connection'] = 'SUCCESS';

        // Check tables count
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $checks['tables_count'] = count($tables);
        $checks['tables'] = $tables;

        // Check categories count
        if (in_array('categories', $tables)) {
            $stmt = $pdo->query("SELECT count(*) FROM categories");
            $checks['categories_count'] = $stmt->fetchColumn();
        }
    } catch (\Throwable $e) {
        $checks['db_connection'] = 'FAILED: ' . $e->getMessage();
    }
}

// 6. Check storage/app/public contents
$publicStoragePath = __DIR__ . '/backend/storage/app/public';
$checks['public_storage_exists'] = is_dir($publicStoragePath);
if (is_dir($publicStoragePath)) {
    $checks['public_storage_folders'] = array_diff(scandir($publicStoragePath), ['.', '..']);
}

echo json_encode($checks, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
