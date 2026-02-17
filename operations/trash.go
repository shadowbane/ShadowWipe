package operations

import (
	"fmt"
	"os"
	"time"

	"folder-cleaner-go/models"

	"github.com/Bios-Marcel/wastebasket/v2"
	"github.com/google/uuid"
)

// MoveToTrash safely moves the specified files to the system trash.
// It continues past individual failures and reports them in the result.
func MoveToTrash(paths []string) (*models.DeleteOperation, error) {
	if len(paths) == 0 {
		return nil, fmt.Errorf("no paths provided")
	}

	var deleted []string
	var failed []models.FailedDelete

	for _, p := range paths {
		if _, err := os.Stat(p); err != nil {
			failed = append(failed, models.FailedDelete{Path: p, Reason: "file not found"})
			continue
		}
		if err := wastebasket.Trash(p); err != nil {
			failed = append(failed, models.FailedDelete{Path: p, Reason: err.Error()})
			continue
		}
		deleted = append(deleted, p)
	}

	return &models.DeleteOperation{
		ID:           uuid.New().String(),
		DeletedPaths: deleted,
		FailedPaths:  failed,
		Timestamp:    time.Now().UTC().Format(time.RFC3339),
	}, nil
}
