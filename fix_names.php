<?php
$file = 'asset_management_api/controllers/AuditTrailController.php';
$content = file_get_contents($file);
$content = str_replace('FROM AuditTrail at', 'FROM audittrail at', $content);
$content = str_replace('LEFT JOIN Users u', 'LEFT JOIN users u', $content);
$content = str_replace('LEFT JOIN Assets a', 'LEFT JOIN assets a', $content);
file_put_contents($file, $content);
echo "Replacement finished\n";
?>
