package models

// FileInfo holds metadata about a single file discovered during scanning.
type FileInfo struct {
	Path           string `json:"path"`
	Size           int64  `json:"size"`
	Name           string `json:"name"`
	Extension      string `json:"extension"`
	Modified       int64  `json:"modified"` // Unix timestamp
	PartialHash    string `json:"partial_hash"`
	FullHash       string `json:"full_hash"`
	PerceptualHash string `json:"perceptual_hash"`
}
