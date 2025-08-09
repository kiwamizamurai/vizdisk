package main

import (
	"context"
	"fmt"

	"vizdisk/internal/models"
	"vizdisk/internal/scanner"
	"vizdisk/internal/services"
)

// App struct
type App struct {
	ctx             context.Context
	scanner         *scanner.Scanner
	fileService     *services.FileService
	platformService *services.PlatformService
	dialogService   *services.DialogService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		scanner:         scanner.NewScanner(scanner.DefaultScanOptions()),
		fileService:     services.NewFileService(),
		platformService: services.NewPlatformService(),
		dialogService:   services.NewDialogService(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.dialogService.SetContext(ctx)
}

// GetUserHomeDirectory returns the user's home directory
func (a *App) GetUserHomeDirectory() string {
	homeDir, err := a.platformService.GetUserHomeDirectory()
	if err != nil {
		return ""
	}
	return homeDir
}

// GetCommonDirectories returns a list of common directories to scan
func (a *App) GetCommonDirectories() []string {
	dirs := a.platformService.GetCommonDirectories()

	// Convert map to slice and filter existing
	var existingDirs []string
	for _, dir := range dirs {
		if a.fileService.PathExists(dir) {
			existingDirs = append(existingDirs, dir)
		}
	}

	return existingDirs
}

// ScanDirectory scans a directory and returns the file tree
func (a *App) ScanDirectory(path string) (*models.ScanResult, error) {
	return a.scanner.ScanPath(path, nil)
}

// GetDirectoryInfo returns basic information about a directory
func (a *App) GetDirectoryInfo(path string) (*models.FileNode, error) {
	fileInfo, err := a.fileService.GetFileInfo(path)
	if err != nil {
		return nil, fmt.Errorf("cannot access path: %s", err)
	}

	if !fileInfo.IsDir() {
		return nil, fmt.Errorf("path is not a directory: %s", path)
	}

	return &models.FileNode{
		Name:         fileInfo.Name(),
		Path:         path,
		Type:         "directory",
		LastModified: fileInfo.ModTime(),
		Permissions:  fileInfo.Mode().String(),
	}, nil
}

// ValidatePath checks if a path exists and is accessible
func (a *App) ValidatePath(path string) bool {
	return a.fileService.ValidatePath(path) == nil
}

// OpenDirectoryDialog opens a directory selection dialog
func (a *App) OpenDirectoryDialog() (string, error) {
	selectedPath, err := a.dialogService.OpenDirectoryDialog()
	if err != nil {
		return "", fmt.Errorf("failed to open directory dialog: %s", err)
	}
	return selectedPath, nil
}

// GetAppInfo returns application information like version
func (a *App) GetAppInfo() map[string]string {
	return map[string]string{
		"version":     "1.1.0",
		"name":        "VizDisk",
		"description": "Modern disk usage analyzer built with Wails and React",
		"author":      "kiwamizamurai",
		"license":     "MIT",
		"repository":  "https://github.com/kiwamizamurai/vizdisk",
	}
}

// Greet returns a greeting for the given name (keeping original method for compatibility)
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// DeletePath deletes a file or directory
// Note: Confirmation should be handled by the frontend
func (a *App) DeletePath(path string) error {
	return a.fileService.DeletePath(path)
}

// OpenInFinder opens a file or directory in the system file manager
func (a *App) OpenInFinder(path string) error {
	return a.platformService.OpenInFileManager(path)
}
