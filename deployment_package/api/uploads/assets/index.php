<?php
// ป้องกันการเข้าถึงโฟลเดอร์โดยตรง
header('HTTP/1.0 403 Forbidden');
exit('Access denied');
?>