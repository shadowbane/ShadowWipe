<div align="center">

# ShadowWipe

**Cross-Platform Duplicate File Finder & Cleaner**

[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![Wails](https://img.shields.io/badge/Wails-v2.11-DF0000?style=for-the-badge&logo=webassembly&logoColor=white)](https://wails.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.6+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg?style=for-the-badge)](https://polyformproject.org/licenses/noncommercial/1.0.0/)

[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square)]()
[![BLAKE3](https://img.shields.io/badge/Hashing-BLAKE3%20(SIMD)-orange?style=flat-square)](https://github.com/zeebo/blake3)
[![Perceptual Hash](https://img.shields.io/badge/Images-Perceptual%20Hash-green?style=flat-square)](https://github.com/corona10/goimagehash)

*A fast, native desktop application that finds duplicate and visually similar files using a multi-stage deduplication
pipeline. Built with Go and React.*

---

</div>

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Building from Source](#building-from-source)
- [Usage](#usage)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [License](#license)

## Overview

ShadowWipe is a desktop application for finding and cleaning duplicate files across your filesystem. It uses a
multi-stage hashing pipeline that progressively filters candidates at each stage — avoiding expensive full-file hashing
wherever possible. For images, it goes further with perceptual hashing to detect visually similar (but not
byte-identical) files.

Files are always sent to the system trash (never permanently deleted), so every operation is recoverable.

## Features

- **Multi-Stage Deduplication** — Size grouping, partial hash (64KB), full BLAKE3 hash, then perceptual hash for images
- **BLAKE3 Hashing** — SIMD-accelerated content hashing, significantly faster than SHA-256
- **Perceptual Image Matching** — Finds visually similar images (resized, re-compressed, cropped) via pHash
- **Parallel Processing** — Concurrent directory walking (fastwalk) and hashing (errgroup) saturate all CPU cores
- **Safe Deletion** — All deletions go through the system trash via wastebasket — always recoverable
- **Multi-Folder Scanning** — Add multiple directories to scan at once
- **Configurable Settings** — Min file size, similarity threshold, hidden file skipping, directory exclusions
- **Persistent Settings** — Configuration auto-saves and persists across sessions
- **Cross-Platform** — Runs natively on macOS, Linux, and Windows
- **Image Thumbnails** — Preview images directly in the duplicate list
- **Sort & Filter** — Sort by name/size/date, filter by file type (images, videos, documents, etc.)

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        1. Directory Walking                             │
│            fastwalk parallel traversal across all input dirs            │
│                  (skips hidden, symlinks, zero-byte)                    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        2. Size Grouping                                 │
│          Files with unique sizes can't be duplicates → discard          │
│                       (~90% filtered out)                               │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    3. Partial Hash (64KB)                               │
│         BLAKE3 hash of first + last 64KB of each file                   │
│           Unique partial hashes → discard (~95% filtered)               │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       4. Full Hash                                      │
│              BLAKE3 hash of entire file contents                        │
│                 Groups by hash → exact duplicates                       │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  5. Perceptual Hash (Images)                            │
│        pHash via goimagehash for jpg/png/gif/bmp/tiff/webp              │
│     Hamming distance comparison → visually similar image groups         │
└─────────────────────────────────────────────────────────────────────────┘
```

Each stage eliminates the vast majority of non-duplicates cheaply, so only a small fraction of files ever need expensive
full-content hashing.

## Screenshots

*Coming soon*

## Prerequisites

- **Go** 1.24 or later
- **Node.js** 18+ and npm
- **Wails CLI** v2

### Platform-specific

| Platform    | Requirements                                                                                                                      |
|-------------|-----------------------------------------------------------------------------------------------------------------------------------|
| **macOS**   | Xcode Command Line Tools (`xcode-select --install`)                                                                               |
| **Linux**   | `gcc`, `libgtk-3-dev`, `libwebkit2gtk-4.0-dev` (see [Wails Linux guide](https://wails.io/docs/gettingstarted/installation#linux)) |
| **Windows** | [WebView2 runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 11)                  |

## Installation

### Install Wails CLI

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

Verify the installation:

```bash
wails doctor
```

### From Source

```bash
# Clone the repository
git clone https://github.com/shadowbane/folder-cleaner-go.git
cd folder-cleaner-go

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run in development mode (hot reload)
wails dev

# Build production binary
wails build
```

The production binary will be in `build/bin/ShadowWipe`.

## Building from Source

### Development

```bash
# Start with hot reload (backend + frontend)
wails dev
```

This opens the app in a native window with live reloading. Frontend changes are reflected instantly; Go changes trigger
an automatic rebuild.

### Production Build

```bash
# Standard build
wails build

# Optimized build (stripped, compressed)
wails build -ldflags="-s -w"

# Build for specific platform (cross-compile)
wails build -platform darwin/arm64
wails build -platform linux/amd64
wails build -platform windows/amd64
```

### Running Tests

```bash
# Go tests
go test ./...

# Frontend type check
cd frontend && npx tsc --noEmit
```

## Usage

1. **Add directories** — Click "Add Directory" to select folders to scan
2. **Configure settings** — Click the gear icon to adjust scan parameters
3. **Start scan** — Click "Start Scan" to begin the deduplication pipeline
4. **Review duplicates** — Browse duplicate groups, preview images, sort and filter results
5. **Select & trash** — Check files to remove, then move them to system trash

## Configuration

Settings are accessible via the gear icon in the app header and auto-save on every change.

### General

| Setting                  | Description                                                         | Default |
|--------------------------|---------------------------------------------------------------------|---------|
| **Min file size**        | Ignore files smaller than this size (KB or MB)                      | `0 KB`  |
| **Similarity threshold** | Hamming distance for perceptual image matching (0 = disabled, 1-20) | `0`     |
| **Skip hidden files**    | Skip files and directories starting with `.`                        | `true`  |

### Exclusions

| Setting                  | Description                             | Default                                                                                  |
|--------------------------|-----------------------------------------|------------------------------------------------------------------------------------------|
| **Excluded directories** | Directory names to skip during scanning | `.git`, `.svn`, `.hg`, `node_modules`, `vendor`, `__pycache__`, `.DS_Store`, `Thumbs.db` |

### Config File Location

Settings are persisted as JSON:

| Platform    | Path                                                     |
|-------------|----------------------------------------------------------|
| **macOS**   | `~/Library/Application Support/ShadowWipe/settings.json` |
| **Linux**   | `~/.config/ShadowWipe/settings.json`                     |
| **Windows** | `%AppData%\ShadowWipe\settings.json`                     |

## Project Structure

```
folder-cleaner-go/
├── main.go                         # Wails app entry point
├── app.go                          # App struct (methods exposed to frontend)
├── wails.json                      # Wails project config
├── go.mod / go.sum
│
├── scanner/
│   ├── scanner.go                  # Multi-stage scan orchestrator
│   ├── walker.go                   # Parallel directory traversal (fastwalk)
│   ├── hasher.go                   # BLAKE3 partial + full hashing
│   ├── perceptual.go               # Perceptual image hashing (pHash)
│   └── grouper.go                  # Duplicate grouping logic
│
├── models/
│   ├── file_info.go                # File metadata struct
│   ├── duplicate_group.go          # Duplicate group struct
│   ├── settings.go                 # Settings load/save/defaults
│   └── operation.go                # Delete operation tracking
│
├── operations/
│   ├── trash.go                    # Safe deletion via wastebasket
│   └── open.go                     # Open file / reveal in file manager
│
├── thumbnail/
│   └── thumbnail.go                # Image thumbnail generation
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Main app component
│   │   ├── App.css                 # Global styles
│   │   ├── components/             # React UI components
│   │   ├── hooks/                  # Custom React hooks
│   │   └── types/                  # TypeScript type definitions
│   └── wailsjs/                    # Auto-generated Wails bindings
│
└── docs/
    └── PLAN.md                     # Full implementation plan
```

## Tech Stack

| Component              | Technology                                                                     | Why                                                                     |
|------------------------|--------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| **Framework**          | [Wails v2](https://wails.io/)                                                  | Lightweight native desktop framework for Go; auto-generates TS bindings |
| **Backend**            | [Go 1.24](https://go.dev/)                                                     | Fast compilation, built-in concurrency, simple error handling           |
| **Frontend**           | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Rich ecosystem, type safety, good Wails integration                     |
| **Bundler**            | [Vite](https://vitejs.dev/)                                                    | Fast HMR, native ES modules                                             |
| **Content Hashing**    | [BLAKE3](https://github.com/zeebo/blake3)                                      | SIMD-accelerated, faster than SHA-256/xxHash on large files             |
| **Directory Walking**  | [fastwalk](https://github.com/charlievieth/fastwalk)                           | Parallel traversal, 2-6x faster than `filepath.WalkDir`                 |
| **Perceptual Hashing** | [goimagehash](https://github.com/corona10/goimagehash)                         | pHash for visually similar image detection                              |
| **Safe Deletion**      | [wastebasket](https://github.com/Bios-Marcel/wastebasket)                      | Cross-platform system trash integration                                 |
| **Parallelism**        | [errgroup](https://pkg.go.dev/golang.org/x/sync/errgroup)                      | Bounded goroutine parallelism with error propagation                    |

## License

This project is licensed under
the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/).

### You are free to:

- **Use** — For personal, educational, research, and nonprofit purposes
- **Modify** — Make changes and create derivative works
- **Share** — Distribute copies of the software

### Restrictions:

- **NonCommercial** — You may not use this software for commercial purposes

For the full license text, see [LICENSE.md](LICENSE.md).

---

<div align="center">

**Made with :heart: by [Shadowbane](https://github.com/shadowbane)**

</div>
