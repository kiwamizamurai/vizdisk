#!/bin/bash

# Generate macOS app icons from SVG
# Requires: librsvg (brew install librsvg)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ICON_SVG="$PROJECT_DIR/build/icon.svg"
ICON_PNG="$PROJECT_DIR/frontend/src/assets/images/logo-universal.png"
ICONSET_DIR="$PROJECT_DIR/build/VizDisk.iconset"

# Check which icon source to use (prefer SVG over PNG for better quality)
if [ -f "$ICON_SVG" ]; then
    ICON_SOURCE="$ICON_SVG"
    echo "Using SVG source: $ICON_SVG"
elif [ -f "$ICON_PNG" ]; then
    ICON_SOURCE="$ICON_PNG"
    echo "Using PNG source: $ICON_PNG"
else
    echo "❌ No icon source found (neither SVG nor PNG)"
    exit 1
fi

# Check tools based on icon source
if [[ "$ICON_SOURCE" == *.svg ]]; then
    # SVG source: need rsvg-convert
    if ! command -v rsvg-convert &> /dev/null; then
        echo "Installing librsvg..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install librsvg
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if command -v apt-get &> /dev/null; then
                sudo apt-get install -y librsvg2-bin
            elif command -v yum &> /dev/null; then
                sudo yum install -y librsvg2-tools
            fi
        else
            echo "❌ rsvg-convert not available for this platform"
            exit 1
        fi
    fi
else
    # PNG source: need ImageMagick
    if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
        echo "❌ ImageMagick not found. Please install it first."
        exit 1
    fi
fi

# Create iconset directory
rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

# Generate all required icon sizes for macOS
declare -a filenames=("icon_16x16.png" "icon_16x16@2x.png" "icon_32x32.png" "icon_32x32@2x.png" "icon_128x128.png" "icon_128x128@2x.png" "icon_256x256.png" "icon_256x256@2x.png" "icon_512x512.png" "icon_512x512@2x.png")
declare -a sizes=(16 32 32 64 128 256 256 512 512 1024)

echo "Generating icons..."
for i in "${!filenames[@]}"; do
    filename=${filenames[$i]}
    size=${sizes[$i]}
    echo "  ${filename} (${size}x${size})"
    
    if [[ "$ICON_SOURCE" == *.svg ]]; then
        # Use rsvg-convert for SVG
        rsvg-convert -w $size -h $size "$ICON_SOURCE" -o "$ICONSET_DIR/$filename"
    else
        # Use ImageMagick for PNG
        if command -v magick &> /dev/null; then
            magick convert "$ICON_SOURCE" -resize ${size}x${size} "$ICONSET_DIR/$filename"
        else
            convert "$ICON_SOURCE" -resize ${size}x${size} "$ICONSET_DIR/$filename"
        fi
    fi
done

# Generate .icns file (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Creating .icns file..."
    iconutil -c icns "$ICONSET_DIR" -o "$PROJECT_DIR/build/appicon.icns"
else
    echo "Skipping .icns generation (not macOS)"
fi

# Generate main app icon PNG (512x512)
echo "Creating main app icon PNG..."
if [[ "$ICON_SOURCE" == *.svg ]]; then
    rsvg-convert -w 512 -h 512 "$ICON_SOURCE" -o "$PROJECT_DIR/build/appicon.png"
else
    if command -v magick &> /dev/null; then
        magick convert "$ICON_SOURCE" -resize 512x512 "$PROJECT_DIR/build/appicon.png"
    else
        convert "$ICON_SOURCE" -resize 512x512 "$PROJECT_DIR/build/appicon.png"
    fi
fi


# Copy to Wails build directory (avoid copying to itself)
if [ -f "$PROJECT_DIR/wails.json" ]; then
    echo "Icon ready for Wails..."
    # File already exists at the correct location
fi

echo "✅ Icons generated successfully!"
echo "📁 Iconset: $ICONSET_DIR"
if [[ "$OSTYPE" == "darwin"* ]] && [ -f "$PROJECT_DIR/build/appicon.icns" ]; then
    echo "🎯 App icon: $PROJECT_DIR/build/appicon.icns"
fi
echo "🖼️ Main PNG: $PROJECT_DIR/build/appicon.png"

# List all generated files for debugging
echo ""
echo "📋 Generated files:"
find "$PROJECT_DIR/build" -name "*.png" -o -name "*.icns" | sort