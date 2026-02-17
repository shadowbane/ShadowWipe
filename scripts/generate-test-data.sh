#!/usr/bin/env bash
set -euo pipefail

# Generate a test directory tree with nested folders and duplicate files.
# Usage: ./generate-test-data.sh [output_dir] [num_unique_files] [num_duplicates]

OUTPUT_DIR="${1:-./test-data}"
NUM_UNIQUE="${2:-20}"
NUM_DUPLICATES="${3:-30}"

# Clean up previous run
rm -rf "$OUTPUT_DIR"

# --- Generate random nested folder structure ---
FOLDERS=("$OUTPUT_DIR")

# Create 15-30 nested folders at varying depths
NUM_FOLDERS=$((RANDOM % 16 + 15))
for ((i = 0; i < NUM_FOLDERS; i++)); do
  # Pick a random existing folder as parent
  parent="${FOLDERS[$((RANDOM % ${#FOLDERS[@]}))]}"
  name="folder_$(printf '%03d' $i)_$(head -c 4 /dev/urandom | xxd -p)"
  dir="$parent/$name"
  mkdir -p "$dir"
  FOLDERS+=("$dir")
done

echo "Created ${#FOLDERS[@]} directories under $OUTPUT_DIR"

# --- Generate unique seed files ---
EXTENSIONS=("txt" "log" "csv" "json" "xml" "md" "dat" "cfg" "html" "py")
SEED_FILES=()

for ((i = 0; i < NUM_UNIQUE; i++)); do
  # Pick a random folder
  target="${FOLDERS[$((RANDOM % ${#FOLDERS[@]}))]}"
  ext="${EXTENSIONS[$((RANDOM % ${#EXTENSIONS[@]}))]}"
  filename="file_$(printf '%03d' $i).$ext"
  filepath="$target/$filename"

  # Generate random content (1KB - 100KB)
  size=$((RANDOM % 100 + 1))
  dd if=/dev/urandom of="$filepath" bs=1024 count="$size" 2>/dev/null

  SEED_FILES+=("$filepath")
done

echo "Created $NUM_UNIQUE unique seed files"

# --- Scatter duplicates across folders ---
dup_count=0
for ((i = 0; i < NUM_DUPLICATES; i++)); do
  # Pick a random seed file to duplicate
  source="${SEED_FILES[$((RANDOM % ${#SEED_FILES[@]}))]}"
  ext="${source##*.}"

  # Pick a random destination folder (different from source if possible)
  target="${FOLDERS[$((RANDOM % ${#FOLDERS[@]}))]}"
  dup_name="dup_$(printf '%03d' $i)_$(head -c 3 /dev/urandom | xxd -p).$ext"

  cp "$source" "$target/$dup_name"
  ((dup_count++))
done

echo "Created $dup_count duplicate files"

# --- Summary ---
total=$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')
dirs=$(find "$OUTPUT_DIR" -type d | wc -l | tr -d ' ')
echo ""
echo "=== Test data ready ==="
echo "  Root:        $OUTPUT_DIR"
echo "  Directories: $dirs"
echo "  Total files: $total"
echo "  Unique:      $NUM_UNIQUE"
echo "  Duplicates:  $dup_count"