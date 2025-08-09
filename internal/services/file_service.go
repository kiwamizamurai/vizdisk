package services

import (
	"fmt"
	"os"
	"path/filepath"
)

type FileService struct{}

func NewFileService() *FileService {
	return &FileService{}
}

func (s *FileService) ValidatePath(path string) error {
	if path == "" {
		return fmt.Errorf("path is empty")
	}

	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("path does not exist: %s", path)
		}
		return fmt.Errorf("failed to access path: %w", err)
	}

	if !info.IsDir() {
		return fmt.Errorf("path is not a directory: %s", path)
	}

	dir, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("cannot access directory: %w", err)
	}
	defer dir.Close()

	if _, err := dir.Readdirnames(1); err != nil && err.Error() != "EOF" {
		return fmt.Errorf("cannot read directory contents: %w", err)
	}

	return nil
}

func (s *FileService) DeletePath(path string) error {
	if path == "" {
		return fmt.Errorf("path is empty")
	}

	homeDir, _ := os.UserHomeDir()
	absPath, _ := filepath.Abs(path)

	if absPath == "/" || absPath == homeDir {
		return fmt.Errorf("cannot delete system directory")
	}

	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("path does not exist: %s", path)
		}
		return fmt.Errorf("failed to access path: %w", err)
	}

	if err := os.RemoveAll(path); err != nil {
		return fmt.Errorf("failed to delete path: %w", err)
	}

	return nil
}

func (s *FileService) GetFileInfo(path string) (os.FileInfo, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}
	return info, nil
}

func (s *FileService) PathExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func (s *FileService) IsDirectory(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}
