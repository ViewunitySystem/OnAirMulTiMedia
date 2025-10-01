# Assets Directory

This directory contains media assets for the OnAirMulTiMedia landing page.

## Required Files

- `hero.mp4` - Background video for the landing page
- `cover.jpg` - Poster image for the video (fallback)

## Usage

The landing page (`index.html`) references these files:
- Video: `assets/hero.mp4`
- Poster: `assets/cover.jpg`

## Video Specifications

- **Format**: MP4 (H.264)
- **Resolution**: 1920x1080 or higher
- **Duration**: 10-30 seconds (looped)
- **File Size**: < 10MB recommended
- **Autoplay**: Muted, playsinline, loop

## Poster Specifications

- **Format**: JPG
- **Resolution**: 1920x1080
- **File Size**: < 500KB recommended
- **Purpose**: First frame shown before video loads

## Fallback

If video files are not available, the page will show a CSS gradient background instead.
