package main

import (
	"context"
	"fmt"
	"sync"

	"folder-cleaner-go/models"
	"folder-cleaner-go/operations"
	"folder-cleaner-go/scanner"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct holds application state and is the Wails binding target.
type App struct {
	ctx        context.Context
	mu         sync.Mutex
	scanning   bool
	cancelScan context.CancelFunc
	groups     []models.DuplicateGroup
	history    []models.DeleteOperation
}

// NewApp creates a new App application struct.
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// BuildInfo holds version and build metadata returned to the frontend.
type BuildInfo struct {
	Version   string `json:"version"`
	BuildTime string `json:"build_time"`
	BuildOS   string `json:"build_os"`
	BuildArch string `json:"build_arch"`
}

// GetVersion returns the app version (injected at build time from git tag).
func (a *App) GetVersion() string {
	return Version
}

// GetBuildInfo returns full build metadata.
func (a *App) GetBuildInfo() BuildInfo {
	return BuildInfo{
		Version:   Version,
		BuildTime: BuildTime,
		BuildOS:   BuildOS,
		BuildArch: BuildArch,
	}
}

// SelectDirectory opens a native directory picker and returns the selected path.
func (a *App) SelectDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Directory to Scan",
	})
}

// GetSettings returns the persisted scan settings (or defaults).
func (a *App) GetSettings() models.ScanSettings {
	return models.LoadSettings()
}

// SaveSettings persists the given scan settings to disk.
func (a *App) SaveSettings(settings models.ScanSettings) error {
	return models.SaveSettings(settings)
}

// StartScan begins scanning the given directories for duplicates.
func (a *App) StartScan(settings models.ScanSettings) error {
	a.mu.Lock()
	if a.scanning {
		a.mu.Unlock()
		return fmt.Errorf("scan already in progress")
	}
	a.scanning = true
	a.groups = nil
	ctx, cancel := context.WithCancel(a.ctx)
	a.cancelScan = cancel
	a.mu.Unlock()

	go func() {
		defer func() {
			a.mu.Lock()
			a.scanning = false
			a.cancelScan = nil
			a.mu.Unlock()
		}()

		s := scanner.New(settings, func(stage string, processed, total int) {
			runtime.EventsEmit(a.ctx, "scan:progress", map[string]interface{}{
				"stage":     stage,
				"processed": processed,
				"total":     total,
			})
		})

		groups, err := s.Run(ctx)
		if err != nil {
			if ctx.Err() != nil {
				runtime.EventsEmit(a.ctx, "scan:error", "Scan cancelled")
				return
			}
			runtime.EventsEmit(a.ctx, "scan:error", err.Error())
			return
		}

		a.mu.Lock()
		a.groups = groups
		a.mu.Unlock()

		count := 0
		if groups != nil {
			count = len(groups)
		}
		runtime.EventsEmit(a.ctx, "scan:complete", count)
	}()

	return nil
}

// CancelScan stops an in-progress scan.
func (a *App) CancelScan() {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.cancelScan != nil {
		a.cancelScan()
	}
}

// GetDuplicateGroups returns the current duplicate groups found.
func (a *App) GetDuplicateGroups() []models.DuplicateGroup {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.groups
}

// DeleteFiles moves the specified files to trash and records the operation.
func (a *App) DeleteFiles(paths []string) (*models.DeleteOperation, error) {
	op, err := operations.MoveToTrash(paths)
	if err != nil {
		return nil, err
	}

	a.mu.Lock()
	a.history = append(a.history, *op)

	// Remove only successfully trashed files from groups
	trashedSet := make(map[string]bool, len(op.DeletedPaths))
	for _, p := range op.DeletedPaths {
		trashedSet[p] = true
	}
	filtered := a.groups[:0]
	for _, g := range a.groups {
		var remaining []models.FileInfo
		for _, f := range g.Files {
			if !trashedSet[f.Path] {
				remaining = append(remaining, f)
			}
		}
		if len(remaining) > 1 {
			g.Files = remaining
			// Recalculate sizes
			var totalSize int64
			for _, f := range remaining {
				totalSize += f.Size
			}
			g.TotalSize = totalSize
			g.WastedSize = totalSize - remaining[0].Size
			filtered = append(filtered, g)
		}
	}
	a.groups = filtered
	a.mu.Unlock()

	return op, nil
}

// GetOperationHistory returns past delete operations for undo support.
func (a *App) GetOperationHistory() []models.DeleteOperation {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.history
}

// OpenFile opens a file with the system's default application.
func (a *App) OpenFile(path string) error {
	return operations.OpenFile(path)
}

// OpenFolder reveals a file in the system's file manager.
func (a *App) OpenFolder(path string) error {
	return operations.RevealInFileManager(path)
}
