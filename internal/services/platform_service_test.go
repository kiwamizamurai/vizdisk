package services

import (
	"os"
	"runtime"
	"testing"
)

func TestPlatformService_GetOS(t *testing.T) {
	service := NewPlatformService()
	got := service.GetOS()
	want := runtime.GOOS

	if got != want {
		t.Errorf("GetOS() = %v, want %v", got, want)
	}
}

func TestPlatformService_GetCommonDirectories(t *testing.T) {
	service := NewPlatformService()
	dirs := service.GetCommonDirectories()

	if len(dirs) == 0 {
		t.Error("GetCommonDirectories() returned empty map")
	}

	homeDir, _ := os.UserHomeDir()
	if home, ok := dirs["Home"]; !ok || home != homeDir {
		t.Errorf("GetCommonDirectories() missing or incorrect Home directory")
	}

	switch runtime.GOOS {
	case "darwin":
		if _, ok := dirs["Applications"]; !ok {
			t.Error("GetCommonDirectories() missing Applications on macOS")
		}
	case "windows":
		if _, ok := dirs["Program Files"]; !ok {
			t.Error("GetCommonDirectories() missing Program Files on Windows")
		}
	case "linux":
		if _, ok := dirs["Root"]; !ok {
			t.Error("GetCommonDirectories() missing Root on Linux")
		}
	}
}

func TestPlatformService_GetUserHomeDirectory(t *testing.T) {
	service := NewPlatformService()
	got, err := service.GetUserHomeDirectory()
	if err != nil {
		t.Fatalf("GetUserHomeDirectory() error = %v", err)
	}

	want, _ := os.UserHomeDir()
	if got != want {
		t.Errorf("GetUserHomeDirectory() = %v, want %v", got, want)
	}
}

func TestPlatformService_IsPlatform(t *testing.T) {
	service := NewPlatformService()

	tests := []struct {
		name string
		os   string
		want bool
	}{
		{
			name: "current platform",
			os:   runtime.GOOS,
			want: true,
		},
		{
			name: "different platform",
			os:   "nonexistent",
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := service.IsPlatform(tt.os); got != tt.want {
				t.Errorf("IsPlatform() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestPlatformService_OpenInFileManager(t *testing.T) {
	service := NewPlatformService()
	tempDir := t.TempDir()

	err := service.OpenInFileManager("/nonexistent/path")
	if err == nil {
		t.Error("OpenInFileManager() should error on non-existent path")
	}

	_ = service.OpenInFileManager(tempDir)
}
