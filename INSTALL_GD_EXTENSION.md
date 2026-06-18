# How to Install PHP GD Extension

The PHP GD extension is required for certificate generation. If you're seeing the error "The PHP GD extension is required, but is not installed", follow these steps:

## Windows (XAMPP/WAMP)

1. **Locate your php.ini file:**
   - Usually located in: `C:\xampp\php\php.ini` or `C:\wamp\bin\php\php[version]\php.ini`

2. **Open php.ini in a text editor** (as Administrator)

3. **Find the line:**
   ```ini
   ;extension=gd
   ```

4. **Remove the semicolon to uncomment it:**
   ```ini
   extension=gd
   ```

5. **Save the file**

6. **Restart your web server** (Apache in XAMPP/WAMP)

7. **Verify installation:**
   - Visit: `http://localhost/test_gd.php` (if you have the test file)
   - Or run: `php -m | findstr gd` in command prompt

## Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install php-gd
sudo systemctl restart apache2  # or nginx, php-fpm depending on your setup
```

## Linux (CentOS/RHEL)

```bash
sudo yum install php-gd
sudo systemctl restart httpd  # or nginx, php-fpm depending on your setup
```

## macOS (Homebrew)

```bash
brew install php-gd
# Or if using php installed via Homebrew:
pecl install gd
```

## Verify Installation

Create a test file `test_gd.php` in your public directory:

```php
<?php
if (extension_loaded('gd')) {
    echo "✓ GD Extension is LOADED";
    $info = gd_info();
    print_r($info);
} else {
    echo "✗ GD Extension is NOT LOADED";
}
```

Visit: `http://your-domain/test_gd.php`

## After Installation

1. Restart your web server
2. Clear any PHP opcache if enabled
3. Try generating a certificate again

## Troubleshooting

- If the extension still doesn't load, check PHP error logs
- Ensure you're editing the correct php.ini file (check with `php --ini`)
- On some systems, you may need to install additional dependencies:
  - `libpng-dev`
  - `libjpeg-dev`
  - `libfreetype6-dev`


