package operations

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
)

// OpenFile opens a file with the system's default application.
func OpenFile(path string) error {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", path).Start()
	case "linux":
		return exec.Command("xdg-open", path).Start()
	case "windows":
		return exec.Command("cmd", "/c", "start", "", path).Start()
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}

// RevealInFileManager opens the containing folder and selects the file.
func RevealInFileManager(path string) error {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", "-R", path).Start()
	case "linux":
		// xdg-open on the parent directory (no select support in most Linux file managers)
		return exec.Command("xdg-open", filepath.Dir(path)).Start()
	case "windows":
		return exec.Command("explorer", "/select,", path).Start()
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}
