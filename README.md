# Ancestry Fan Chart Generator

A beautiful web application for creating interactive ancestry fan charts from GEDCOM files.

## Features

- 📤 **GEDCOM File Support**: Upload standard GEDCOM genealogy files
- 🎯 **Customizable Center Person**: Select any person in your family tree as the center
- 📊 **Adjustable Generations**: Display 1-8 generations of ancestors
- 🎨 **Multiple Color Schemes**: Classic (gender-based), generation-based, monochrome, and pastel
- 🔤 **Font Customization**: Adjust font size and family
- 📅 **Flexible Data Display**: Show/hide birth years, death years, and country of origin
- 👶 **Descendants Support**: Optionally include descendants in the chart
- 💾 **Export to SVG**: Download your chart as a scalable vector graphic
- 🖱️ **Interactive**: Click on any person to view detailed information

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A GEDCOM file from your genealogy software

### Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd ancestry-fan-chart
```

2. Open the project in VS Code:
```bash
code .
```

3. Install the Live Server extension in VS Code (if not already installed):
   - Press `Ctrl+P` (or `Cmd+P` on Mac)
   - Type: `ext install ritwickdey.LiveServer`
   - Press Enter

### Running the Application

1. Right-click on `index.html` in VS Code
2. Select "Open with Live Server"
3. The application will open in your default browser

Alternatively, you can simply open `index.html` directly in your web browser.

## Usage

1. **Upload GEDCOM File**: Click the "Upload GEDCOM File" button and select your `.ged` file

2. **Select Center Person**: Choose the person you want to center the chart on from the dropdown menu

3. **Configure Settings**:
   - **Generations**: Adjust how many generations to display (1-8)
   - **Font Size**: Change the text size in the chart (6-20px)
   - **Font Family**: Select from various font options
   - **Display Options**: Toggle birth years, death years, and country of origin
   - **Descendants**: Enable to show descendants of the center person
   - **Color Scheme**: Choose your preferred color scheme

4. **Generate Chart**: Click "Generate Chart" to create your fan chart

5. **Interact**: 
   - Click on any person in the chart to view detailed information
   - Use the "Download SVG" button to save your chart

## File Structure

```
ancestry-fan-chart/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── gedcom-parser.js    # GEDCOM file parser
├── fan-chart.js        # Fan chart generator
├── app.js             # Main application logic
└── README.md          # This file
```

## GEDCOM Format

The application supports standard GEDCOM 5.5.1 format. It parses:
- Individual records (INDI)
- Family records (FAM)
- Birth and death dates/places
- Parent-child relationships
- Spouse relationships

## Customization

### Adding New Color Schemes

Edit the `colorSchemes` object in `fan-chart.js`:

```javascript
this.colorSchemes = {
    yourScheme: {
        male: '#YOUR_COLOR',
        female: '#YOUR_COLOR',
        unknown: '#YOUR_COLOR'
    }
};
```

### Adjusting Chart Dimensions

Modify the `config` object in `fan-chart.js`:

```javascript
this.config = {
    centerX: 600,           // Center X coordinate
    centerY: 600,           // Center Y coordinate
    innerRadius: 80,        // Radius of center circle
    radiusIncrement: 100,   // Width of each generation ring
    // ...
};
```

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Known Limitations

- Large family trees (>1000 individuals) may take time to load
- Text may overlap in segments with very narrow angles
- Mobile support is limited for very large charts

## Future Enhancements

- [ ] PDF export
- [ ] PNG/JPG export
- [ ] Print optimization
- [ ] Family tree navigation
- [ ] Search functionality
- [ ] Timeline view
- [ ] Share links

## License

MIT License - feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

## Credits

Created with ❤️ for family history enthusiasts.
