package thumbnail

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/jpeg"
	"os"
	"sync"

	// Register image decoders.
	_ "image/gif"
	_ "image/png"

	_ "golang.org/x/image/bmp"
	_ "golang.org/x/image/tiff"
	_ "golang.org/x/image/webp"

	"golang.org/x/image/draw"
)

const maxDim = 160 // retina for 80px display

// Generate opens an image file, resizes it to fit within maxDim x maxDim,
// encodes as JPEG quality 80, and returns a data URI string.
// Returns "" on any error.
func Generate(path string) string {
	f, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer f.Close()

	src, _, err := image.Decode(f)
	if err != nil {
		return ""
	}

	bounds := src.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	if w == 0 || h == 0 {
		return ""
	}

	// Calculate scaled dimensions preserving aspect ratio.
	newW, newH := w, h
	if w > maxDim || h > maxDim {
		if w > h {
			newW = maxDim
			newH = h * maxDim / w
		} else {
			newH = maxDim
			newW = w * maxDim / h
		}
	}
	if newW == 0 {
		newW = 1
	}
	if newH == 0 {
		newH = 1
	}

	dst := image.NewRGBA(image.Rect(0, 0, newW, newH))
	draw.CatmullRom.Scale(dst, dst.Bounds(), src, bounds, draw.Over, nil)

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, dst, &jpeg.Options{Quality: 80}); err != nil {
		return ""
	}

	return "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(buf.Bytes())
}

// Cache is a simple thread-safe thumbnail cache with a max entry limit.
type Cache struct {
	mu      sync.RWMutex
	entries map[string]string
	maxSize int
}

// NewCache creates a Cache with the given max entry count.
func NewCache(maxSize int) *Cache {
	return &Cache{
		entries: make(map[string]string, 256),
		maxSize: maxSize,
	}
}

// Get returns the cached data URI for path, or ("", false) on miss.
func (c *Cache) Get(path string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	v, ok := c.entries[path]
	return v, ok
}

// Put stores a data URI in the cache. If the cache is full, the entry is not stored.
func (c *Cache) Put(path, dataURI string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if len(c.entries) >= c.maxSize {
		return
	}
	c.entries[path] = dataURI
}

// Clear removes all entries from the cache.
func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries = make(map[string]string, 256)
}
