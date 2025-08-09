import { useCallback, useEffect, useState } from 'react';

export type VisualizationType = 'treemap' | 'sunburst';

interface VisualizationSettings {
  type: VisualizationType;
}

const DEFAULT_SETTINGS: VisualizationSettings = {
  type: 'treemap',
};

const STORAGE_KEY = 'vizdisk-visualization-settings';

export function useVisualizationSettings() {
  const [settings, setSettings] = useState<VisualizationSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored) as VisualizationSettings;
        // Validate the parsed settings
        if (parsedSettings.type === 'treemap' || parsedSettings.type === 'sunburst') {
          setSettings(parsedSettings);
        }
      }
    } catch (error) {
      console.warn('Failed to load visualization settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const updateSettings = useCallback((newSettings: Partial<VisualizationSettings>) => {
    setSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      } catch (error) {
        console.warn('Failed to save visualization settings to localStorage:', error);
      }
      return updatedSettings;
    });
  }, []);

  const setVisualizationType = useCallback(
    (type: VisualizationType) => {
      updateSettings({ type });
    },
    [updateSettings]
  );

  return {
    settings,
    setVisualizationType,
    visualizationType: settings.type,
  };
}
