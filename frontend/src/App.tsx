import { useState } from 'react';
import { DirectoryPicker } from './components/DirectoryPicker';
import { ScanProgress } from './components/ScanProgress';
import { DuplicateList } from './components/DuplicateList';
import { useScan } from './hooks/useScan';
import './App.css';

function App() {
    const [paths, setPaths] = useState<string[]>([]);
    const { status, progress, duplicateCount, error, startScan, cancelScan, reset } = useScan();

    const scanning = status === 'scanning';

    const handleStartScan = () => {
        if (paths.length > 0) {
            startScan(paths, 0);
        }
    };

    return (
        <div id="App">
            <h1>FolderCleaner</h1>

            <DirectoryPicker
                paths={paths}
                onPathsChange={setPaths}
                disabled={scanning}
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
