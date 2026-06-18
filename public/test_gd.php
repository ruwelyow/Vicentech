<?php
phpinfo();
echo "<hr>";
if (extension_loaded('gd')) {
    echo "<h2 style='color: green;'>✓ GD Extension is LOADED</h2>";
    $info = gd_info();
    echo "<pre>";
    print_r($info);
    echo "</pre>";
} else {
    echo "<h2 style='color: red;'>✗ GD Extension is NOT LOADED</h2>";
    echo "<p>Please enable it in php.ini and restart the web server.</p>";
}

