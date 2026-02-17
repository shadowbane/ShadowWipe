package models

// DuplicateKind indicates whether duplicates are exact or similar.
type DuplicateKind string

const (
	KindExact   DuplicateKind = "exact"
	KindSimilar DuplicateKind = "similar"
)

// DuplicateGroup represents a set of files identified as duplicates.
type DuplicateGroup struct {
	ID         string        `json:"id"`
	Kind       DuplicateKind `json:"kind"`
	Similarity float64       `json:"similarity"` // 0 for exact, 0-100 for similar
	Files      []FileInfo    `json:"files"`
	TotalSize  int64         `json:"total_size"`
	WastedSize int64         `json:"wasted_size"`
}
