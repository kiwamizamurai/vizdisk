package models

import "time"

type FileNode struct {
	ID           string      `json:"id"`
	Name         string      `json:"name"`
	Path         string      `json:"path"`
	Size         int64       `json:"size"`
	Type         string      `json:"type"` // "file" or "directory"
	Children     []*FileNode `json:"children,omitempty"`
	LastModified time.Time   `json:"lastModified"`
	IsHidden     bool        `json:"isHidden"`
	Permissions  string      `json:"permissions,omitempty"`
}

type ScanResult struct {
	Root             *FileNode `json:"root"`
	TotalSize        int64     `json:"totalSize"`
	TotalFiles       int64     `json:"totalFiles"`
	TotalDirectories int64     `json:"totalDirectories"`
	ScanTime         time.Time `json:"scanTime"`
	ScanDurationMs   int64     `json:"scanDuration"`
}

type ScanProgress struct {
	CurrentPath        string  `json:"currentPath"`
	FilesScanned       int64   `json:"filesScanned"`
	DirectoriesScanned int64   `json:"directoriesScanned"`
	TotalSizeScanned   int64   `json:"totalSizeScanned"`
	ProgressPercent    float64 `json:"progressPercent"`
	IsCompleted        bool    `json:"isCompleted"`
}
