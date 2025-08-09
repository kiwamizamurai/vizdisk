import {
  BarChart3,
  ExternalLinkIcon,
  Github,
  HardDriveIcon,
  KeyboardIcon,
  MinusIcon,
  Target,
  XIcon,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useVisualizationSettings } from '@/hooks/useVisualizationSettings';
import { calculateNodeStats } from '@/utils/fileOperations';
import { formatDuration, formatFileSize } from '@/utils/formatters';
import { GetAppInfo, OpenDirectoryDialog, ScanDirectory } from '../wailsjs/go/main/App';
import type { models } from '../wailsjs/go/models';
import { BrowserOpenURL, Quit, WindowMinimise } from '../wailsjs/runtime/runtime';
import SunburstChart from './components/charts/SunburstChart';
import TreeMapChart from './components/charts/TreeMapChart';
import LoadingAnimation from './components/LoadingAnimation';

function App() {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [scanResult, setScanResult] = useState<models.ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentViewNode, setCurrentViewNode] = useState<models.FileNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<models.FileNode[]>([]);
  const [appInfo, setAppInfo] = useState<{ [key: string]: string }>({});
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { visualizationType, setVisualizationType } = useVisualizationSettings();

  const loadAppInfo = async () => {
    try {
      const info = await GetAppInfo();
      setAppInfo(info);
    } catch (error) {
      console.error('Failed to load app info:', error);
    }
  };

  const handleFolderPicker = React.useCallback(async () => {
    try {
      const selectedPath = await OpenDirectoryDialog();
      if (selectedPath) {
        setCurrentPath(selectedPath);
      }
    } catch (error) {
      console.error('Failed to open directory dialog:', error);
    }
  }, []);

  const handleScanDirectory = async (path?: string) => {
    const pathToScan = path || currentPath;
    if (!pathToScan) return;

    setScanResult(null);
    setCurrentViewNode(null);
    setBreadcrumbs([]);
    setIsScanning(true);

    try {
      const result = await ScanDirectory(pathToScan);
      setScanResult(result);
      setCurrentViewNode(result.root || null);
      setBreadcrumbs(result.root ? [result.root] : []);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleNodeDoubleClick = (node: models.FileNode) => {
    if (node.type === 'directory' && node.children && node.children.length > 0) {
      setCurrentViewNode(node);
      setBreadcrumbs((prev) => [...prev, node]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentViewNode(newBreadcrumbs[newBreadcrumbs.length - 1]);
  };

  useEffect(() => {
    loadAppInfo();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'o':
            event.preventDefault();
            handleFolderPicker();
            break;
          case '/':
          case '?':
            event.preventDefault();
            setShowShortcuts(!showShortcuts);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, handleFolderPicker]);

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <div
        className="h-8 bg-background/80 backdrop-blur-sm border-b border-border/5 flex items-center justify-between px-4 flex-shrink-0"
        data-wails-draggable
      >
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer transition-colors flex items-center justify-center group"
            data-wails-no-drag
            onClick={() => Quit()}
          >
            <XIcon className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            type="button"
            className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 cursor-pointer transition-colors flex items-center justify-center group"
            data-wails-no-drag
            onClick={() => WindowMinimise()}
          >
            <MinusIcon className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <div
            className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 cursor-pointer transition-colors"
            data-wails-no-drag
          ></div>
        </div>
        <div className="w-16"></div>
      </div>

      <main className="container mx-auto px-8 py-6 max-w-6xl flex-1 flex flex-col overflow-hidden min-h-0">
        {!isScanning && (
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 w-full max-w-2xl">
              <Input
                value={currentPath}
                onChange={(e) => setCurrentPath(e.target.value)}
                placeholder="Select a directory to analyze"
                className="flex-1 h-12 text-sm"
              />
              <Button onClick={handleFolderPicker} variant="outline" className="h-12 px-4">
                Browse
              </Button>
              <Button
                onClick={() => handleScanDirectory()}
                disabled={isScanning || !currentPath}
                className="h-12 px-6 bg-primary hover:bg-primary/90"
              >
                {isScanning ? 'Scanning...' : 'Analyze'}
              </Button>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="flex items-center justify-center flex-1">
            <LoadingAnimation
              size={120}
              message="Analyzing Directory"
              className="animate-in fade-in duration-500"
            />
          </div>
        )}

        {scanResult && currentViewNode && (
          <div className="flex-1 flex flex-col space-y-4 mt-4 overflow-hidden">
            <div className="flex items-center justify-between">
              {breadcrumbs.length > 1 && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                      <button
                        type="button"
                        onClick={() => handleBreadcrumbClick(index)}
                        className={`hover:text-foreground transition-colors ${
                          index === breadcrumbs.length - 1
                            ? 'text-foreground font-medium'
                            : 'hover:text-foreground'
                        }`}
                      >
                        {crumb.name}
                      </button>
                      {index < breadcrumbs.length - 1 && <span>/</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <ToggleGroup
                  type="single"
                  value={visualizationType}
                  onValueChange={(value) => {
                    if (value === 'treemap' || value === 'sunburst') {
                      setVisualizationType(value);
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="treemap" aria-label="TreeMap view">
                    <BarChart3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="sunburst" aria-label="Sunburst view">
                    <Target className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 flex-1 min-h-0">
              <div className="col-span-2 h-full border border-border/20 rounded-lg p-4">
                {visualizationType === 'treemap' ? (
                  <TreeMapChart
                    data={currentViewNode}
                    onNodeClick={(node) => console.log('Node clicked:', node.name)}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    onNodeDeleted={() => {
                      handleScanDirectory(currentPath);
                    }}
                  />
                ) : (
                  <SunburstChart
                    data={currentViewNode}
                    onNodeClick={(node) => console.log('Node clicked:', node.name)}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    onNodeDeleted={() => {
                      handleScanDirectory(currentPath);
                    }}
                  />
                )}
              </div>

              <div className="col-span-1 space-y-8">
                {(() => {
                  const nodeStats = calculateNodeStats(currentViewNode);
                  return (
                    <>
                      <div className="text-center space-y-3 p-6 rounded-lg border border-border/20">
                        <div className="text-4xl font-bold text-foreground">
                          {formatFileSize(currentViewNode.size)}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Total Size</div>
                      </div>

                      <div className="text-center space-y-3 p-6 rounded-lg border border-border/20">
                        <div className="text-4xl font-bold text-foreground">
                          {nodeStats.totalFiles.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Files</div>
                      </div>

                      <div className="text-center space-y-3 p-6 rounded-lg border border-border/20">
                        <div className="text-4xl font-bold text-foreground">
                          {nodeStats.totalDirs.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Directories</div>
                      </div>

                      <div className="text-center space-y-3 p-6 rounded-lg border border-border/20">
                        <div className="text-4xl font-bold text-foreground">
                          {formatDuration(scanResult.scanDuration)}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Scan Time</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {!scanResult && !isScanning && (
          <div className="flex flex-col items-center justify-center flex-1 space-y-4">
            <div className="bg-muted/30 p-6 rounded-full">
              <HardDriveIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium text-foreground">Choose a directory</h3>
              <p className="text-muted-foreground">
                Select a folder above to visualize its contents
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border/10 px-6 py-3 flex-shrink-0 bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="font-medium">{appInfo.name || 'VizDisk'}</span>
              <span>v{appInfo.version || '0.0.0'}</span>
            </div>
            <div className="text-muted-foreground/60">{appInfo.license || 'MIT'} License</div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="flex items-center space-x-1 hover:text-foreground transition-colors"
              title="Keyboard shortcuts (Cmd+?)"
            >
              <KeyboardIcon className="w-3 h-3" />
              <span>Shortcuts</span>
            </button>

            <button
              type="button"
              onClick={() =>
                BrowserOpenURL(appInfo.repository || 'https://github.com/yourusername/vizdisk')
              }
              className="flex items-center space-x-1 hover:text-foreground transition-colors"
              title="View source on GitHub"
            >
              <Github className="w-3 h-3" />
              <span>Source</span>
              <ExternalLinkIcon className="w-2.5 h-2.5" />
            </button>

            <div className="text-muted-foreground/60">Made with ❤️ using Wails</div>
          </div>
        </div>
      </footer>

      {showShortcuts && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
          onClick={() => setShowShortcuts(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowShortcuts(false)}
        >
          <div
            role="dialog"
            className="bg-background border border-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Open folder</span>
                <kbd className="bg-muted px-2 py-1 rounded text-xs font-mono">⌘O</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Show shortcuts</span>
                <kbd className="bg-muted px-2 py-1 rounded text-xs font-mono">⌘?</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Double-click folder</span>
                <span className="text-xs text-muted-foreground">Drill down</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Breadcrumb navigation</span>
                <span className="text-xs text-muted-foreground">Go back</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                {appInfo.name || 'VizDisk'} • Version {appInfo.version || '0.0.0'} •{' '}
                {appInfo.license || 'MIT'} License
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
