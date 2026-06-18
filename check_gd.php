<?php
echo "PHP Version: " . PHP_VERSION . "\n\n";

if (extension_loaded('gd')) {
    echo "✓ GD Extension is LOADED\n\n";
    $info = gd_info();
    echo "GD Information:\n";
    print_r($info);
} else {
    echo "✗ GD Extension is NOT LOADED\n";
    echo "Please enable it in php.ini and restart the web server.\n";
}


