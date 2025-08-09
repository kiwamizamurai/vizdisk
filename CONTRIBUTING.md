# Contributing to VizDisk

Contributions are welcome! Report bugs, request features, or submit pull requests.

## Development Setup

```bash
git clone https://github.com/kiwamizamurai/vizdisk.git
cd vizdisk
mise install  # Installs Go 1.23, Node.js, and all tools
cd frontend && npm install && cd ..
wails dev
```

## Commands

```bash
# Development with hot reload
wails dev

# Build
mise run build
wails build

# Build with debug console
wails build -debug

# Code quality
mise run fmt     # Format code
mise run check   # Lint and check
mise run fix     # Auto-fix issues
mise run test    # Run tests
```

## Pull Requests

1. Fork and create a feature branch from `main`
2. Make changes and test: `mise run check && mise run test`
3. Commit and push
4. Create a Pull Request

## Issues

Report bugs or request features by [creating an issue](https://github.com/kiwamizamurai/vizdisk/issues).