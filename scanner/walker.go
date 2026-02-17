package scanner

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"folder-cleaner-go/models"

	"github.com/charlievieth/fastwalk"
)

// Walk traverses the given directories using fastwalk and returns file metadata.
// It filters by minSize (bytes), skips directories in excludedDirs (matched by
// base name), and optionally skips hidden files/dirs. Symlinks and zero-byte
// files are always skipped.
func Walk(ctx context.Context, paths []string, minSize int64, excludedDirs []string, skipHidden bool) ([]models.FileInfo, error) {
	var (
		mu    sync.Mutex
		files []models.FileInfo
	)

	// Build lookup set for excluded directory base names
	excludedSet := make(map[string]bool, len(excludedDirs))
	for _, d := range excludedDirs {
		excludedSet[d] = true
	}

	// Always skip zero-byte files
	if minSize < 1 {
		minSize = 1
	}

	conf := fastwalk.Config{
		NumWorkers: runtime.NumCPU(),
		Follow:     false,
	}

	for _, root := range paths {
		if err := ctx.Err(); err != nil {
			return nil, err
		}

		err := fastwalk.Walk(&conf, root, func(path string, d os.DirEntry, err error) error {
			if err != nil {
				return nil // skip files/dirs we can't access
			}

			// Check cancellation
			if ctx.Err() != nil {
				return ctx.Err()
			}

			name := d.Name()

			if d.IsDir() {
				// Skip excluded directories by base name
				if excludedSet[name] {
					return fastwalk.SkipDir
				}
				// Skip hidden directories
				if skipHidden && strings.HasPrefix(name, ".") {
					return fastwalk.SkipDir
				}
				return nil
			}

			// Skip hidden files
			if skipHidden && strings.HasPrefix(name, ".") {
				return nil
			}

			// Skip symlinks
			if d.Type()&os.ModeSymlink != 0 {
				return nil
			}

			info, err := d.Info()
			if err != nil {
				return nil // skip if we can't stat
			}

			// Skip files below minimum size
			if info.Size() < minSize {
				return nil
			}

			f := models.FileInfo{
				Path:      path,
				Name:      name,
				Extension: strings.ToLower(strings.TrimPrefix(filepath.Ext(name), ".")),
				Size:      info.Size(),
				Modified:  info.ModTime().Unix(),
			}

			mu.Lock()
			files = append(files, f)
			mu.Unlock()

			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	return files, nil
}
