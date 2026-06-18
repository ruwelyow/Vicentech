# Repository Overview

- **Framework**: Laravel (PHP)
- **Frontend tooling**: Vite, Tailwind, some vanilla JS/React in resources/js
- **Public assets**: Located under `public/`
- **Virtual tour**: `public/virtual-tour/` with vendor libs and tiles

## Notable Paths
- `app/`, `routes/`, `config/`, `database/` — standard Laravel structure
- `resources/` — frontend source (css, js, views)
- `public/` — web root (serves static files)
- `public/virtual-tour/` — virtual tour demo

## Virtual Tour Structure
- `index.html`: main page
- `index.js`: Marzipano wiring and interactions
- `data.js`: tour scene configuration
- `vendor/`: third-party libs (screenfull, bowser, marzipano, reset.css)
- `img/`: UI icons
- `tiles/`: panorama tiles per scene

## Local Dev Notes
- Ensure requests to `public/virtual-tour/vendor/*.js` are not routed to Laravel.
- Use a trailing slash when visiting `/virtual-tour/` or set `<base href="/virtual-tour/">` if served from that path.
- Run `php artisan serve` or your web server with document root pointing to `public/`.

## Build/Tools
- Node scripts via `package.json`
- PHP dependencies via Composer in `vendor/`

## Testing
- Basic PHPUnit scaffold in `tests/`

## Recent Changes
- Updated `public/virtual-tour/index.html` to use `./` relative asset paths and `<base href="./">` to avoid JS being fetched as HTML due to path resolution issues.