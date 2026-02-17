import { ScanProgress as ScanProgressType, ScanStatus, STAGE_LABELS } from '../types';

interface Props {
    status: ScanStatus;
    progress: ScanProgressType;
    duplicateCount: number;
    error: string;
    onCancel: () => void;
    onReset: () => void;
}

export function ScanProgress({ status, progress, duplicateCount, error, onCancel, onReset }: Props) {
    if (status === 'idle') return null;

    const stageLabel = STAGE_LABELS[progress.stage] || progress.stage;
    const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

    return (
        <div className="scan-progress">
            {status === 'scanning' && (
                <>
                    <div className="progress-info">
                        <span className="stage-label">{stageLabel}</span>
                        {progress.total > 0 && (
                            <span className="progress-count">
                                {progress.processed.toLocaleString()} / {progress.total.toLocaleString()}
                            </span>
                        )}
                    </div>
                    <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <button className="btn btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                </>
            )}

            {status === 'complete' && duplicateCount === 0 && (
                <div className="scan-result scan-result-complete">
                    <p>No duplicates found.</p>
                    <button className="btn btn-secondary" onClick={onReset}>
                        Scan Again
                    </button>
                </div>
            )}

            {status === 'error' && (
                <div className="scan-result scan-result-error">
                    <p>Error: {error}</p>
                    <button className="btn btn-secondary" onClick={onReset}>
                        Try Again
                    </button>
                </div>
            )}

            {status === 'cancelled' && (
                <div className="scan-result scan-result-cancelled">
                    <p>Scan was cancelled.</p>
                    <button className="btn btn-secondary" onClick={onReset}>
                        Scan Again
                    </button>
                </div>
            )}
        </div>
    );
}
