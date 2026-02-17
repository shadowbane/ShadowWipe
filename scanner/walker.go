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
// It skips hidden files/dirs (prefix "."), symlinks, and zero-byte files.
func Walk(ctx context.Context, paths []string) ([]models.FileInfo, error) {
	var (
		mu    sync.Mutex
		files []models.FileInfo
	)

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

			// Skip hidden files and directories
			if strings.HasPrefix(name, ".") {
				if d.IsDir() {
					return fastwalk.SkipDir
				}
				return nil
			}

			// Skip directories (we only collect files)
			if d.IsDir() {
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

			// Skip zero-byte files
			if info.Size() == 0 {
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
