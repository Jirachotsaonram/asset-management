<?php
require_once 'config/database.php';
require_once 'controllers/AssetController.php';
require_once 'controllers/ReportController.php';
require_once 'utils/Response.php';

// Mock the authentication environment if needed
function authenticate() {
    return ['user_id' => 1, 'username' => 'admin', 'role' => 'Admin'];
}

/*
// Since AuditTrailController is already modified by me, I can test it too
require_once 'controllers/AuditTrailController.php';
*/

$database = new Database();
$db = $database->getConnection();

echo "--- Testing Asset Pagination ---\n";
$_GET['page'] = 1;
$_GET['limit'] = 5;
$assetCtrl = new AssetController();

ob_start();
try {
    $assetCtrl->getAll();
} catch (Exception $e) {
    echo "Caught: " . $e->getMessage() . "\n";
}
$output = ob_get_clean();
$json = json_decode($output, true);

if ($json && isset($json['success']) && $json['success']) {
    echo "Asset getAll() success!\n";
    if (isset($json['data']['total'])) {
        echo "Total assets found: " . $json['data']['total'] . "\n";
        echo "Items returned: " . count($json['data']['items']) . "\n";
    } else {
        echo "Items returned (legacy array): " . count($json['data']) . "\n";
    }
} else {
    echo "Asset getAll() failed or returned unexpected result.\n";
    echo $output . "\n";
}

echo "\n--- Testing Report Summary (Optimized View) ---\n";
$reportCtrl = new ReportController();
ob_start();
try {
    $reportCtrl->assetSummary();
} catch (Exception $e) {
    echo "Caught: " . $e->getMessage() . "\n";
}
$output = ob_get_clean();
$json = json_decode($output, true);

if ($json && isset($json['success']) && $json['success']) {
    echo "Report assetSummary() success!\n";
    echo "Summary items returned: " . count($json['data']) . "\n";
    if (count($json['data']) > 0) {
        echo "Sample item keys: " . implode(', ', array_keys($json['data'][0])) . "\n";
        // Check if building_name and floor are present (from view)
        $sample = $json['data'][0];
        if (isset($sample['building_name'])) {
            echo "View columns (building_name, floor) are present.\n";
        }
    }
} else {
    echo "Report assetSummary() failed.\n";
    echo $output . "\n";
}

echo "\n--- Verification Finished ---\n";
?>
