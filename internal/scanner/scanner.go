package scanner

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"vizdisk/internal/models"
)

const (
	FileTypeFile      = "file"
	FileTypeDirectory = "directory"
)

type Scanner struct {
	options *ScanOptions
	stop    chan bool
}

type ScanOptions struct {
	ShowHiddenFiles  bool     `json:"showHiddenFiles"`
	FollowSymlinks   bool     `json:"followSymlinks"`
	ExcludePatterns  []string `json:"excludePatterns"`
	RespectGitignore bool     `json:"respectGitignore"`
	MaxDepth         int      `json:"maxDepth"`
	MaxFileSize      int64    `json:"maxFileSize"`
}

func DefaultScanOptions() *ScanOptions {
	return &ScanOptions{
		ShowHiddenFiles:  false,
		FollowSymlinks:   false,
		ExcludePatterns:  []string{".DS_Store", "Thumbs.db", "*.tmp"},
		RespectGitignore: true,
		MaxDepth:         50,
		MaxFileSize:      1024 * 1024 * 1024, // 1GB
	}
}

func NewScanner(options *ScanOptions) *Scanner {
	if options == nil {
		options = DefaultScanOptions()
	}

	return &Scanner{
		options: options,
		stop:    make(chan bool, 1),
	}
}

func (s *Scanner) ScanPath(rootPath string, progressCallback func(*models.ScanProgress)) (*models.ScanResult, error) {
	startTime := time.Now()

	rootPath = filepath.Clean(rootPath)
	if _, err := os.Stat(rootPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("path does not exist: %s", rootPath)
	}

	result := &models.ScanResult{
		ScanTime: startTime,
	}

	progress := &models.ScanProgress{
		CurrentPath: rootPath,
	}

	rootNode, err := s.scanDirectory(rootPath, 0, progress, progressCallback)
	if err != nil {
		return nil, err
	}

	result.Root = rootNode
	result.TotalSize = s.calculateTotalSize(rootNode)
	result.TotalFiles, result.TotalDirectories = s.calculateCounts(rootNode)
	result.ScanDurationMs = time.Since(startTime).Milliseconds()

	progress.IsCompleted = true
	progress.ProgressPercent = 100.0
	if progressCallback != nil {
		progressCallback(progress)
	}

	return result, nil
}

func (s *Scanner) scanDirectory(dirPath string, depth int, progress *models.ScanProgress, progressCallback func(*models.ScanProgress)) (*models.FileNode, error) {
	select {
	case <-s.stop:
		return nil, fmt.Errorf("scan canceled")
	default:
	}

	if s.options.MaxDepth > 0 && depth > s.options.MaxDepth {
		return nil, nil
	}

	fileInfo, err := os.Stat(dirPath)
	if err != nil {
		return nil, err
	}

	node := &models.FileNode{
		ID:           s.generateID(dirPath),
		Name:         filepath.Base(dirPath),
		Path:         dirPath,
		Type:         FileTypeDirectory,
		LastModified: fileInfo.ModTime(),
		IsHidden:     s.isHidden(dirPath),
		Permissions:  fileInfo.Mode().String(),
		Children:     []*models.FileNode{},
	}

	progress.CurrentPath = dirPath
	progress.DirectoriesScanned++
	if progressCallback != nil {
		progressCallback(progress)
	}

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return node, nil
	}

	var children []*models.FileNode
	for _, entry := range entries {
		entryPath := filepath.Join(dirPath, entry.Name())

		if s.shouldExclude(entryPath, entry.Name()) {
			continue
		}

		if entry.IsDir() {
			childNode, err := s.scanDirectory(entryPath, depth+1, progress, progressCallback)
			if err != nil {
				continue
			}
			if childNode != nil {
				children = append(children, childNode)
			}
		} else {
			childNode, err := s.scanFile(entryPath, progress, progressCallback)
			if err != nil {
				continue
			}
			if childNode != nil {
				children = append(children, childNode)
			}
		}
	}

	node.Children = children
	node.Size = s.calculateDirectorySize(node)

	return node, nil
}

func (s *Scanner) scanFile(filePath string, progress *models.ScanProgress, progressCallback func(*models.ScanProgress)) (*models.FileNode, error) {
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return nil, err
	}

	if s.options.MaxFileSize > 0 && fileInfo.Size() > s.options.MaxFileSize {
		return nil, nil
	}

	node := &models.FileNode{
		ID:           s.generateID(filePath),
		Name:         filepath.Base(filePath),
		Path:         filePath,
		Type:         FileTypeFile,
		Size:         fileInfo.Size(),
		LastModified: fileInfo.ModTime(),
		IsHidden:     s.isHidden(filePath),
		Permissions:  fileInfo.Mode().String(),
	}

	progress.FilesScanned++
	progress.TotalSizeScanned += fileInfo.Size()
	if progressCallback != nil {
		progressCallback(progress)
	}

	return node, nil
}

func (s *Scanner) shouldExclude(path, name string) bool {
	if !s.options.ShowHiddenFiles && s.isHidden(path) {
		return true
	}

	for _, pattern := range s.options.ExcludePatterns {
		if matched, _ := filepath.Match(pattern, name); matched {
			return true
		}
	}

	return false
}

func (s *Scanner) isHidden(path string) bool {
	name := filepath.Base(path)
	return strings.HasPrefix(name, ".")
}

func (s *Scanner) generateID(path string) string {
	hash := sha256.Sum256([]byte(path))
	return fmt.Sprintf("%x", hash)
}

func (s *Scanner) calculateTotalSize(node *models.FileNode) int64 {
	if node == nil {
		return 0
	}

	if node.Type == FileTypeFile {
		return node.Size
	}

	var total int64
	for _, child := range node.Children {
		total += s.calculateTotalSize(child)
	}
	return total
}

func (s *Scanner) calculateDirectorySize(node *models.FileNode) int64 {
	var total int64
	for _, child := range node.Children {
		total += child.Size
	}
	return total
}

func (s *Scanner) calculateCounts(node *models.FileNode) (files, directories int64) {
	if node == nil {
		return 0, 0
	}

	if node.Type == FileTypeFile {
		return 1, 0
	}

	directories = 1
	for _, child := range node.Children {
		childFiles, childDirs := s.calculateCounts(child)
		files += childFiles
		directories += childDirs
	}
	return files, directories
}

func (s *Scanner) Stop() {
	select {
	case s.stop <- true:
	default:
	}
}
