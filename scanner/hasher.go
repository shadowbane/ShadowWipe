package scanner

import (
	"context"
	"encoding/hex"
	"io"
	"os"
	"runtime"

	"folder-cleaner-go/models"

	"github.com/zeebo/blake3"
	"golang.org/x/sync/errgroup"
)

const (
	partialChunkSize = 64 * 1024   // 64KB for partial hash
	fullBufferSize   = 1024 * 1024 // 1MB read buffer for full hash
)

// PartialHash computes BLAKE3 hash of the first and last 64KB of each file.
// For files <= 128KB, the entire file is hashed.
func PartialHash(ctx context.Context, files []models.FileInfo) ([]models.FileInfo, error) {
	g, ctx := errgroup.WithContext(ctx)
	g.SetLimit(runtime.NumCPU())

	results := make([]models.FileInfo, len(files))
	copy(results, files)

	for i := range results {
		i := i
		g.Go(func() error {
			if ctx.Err() != nil {
				return ctx.Err()
			}

			hash, err := computePartialHash(results[i].Path, results[i].Size)
			if err != nil {
				// Silently skip files that fail to read
				return nil
			}
			results[i].PartialHash = hash
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}
	return results, nil
}

// FullHash computes BLAKE3 hash of the entire file content.
func FullHash(ctx context.Context, files []models.FileInfo) ([]models.FileInfo, error) {
	g, ctx := errgroup.WithContext(ctx)
	g.SetLimit(runtime.NumCPU())

	results := make([]models.FileInfo, len(files))
	copy(results, files)

	for i := range results {
		i := i
		g.Go(func() error {
			if ctx.Err() != nil {
				return ctx.Err()
			}

			hash, err := computeFullHash(results[i].Path)
			if err != nil {
				return nil
			}
			results[i].FullHash = hash
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}
	return results, nil
}

func computePartialHash(path string, size int64) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := blake3.New()

	// If file is small enough, hash the whole thing
	if size <= 2*partialChunkSize {
		if _, err := io.Copy(h, f); err != nil {
			return "", err
		}
		return hex.EncodeToString(h.Sum(nil)), nil
	}

	// Hash first 64KB
	buf := make([]byte, partialChunkSize)
	if _, err := io.ReadFull(f, buf); err != nil {
		return "", err
	}
	h.Write(buf)

	// Hash last 64KB
	if _, err := f.Seek(-partialChunkSize, io.SeekEnd); err != nil {
		return "", err
	}
	if _, err := io.ReadFull(f, buf); err != nil {
		return "", err
	}
	h.Write(buf)

	return hex.EncodeToString(h.Sum(nil)), nil
}

func computeFullHash(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := blake3.New()
	buf := make([]byte, fullBufferSize)
	if _, err := io.CopyBuffer(h, f, buf); err != nil {
		return "", err
	}

	return hex.EncodeToString(h.Sum(nil)), nil
}
