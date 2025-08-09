package services

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type DialogService struct {
	ctx context.Context
}

func NewDialogService() *DialogService {
	return &DialogService{}
}

func (s *DialogService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *DialogService) OpenDirectoryDialog() (string, error) {
	if s.ctx == nil {
		return "", nil
	}

	options := runtime.OpenDialogOptions{
		Title: "Select Directory",
	}

	result, err := runtime.OpenDirectoryDialog(s.ctx, options)
	if err != nil {
		return "", err
	}

	return result, nil
}

func (s *DialogService) OpenFileDialog(filters []runtime.FileFilter) (string, error) {
	if s.ctx == nil {
		return "", nil
	}

	options := runtime.OpenDialogOptions{
		Title:   "Select File",
		Filters: filters,
	}

	result, err := runtime.OpenFileDialog(s.ctx, options)
	if err != nil {
		return "", err
	}

	return result, nil
}

func (s *DialogService) ShowMessageDialog(title, message string) {
	if s.ctx == nil {
		return
	}

	options := runtime.MessageDialogOptions{
		Type:    runtime.InfoDialog,
		Title:   title,
		Message: message,
	}

	_, _ = runtime.MessageDialog(s.ctx, options)
}
