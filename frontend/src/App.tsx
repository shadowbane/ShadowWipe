import { useState, useEffect, useCallback } from 'react';
import { DirectoryPicker } from './components/DirectoryPicker';
import { SettingsPanel } from './components/SettingsPanel';
import { ScanProgress } from './components/ScanProgress';
import { DuplicateList } from './components/DuplicateList';
import { useScan } from './hooks/useScan';
import { GetSettings, SaveSettings } from '../wailsjs/go/main/App';
import { models } from '../wailsjs/go/models';
import './App.css';

function App() {
    const [paths, setPaths] = useState<string[]>([]);
    const [minFileSize, setMinFileSize] = useState(0);
    const [minFileSizeUnit, setMinFileSizeUnit] = useState('KB');
    const [similarityThreshold, setSimilarityThreshold] = useState(0);
    const [skipHidden, setSkipHidden] = useState(true);
    const [excludedDirs, setExcludedDirs] = useState<string[]>([]);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const { status, progress, duplicateCount, error, startScan, cancelScan, reset } = useScan();

    const scanning = status === 'scanning';

    // Load settings on mount
    useEffect(() => {
        GetSettings().then((s: models.ScanSettings) => {
            setPaths(s.paths || []);
            setMinFileSize(s.min_file_size);
            setMinFileSizeUnit(s.min_file_size_unit || 'KB');
            setSimilarityThreshold(s.similarity_threshold);
            setSkipHidden(s.skip_hidden);
            setExcludedDirs(s.excluded_dirs || []);
            setSettingsLoaded(true);
        });
    }, []);

    // Auto-save settings on every change (after initial load)
    const persistSettings = useCallback((overrides?: Partial<{
        paths: string[];
        minFileSize: number;
        minFileSizeUnit: string;
        similarityThreshold: number;
        skipHidden: boolean;
        excludedDirs: string[];
    }>) => {
        if (!settingsLoaded) return;
        const s = new models.ScanSettings({
            paths: overrides?.paths ?? paths,
            min_file_size: overrides?.minFileSize ?? minFileSize,
            min_file_size_unit: overrides?.minFileSizeUnit ?? minFileSizeUnit,
            similarity_threshold: overrides?.similarityThreshold ?? similarityThreshold,
            skip_hidden: overrides?.skipHidden ?? skipHidden,
            excluded_dirs: overrides?.excludedDirs ?? excludedDirs,
        });
        SaveSettings(s);
    }, [settingsLoaded, paths, minFileSize, minFileSizeUnit, similarityThreshold, skipHidden, excludedDirs]);

    const handlePathsChange = (newPaths: string[]) => {
        setPaths(newPaths);
        persistSettings({ paths: newPaths });
    };

    const handleMinFileSizeChange = (value: number) => {
        setMinFileSize(value);
        persistSettings({ minFileSize: value });
    };

    const handleMinFileSizeUnitChange = (unit: string) => {
        setMinFileSizeUnit(unit);
        persistSettings({ minFileSizeUnit: unit });
    };

    const handleSimilarityThresholdChange = (value: number) => {
        setSimilarityThreshold(value);
        persistSettings({ similarityThreshold: value });
    };

    const handleSkipHiddenChange = (value: boolean) => {
        setSkipHidden(value);
        persistSettings({ skipHidden: value });
    };

    const handleExcludedDirsChange = (dirs: string[]) => {
        setExcludedDirs(dirs);
        persistSettings({ excludedDirs: dirs });
    };

    const handleStartScan = () => {
        if (paths.length > 0) {
            const settings = new models.ScanSettings({
                paths,
                min_file_size: minFileSize,
                min_file_size_unit: minFileSizeUnit,
                similarity_threshold: similarityThreshold,
                skip_hidden: skipHidden,
                excluded_dirs: excludedDirs,
            });
            startScan(settings);
        }
    };

    return (
        <div id="App">
            <div className="app-header">
                <h1>ShadowWipe</h1>
                <button className="btn-gear" onClick={() => setSettingsOpen(true)} title="Settings">
                    &#9881;
                </button>
            </div>

            <DirectoryPicker
                paths={paths}
                onPathsChange={handlePathsChange}
                disabled={scanning}
            />

            <SettingsPanel
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                minFileSize={minFileSize}
                minFileSizeUnit={minFileSizeUnit}
                similarityThreshold={similarityThreshold}
                skipHidden={skipHidden}
                excludedDirs={excludedDirs}
                onMinFileSizeChange={handleMinFileSizeChange}
                onMinFileSizeUnitChange={handleMinFileSizeUnitChange}
                onSimilarityThresholdChange={handleSimilarityThresholdChange}
                onSkipHiddenChange={handleSkipHiddenChange}
                onExcludedDirsChange={handleExcludedDirsChange}
            />

            {status === 'idle' && (
                <button
                    className="btn btn-primary"
                    onClick={handleStartScan}
                    disabled={paths.length === 0}
                >
                    Start Scan
                </button>
            )}

            <ScanProgress
                status={status}
                progress={progress}
                duplicateCount={duplicateCount}
                error={error}
                onCancel={cancelScan}
                onReset={reset}
            />

            {status === 'complete' && duplicateCount > 0 && (
                <DuplicateList onReset={reset} />
            )}
        </div>
    );
}

export default App;
