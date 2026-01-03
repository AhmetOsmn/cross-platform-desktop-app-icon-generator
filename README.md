# Cross-Platform Desktop App Icon Generator

A CLI tool that converts images into platform-specific icon formats for Windows, Mac, and Linux desktop applications.

## Features

- 🖼️ **Single image input**: Convert any PNG, JPG, or WEBP image
- 🪟 **Windows**: Generate `.ico` files with multiple resolutions (16, 24, 32, 48, 256px)
- 🍎 **macOS**: Generate `.icns` files with all required sizes including Retina (16-1024px)
- 🐧 **Linux**: Generate PNG icons at standard sizes (16-512px)
- 📁 **Organized output**: Icons organized in platform-specific subfolders

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cross-platform-icon-generator.git
cd cross-platform-icon-generator

# Install dependencies
npm install

# Build the project
npm run build

# Link globally to use 'cpdaig' command from anywhere
npm link
```

> **Note:** After running `npm link`, you can use the `cpdaig` command from any directory in your terminal.

## Usage

### Basic Usage

```bash
# Generate icons for all platforms (if globally linked)
cpdaig ./path/to/your-logo.png

# Or without global linking
node dist/index.js ./path/to/your-logo.png
```

### Options

```bash
# Specify output directory
cpdaig ./logo.png --output ./my-icons

# Generate for specific platforms only
cpdaig ./logo.png --platforms windows,mac
cpdaig ./logo.png --platforms linux

# Overwrite existing output directory
cpdaig ./logo.png --force
```

### Help

```bash
cpdaig --help
```

## Output Structure

The tool creates a `{filename}-icons` folder in the same directory as your input image (or in your specified output directory). For example, if your input is `logo.png`:

```
logo-icons/
├── windows/
│   └── icon.ico          # Multi-resolution ICO file
├── mac/
│   └── icon.icns         # ICNS file with all sizes
└── linux/
    ├── 16x16.png
    ├── 24x24.png
    ├── 32x32.png
    ├── 48x48.png
    ├── 64x64.png
    ├── 128x128.png
    ├── 256x256.png
    └── 512x512.png
```

## Icon Sizes

### Windows (.ico)
- 16×16, 24×24, 32×32, 48×48, 256×256 pixels

### macOS (.icns)
- 16×16, 32×32 (16@2x), 64×64 (32@2x), 128×128, 256×256 (128@2x), 512×512 (256@2x), 1024×1024 (512@2x) pixels

### Linux (.png)
- 16×16, 24×24, 32×32, 48×48, 64×64, 128×128, 256×256, 512×512 pixels

## Recommendations

For best results:
- Use a **square image** (1:1 aspect ratio)
- Use a **high resolution** source image (at least 1024×1024 pixels)
- Use **PNG format** with transparency for the source image
- Ensure your icon is **simple and recognizable** at small sizes

## Requirements

- Node.js 18+
- npm

## Dependencies

- [sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- [commander](https://github.com/tj/commander.js/) - CLI framework
- [png-to-ico](https://github.com/nickytonline/png-to-ico) - PNG to ICO conversion

## License

MIT