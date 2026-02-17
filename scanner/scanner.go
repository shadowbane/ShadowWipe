package scanner

import (
	"context"
	"fmt"

	"folder-cleaner-go/models"

	"github.com/google/uuid"
)

// ProgressCallback is called to report scan progress to the caller.
type ProgressCallback func(stage string, processed, total int)

// Scanner orchestrates the multi-stage deduplication pipeline.
type Scanner struct {
	paths      []string
	threshold  float64
	onProgress ProgressCallback
}

// New creates a new Scanner for the given directories.
func New(paths []string, threshold float64, onProgress ProgressCallback) *Scanner {
	return &Scanner{
		paths:      paths,
		threshold:  threshold,
		onProgress: onProgress,
	}
}

// Run executes the full deduplication pipeline and returns duplicate groups.
func (s *Scanner) Run(ctx context.Context) ([]models.DuplicateGroup, error) {
	// Stage 1: Walk directories
	s.onProgress("walking", 0, 0)
	files, err := Walk(ctx, s.paths)
	if err != nil {
		return nil, fmt.Errorf("walk: %w", err)
	}
	s.onProgress("walking", len(files), len(files))

	if err := ctx.Err(); err != nil {
		return nil, err
	}

	// Stage 2: Group by size — discard unique sizes
	sizeGroups := GroupBySize(files)
	candidates := flattenGroups(sizeGroups)
	if len(candidates) == 0 {
		return nil, nil
	}

	// Stage 3: Partial hash
	s.onProgress("partial-hashing", 0, len(candidates))
	candidates, err = PartialHash(ctx, candidates)
	if err != nil {
		return nil, fmt.Errorf("partial hash: %w", err)
	}
	s.onProgress("partial-hashing", len(candidates), len(candidates))

	if err := ctx.Err(); err != nil {
		return nil, err
	}

	// Stage 4: Group by partial hash — discard unique partial hashes
	partialGroups := GroupByHash(candidates, func(f models.FileInfo) string {
		return f.PartialHash
	})
	candidates = flattenGroups(partialGroups)
	if len(candidates) == 0 {
		return nil, nil
	}

	// Stage 5: Full hash
	s.onProgress("full-hashing", 0, len(candidates))
	candidates, err = FullHash(ctx, candidates)
	if err != nil {
		return nil, fmt.Errorf("full hash: %w", err)
	}
	s.onProgress("full-hashing", len(candidates), len(candidates))

	if err := ctx.Err(); err != nil {
		return nil, err
	}

	// Stage 6: Group by full hash — build duplicate groups
	fullGroups := GroupByHash(candidates, func(f models.FileInfo) string {
		return f.FullHash
	})

	return buildDuplicateGroups(fullGroups), nil
}

// flattenGroups collects all files from a map of groups into a single slice.
func flattenGroups[K comparable](groups map[K][]models.FileInfo) []models.FileInfo {
	var out []models.FileInfo
	for _, group := range groups {
		out = append(out, group...)
	}
	return out
}

// buildDuplicateGroups converts hash groups into DuplicateGroup structs.
func buildDuplicateGroups(groups map[string][]models.FileInfo) []models.DuplicateGroup {
	result := make([]models.DuplicateGroup, 0, len(groups))

	for _, files := range groups {
		if len(files) < 2 {
			continue
		}

		var totalSize int64
		for _, f := range files {
			totalSize += f.Size
		}
		wastedSize := totalSize - files[0].Size // all copies minus one

		result = append(result, models.DuplicateGroup{
			ID:         uuid.New().String(),
			Kind:       models.KindExact,
			Similarity: 0,
			Files:      files,
			TotalSize:  totalSize,
			WastedSize: wastedSize,
		})
	}

	return result
}
