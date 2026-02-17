package scanner

import (
	"context"

	"folder-cleaner-go/models"
)

// PerceptualHash computes perceptual hashes for image files.
func PerceptualHash(ctx context.Context, files []models.FileInfo) ([]models.FileInfo, error) {
	// TODO: Phase 4 implementation using corona10/goimagehash
	return files, nil
}
