package services

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFileService_ValidatePath(t *testing.T) {
	service := NewFileService()
	tempDir := t.TempDir()

	tests := []struct {
		name    string
		path    string
		setup   func()
		wantErr bool
	}{
		{
			name:    "empty path",
			path:    "",
			wantErr: true,
		},
		{
			name:    "non-existent path",
			path:    filepath.Join(tempDir, "nonexistent"),
			wantErr: true,
		},
		{
			name:    "valid directory",
			path:    tempDir,
			wantErr: false,
		},
		{
			name: "file instead of directory",
			path: filepath.Join(tempDir, "file.txt"),
			setup: func() {
				f, _ := os.Create(filepath.Join(tempDir, "file.txt"))
				f.Close()
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.setup != nil {
				tt.setup()
			}
			err := service.ValidatePath(tt.path)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePath() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestFileService_DeletePath(t *testing.T) {
	service := NewFileService()
	tempDir := t.TempDir()

	tests := []struct {
		name    string
		path    string
		setup   func() string
		wantErr bool
	}{
		{
			name:    "empty path",
			path:    "",
			wantErr: true,
		},
		{
			name:    "non-existent path",
			path:    filepath.Join(tempDir, "nonexistent"),
			wantErr: true,
		},
		{
			name: "delete file",
			setup: func() string {
				filePath := filepath.Join(tempDir, "test.txt")
				f, _ := os.Create(filePath)
				_, _ = f.WriteString("test content")
				f.Close()
				return filePath
			},
			wantErr: false,
		},
		{
			name: "delete directory",
			setup: func() string {
				dirPath := filepath.Join(tempDir, "testdir")
				_ = os.Mkdir(dirPath, 0o755)
				f, _ := os.Create(filepath.Join(dirPath, "file1.txt"))
				f.Close()
				_ = os.Mkdir(filepath.Join(dirPath, "subdir"), 0o755)
				return dirPath
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := tt.path
			if tt.setup != nil {
				path = tt.setup()
			}

			err := service.DeletePath(path)
			if (err != nil) != tt.wantErr {
				t.Errorf("DeletePath() error = %v, wantErr %v", err, tt.wantErr)
			}

			if !tt.wantErr && path != "" {
				if _, err := os.Stat(path); !os.IsNotExist(err) {
					t.Errorf("DeletePath() path still exists after deletion")
				}
			}
		})
	}
}

func TestFileService_GetFileInfo(t *testing.T) {
	service := NewFileService()
	tempDir := t.TempDir()

	testFile := filepath.Join(tempDir, "test.txt")
	f, _ := os.Create(testFile)
	_, _ = f.WriteString("test content")
	f.Close()

	tests := []struct {
		name    string
		path    string
		wantErr bool
		isDir   bool
	}{
		{
			name:    "get directory info",
			path:    tempDir,
			wantErr: false,
			isDir:   true,
		},
		{
			name:    "get file info",
			path:    testFile,
			wantErr: false,
			isDir:   false,
		},
		{
			name:    "non-existent path",
			path:    filepath.Join(tempDir, "nonexistent"),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			info, err := service.GetFileInfo(tt.path)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetFileInfo() error = %v, wantErr %v", err, tt.wantErr)
			}
			if !tt.wantErr && info.IsDir() != tt.isDir {
				t.Errorf("GetFileInfo() IsDir = %v, want %v", info.IsDir(), tt.isDir)
			}
		})
	}
}

func TestFileService_PathExists(t *testing.T) {
	service := NewFileService()
	tempDir := t.TempDir()

	tests := []struct {
		name string
		path string
		want bool
	}{
		{
			name: "existing directory",
			path: tempDir,
			want: true,
		},
		{
			name: "non-existent path",
			path: filepath.Join(tempDir, "nonexistent"),
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := service.PathExists(tt.path); got != tt.want {
				t.Errorf("PathExists() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestFileService_IsDirectory(t *testing.T) {
	service := NewFileService()
	tempDir := t.TempDir()

	testFile := filepath.Join(tempDir, "test.txt")
	f, _ := os.Create(testFile)
	f.Close()

	tests := []struct {
		name string
		path string
		want bool
	}{
		{
			name: "directory",
			path: tempDir,
			want: true,
		},
		{
			name: "file",
			path: testFile,
			want: false,
		},
		{
			name: "non-existent",
			path: filepath.Join(tempDir, "nonexistent"),
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := service.IsDirectory(tt.path); got != tt.want {
				t.Errorf("IsDirectory() = %v, want %v", got, tt.want)
			}
		})
	}
}
