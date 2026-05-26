<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "OPcache cleared successfully.<br>";
} else {
    echo "OPcache is not enabled or opcache_reset() is disabled.<br>";
}

if (function_exists('apcu_clear_cache')) {
    apcu_clear_cache();
    echo "APCu cache cleared successfully.<br>";
}
echo "All caches cleared!";
?>
