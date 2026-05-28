<?php require_once "config/database.php"; $db = (new Database())->getConnection(); $stmt = $db->query("DESCRIBE asset_check;"); echo json_encode($stmt->fetchAll()); ?>
