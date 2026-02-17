package models

// DeleteOperation records a batch of files moved to trash, enabling undo.
type DeleteOperation struct {
	ID           string         `json:"id"`
	DeletedPaths []string       `json:"deleted_paths"`
	FailedPaths  []FailedDelete `json:"failed_paths"`
	Timestamp    string         `json:"timestamp"` // ISO 8601
}

// FailedDelete records a file that could not be trashed and why.
type FailedDelete struct {
	Path   string `json:"path"`
	Reason string `json:"reason"`
}
