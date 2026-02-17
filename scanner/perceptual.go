package scanner

import (
	"context"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"os"
	"runtime"
	"strconv"
	"strings"

	"folder-cleaner-go/models"

	"github.com/corona10/goimagehash"
	"golang.org/x/sync/errgroup"
)

var imageExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true,
	".bmp": true, ".tiff": true, ".webp": true,
}

// PerceptualHash computes perceptual hashes for image files.
func PerceptualHash(ctx context.Context, files []models.FileInfo) ([]models.FileInfo, error) {
	g, ctx := errgroup.WithContext(ctx)
	g.SetLimit(runtime.NumCPU())

	results := make([]models.FileInfo, len(files))
	copy(results, files)

	for i := range results {
		ext := strings.ToLower(results[i].Extension)
		if !imageExtensions[ext] {
			continue
		}

		i := i
		g.Go(func() error {
			if ctx.Err() != nil {
				return ctx.Err()
			}

			hash, err := computePerceptualHash(results[i].Path)
			if err != nil {
				// Skip files that can't be decoded
				return nil
			}
			results[i].PerceptualHash = hash
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}
	return results, nil
}

func computePerceptualHash(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	img, _, err := image.Decode(f)
	if err != nil {
		return "", err
	}

	hash, err := goimagehash.PerceptionHash(img)
	if err != nil {
		return "", err
	}

	return strconv.FormatUint(hash.GetHash(), 16), nil
}
