package operations

import (
	"fmt"
	"time"

	"folder-cleaner-go/models"

	"github.com/Bios-Marcel/wastebasket/v2"
	"github.com/google/uuid"
)

// MoveToTrash safely moves the specified files to the system trash.
func MoveToTrash(paths []string) (*models.DeleteOperation, error) {
	if len(paths) == 0 {
		return nil, fmt.Errorf("no paths provided")
	}

	for _, p := range paths {
		if err := wastebasket.Trash(p); err != nil {
			return nil, fmt.Errorf("failed to trash %s: %w", p, err)
		}
	}

	return &models.DeleteOperation{
		ID:           uuid.New().String(),
		DeletedPaths: paths,
		Timestamp:    time.Now().UTC().Format(time.RFC3339),
	}, nil
}
