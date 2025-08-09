package services

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

const (
	osDarwin  = "darwin"
	osWindows = "windows"
	osLinux   = "linux"
)

type PlatformService struct{}

func NewPlatformService() *PlatformService {
	return &PlatformService{}
}

func (s *PlatformService) GetOS() string {
	return runtime.GOOS
}

func (s *PlatformService) GetCommonDirectories() map[string]string {
	homeDir, _ := os.UserHomeDir()
	dirs := make(map[string]string)

	switch runtime.GOOS {
	case osDarwin:
		dirs["Home"] = homeDir
		dirs["Desktop"] = filepath.Join(homeDir, "Desktop")
		dirs["Documents"] = filepath.Join(homeDir, "Documents")
		dirs["Downloads"] = filepath.Join(homeDir, "Downloads")
		dirs["Applications"] = "/Applications"
	case osWindows:
		dirs["Home"] = homeDir
		dirs["Desktop"] = filepath.Join(homeDir, "Desktop")
		dirs["Documents"] = filepath.Join(homeDir, "Documents")
		dirs["Downloads"] = filepath.Join(homeDir, "Downloads")
		dirs["Program Files"] = "C:\\Program Files"
		dirs["Program Files (x86)"] = "C:\\Program Files (x86)"
	case osLinux:
		dirs["Home"] = homeDir
		dirs["Desktop"] = filepath.Join(homeDir, "Desktop")
		dirs["Documents"] = filepath.Join(homeDir, "Documents")
		dirs["Downloads"] = filepath.Join(homeDir, "Downloads")
		dirs["Root"] = "/"
		dirs["usr"] = "/usr"
		dirs["opt"] = "/opt"
	}

	return dirs
}

func (s *PlatformService) GetUserHomeDirectory() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}
	return homeDir, nil
}

func (s *PlatformService) OpenInFileManager(path string) error {
	if _, err := os.Stat(path); err != nil {
		return fmt.Errorf("path does not exist: %s", path)
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case osDarwin:
		cmd = exec.Command("open", "-R", path)
	case osWindows:
		cmd = exec.Command("explorer", "/select,", path)
	case osLinux:
		if _, err := exec.LookPath("xdg-open"); err == nil {
			parentDir := filepath.Dir(path)
			cmd = exec.Command("xdg-open", parentDir)
		} else if _, err := exec.LookPath("nautilus"); err == nil {
			cmd = exec.Command("nautilus", "--select", path)
		} else if _, err := exec.LookPath("dolphin"); err == nil {
			cmd = exec.Command("dolphin", "--select", path)
		} else {
			return fmt.Errorf("no supported file manager found")
		}
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to open file manager: %w", err)
	}

	return nil
}

func (s *PlatformService) IsPlatform(os string) bool {
	return runtime.GOOS == os
}
