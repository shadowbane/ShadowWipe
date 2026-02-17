package scanner

import (
	"folder-cleaner-go/models"
)

// GroupBySize groups files that share the same size.
// Files with unique sizes cannot be duplicates and are discarded.
func GroupBySize(files []models.FileInfo) map[int64][]models.FileInfo {
	groups := make(map[int64][]models.FileInfo)
	for _, f := range files {
		groups[f.Size] = append(groups[f.Size], f)
	}
	// Remove groups with only one file
	for size, group := range groups {
		if len(group) < 2 {
			delete(groups, size)
		}
	}
	return groups
}

// GroupByHash groups files that share the same hash value.
func GroupByHash(files []models.FileInfo, hashFn func(models.FileInfo) string) map[string][]models.FileInfo {
	groups := make(map[string][]models.FileInfo)
	for _, f := range files {
		key := hashFn(f)
		if key == "" {
			continue
		}
		groups[key] = append(groups[key], f)
	}
	// Remove groups with only one file
	for hash, group := range groups {
		if len(group) < 2 {
			delete(groups, hash)
		}
	}
	return groups
}
