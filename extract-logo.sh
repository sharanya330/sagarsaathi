#!/bin/bash

# Extract a frame from the animation video to use as static logo
# This requires ffmpeg to be installed

VIDEO_PATH="frontend/public/assets/logo-animation.mp4"
OUTPUT_PATH="frontend/public/assets/logo.png"

if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed"
    echo "Install it with: brew install ffmpeg"
    exit 1
fi

if [ ! -f "$VIDEO_PATH" ]; then
    echo "Error: Video file not found at $VIDEO_PATH"
    exit 1
fi

echo "Extracting logo frame from video..."
ffmpeg -i "$VIDEO_PATH" -ss 00:00:02 -vframes 1 -q:v 2 "$OUTPUT_PATH" -y

if [ $? -eq 0 ]; then
    echo "Success! Logo saved to $OUTPUT_PATH"
    echo "You may want to edit this image to:"
    echo "- Remove background (make transparent)"
    echo "- Crop to logo only"
    echo "- Resize to optimal size (512x512px recommended)"
else
    echo "Failed to extract logo from video"
    exit 1
fi
