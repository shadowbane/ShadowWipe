package models

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// ScanSettings holds all user-configurable scan parameters.
// Persisted to disk so the app reopens exactly where the user left off.
type ScanSettings struct {
	Paths               []string `json:"paths"`
	MinFileSize         int64    `json:"min_file_size"`
	MinFileSizeUnit     string   `json:"min_file_size_unit"`
	ExcludedDirs        []string `json:"excluded_dirs"`
	SimilarityThreshold float64  `json:"similarity_threshold"`
	SkipHidden          bool     `json:"skip_hidden"`
}

// DefaultSettings returns sensible defaults for a fresh install.
func DefaultSettings() ScanSettings {
	return ScanSettings{
		Paths:           []string{},
		MinFileSize:     0,
		MinFileSizeUnit: "KB",
		ExcludedDirs: []string{
			".git", ".svn", ".hg",
			"node_modules", "vendor", "__pycache__",
			".DS_Store", "Thumbs.db",
		},
		SimilarityThreshold: 0,
		SkipHidden:          true,
	}
}

// settingsPath returns the path to the settings JSON file.
func settingsPath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "ShadowWipe", "settings.json"), nil
}

// LoadSettings reads settings from disk. Returns defaults if the file
// is missing or corrupt.
func LoadSettings() ScanSettings {
	p, err := settingsPath()
	if err != nil {
		return DefaultSettings()
	}

	data, err := os.ReadFile(p)
	if err != nil {
		return DefaultSettings()
	}

	var s ScanSettings
	if err := json.Unmarshal(data, &s); err != nil {
		return DefaultSettings()
	}

	// Ensure excluded_dirs is never nil (for JSON serialization)
	if s.ExcludedDirs == nil {
		s.ExcludedDirs = []string{}
	}
	if s.Paths == nil {
		s.Paths = []string{}
	}

	return s
}

// SaveSettings writes settings to disk, creating the directory if needed.
func SaveSettings(s ScanSettings) error {
	p, err := settingsPath()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(p, data, 0o644)
}

// MinFileSizeBytes returns the effective minimum file size in bytes,
// converting from the user-selected unit.
func (s ScanSettings) MinFileSizeBytes() int64 {
	switch s.MinFileSizeUnit {
	case "MB":
		return s.MinFileSize * 1024 * 1024
	default: // "KB"
		return s.MinFileSize * 1024
	}
}
