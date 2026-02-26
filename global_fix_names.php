<?php
$controllers = [
    'asset_management_api/controllers/ReportController.php',
    'asset_management_api/controllers/AssetController.php',
    'asset_management_api/controllers/UserController.php',
    'asset_management_api/controllers/AssetHistoryController.php',
    'asset_management_api/controllers/AuditTrailController.php',
    'asset_management_api/controllers/BorrowController.php',
    'asset_management_api/controllers/DashboardController.php',
    'asset_management_api/controllers/DepartmentController.php',
    'asset_management_api/controllers/LocationController.php',
    'asset_management_api/controllers/CheckScheduleController.php',
    'asset_management_api/controllers/ScheduleController.php',
    'asset_management_api/index.php'
];

$replacements = [
    'FROM Assets' => 'FROM assets',
    'JOIN Assets' => 'JOIN assets',
    'FROM Users' => 'FROM users',
    'JOIN Users' => 'JOIN users',
    'FROM Departments' => 'FROM departments',
    'JOIN Departments' => 'JOIN departments',
    'FROM Locations' => 'FROM locations',
    'JOIN Locations' => 'JOIN locations',
    'FROM Asset_Check' => 'FROM asset_check',
    'JOIN Asset_Check' => 'JOIN asset_check',
    'FROM Borrow' => 'FROM borrow',
    'JOIN Borrow' => 'JOIN borrow',
    'FROM AuditTrail' => 'FROM audittrail',
    'JOIN AuditTrail' => 'JOIN audittrail',
    'FROM Asset_History' => 'FROM asset_history',
    'JOIN Asset_History' => 'JOIN asset_history'
];

foreach ($controllers as $file) {
    if (file_exists($file)) {
        echo "Processing $file...\n";
        $content = file_get_contents($file);
        $original = $content;
        foreach ($replacements as $search => $replace) {
            $content = str_ireplace($search, $replace, $content);
        }
        if ($content !== $original) {
            file_put_contents($file, $content);
            echo "Updated $file\n";
        }
    }
}
echo "Global replacement finished\n";
?>
