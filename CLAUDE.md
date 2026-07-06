# Ancestry Fan Chart Generator

## Project Overview
A client-side web app that generates interactive SVG ancestry fan charts from GEDCOM genealogy files. Pure vanilla JavaScript — no frameworks, no build step.

## Tech Stack
- **HTML/CSS/JS** — no frameworks, no bundler, no transpilation
- **SVG** — fan chart rendered directly to an `<svg>` element in the DOM
- **GEDCOM 5.5.1** — standard genealogy file format (`.ged`)

## File Structure
- `index.html` — main entry point (currently missing, referenced by `package.json` and `quick-start.html`)
- `app.js` — UI event handling, file upload, chart generation orchestration, person detail panel
- `fan-chart.js` — `FanChart` class: SVG rendering, segment drawing, color schemes, text layout, SVG export
- `gedcom-parser.js` — `GedcomParser` class: parses GEDCOM text into `individuals` (Map) and `families` (Map), provides ancestry/descendant traversal
- `styles.css` — all styling (controls panel, chart container, person details modal, responsive layout)
- `quick-start.html` — standalone guide page with usage instructions
- `package.json` — only dev dependency is `live-server`

## Running the App
```bash
npx live-server --port=8080
```
Or simply open `index.html` in a browser — no server required.

## Architecture Notes
- **GedcomParser** stores individuals and families in ES6 Maps keyed by GEDCOM `@ID@` (with `@` stripped)
- **FanChart** takes an SVG element + parser reference; generates ancestor arcs per generation using polar coordinate math
- Communication between chart and app uses a `CustomEvent('personSelected')` dispatched on the SVG element
- All data processing is in-browser — no network calls, no backend
- SVG export uses `XMLSerializer` + Blob download

## Key Configuration (fan-chart.js)
- `centerX/centerY`: 600 (SVG center point)
- `innerRadius`: 80 (center circle)
- `radiusIncrement`: 100 (width of each generation ring)
- Color schemes: `classic` (gender-based), `generation` (ring-based), `monochrome`, `pastel`

## Known Issues
- `index.html` is referenced but does not exist in the repo — needs to be created
- Text overlap occurs in narrow segments at higher generation counts
- Large trees (>1000 individuals) can be slow

## Conventions
- No build tools — edit files directly
- Vanilla JS with ES6 classes (no modules/imports — scripts loaded via `<script>` tags)
- CSS uses grid layout for settings panel, flexbox elsewhere
