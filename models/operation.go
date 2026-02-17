package models

// DeleteOperation records a batch of files moved to trash, enabling undo.
type DeleteOperation struct {
	ID           string   `json:"id"`
	DeletedPaths []string `json:"deleted_paths"`
	Timestamp    string   `json:"timestamp"` // ISO 8601
}
