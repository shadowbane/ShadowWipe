import { useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    minFileSize: number;
    minFileSizeUnit: string;
    similarityThreshold: number;
    skipHidden: boolean;
    excludedDirs: string[];
    onMinFileSizeChange: (value: number) => void;
    onMinFileSizeUnitChange: (unit: string) => void;
    onSimilarityThresholdChange: (value: number) => void;
    onSkipHiddenChange: (value: boolean) => void;
    onExcludedDirsChange: (dirs: string[]) => void;
}

export function SettingsPanel({
    open,
    onClose,
    minFileSize,
    minFileSizeUnit,
    similarityThreshold,
    skipHidden,
    excludedDirs,
    onMinFileSizeChange,
    onMinFileSizeUnitChange,
    onSimilarityThresholdChange,
    onSkipHiddenChange,
    onExcludedDirsChange,
}: Props) {
    const [activeTab, setActiveTab] = useState<'general' | 'exclusions'>('general');
    const [newExclusion, setNewExclusion] = useState('');

    const addExclusion = () => {
        const trimmed = newExclusion.trim();
        if (trimmed && !excludedDirs.includes(trimmed)) {
            onExcludedDirsChange([...excludedDirs, trimmed]);
            setNewExclusion('');
        }
    };

    const removeExclusion = (index: number) => {
        onExcludedDirsChange(excludedDirs.filter((_, i) => i !== index));
    };

    const handleExclusionKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addExclusion();
        }
    };

    if (!open) return null;

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <div className="settings-tabs">
                    <button
                        className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'exclusions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('exclusions')}
                    >
                        Exclusions
                    </button>
                </div>

                <div className="settings-tab-content">
                    {activeTab === 'general' && (
                        <div className="settings-grid">
                            <div className="settings-row">
                                <label className="settings-label">Min file size</label>
                                <div className="settings-control-group">
                                    <input
                                        type="number"
                                        className="settings-input"
                                        value={minFileSize}
                                        min={0}
                                        onChange={(e) => onMinFileSizeChange(Math.max(0, Number(e.target.value)))}
                                    />
                                    <select
                                        className="settings-select"
                                        value={minFileSizeUnit}
                                        onChange={(e) => onMinFileSizeUnitChange(e.target.value)}
                                    >
                                        <option value="KB">KB</option>
                                        <option value="MB">MB</option>
                                    </select>
                                </div>
                            </div>

                            <div className="settings-row">
                                <label className="settings-label">
                                    Similarity threshold
                                    <span className="settings-hint">
                                        {similarityThreshold === 0 ? ' (Disabled)' : ` (${similarityThreshold})`}
                                    </span>
                                </label>
                                <input
                                    type="range"
                                    className="settings-slider"
                                    min={0}
                                    max={20}
                                    step={1}
                                    value={similarityThreshold}
                                    onChange={(e) => onSimilarityThresholdChange(Number(e.target.value))}
                                />
                            </div>

                            <div className="settings-row">
                                <label className="settings-label">Skip hidden files</label>
                                <input
                                    type="checkbox"
                                    className="settings-checkbox"
                                    checked={skipHidden}
                                    onChange={(e) => onSkipHiddenChange(e.target.checked)}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'exclusions' && (
                        <div className="settings-grid">
                            <div className="settings-row settings-row-col">
                                <label className="settings-label">Excluded directories</label>
                                <div className="exclusion-input-row">
                                    <input
                                        type="text"
                                        className="settings-input exclusion-text-input"
                                        placeholder="e.g. node_modules"
                                        value={newExclusion}
                                        onChange={(e) => setNewExclusion(e.target.value)}
                                        onKeyDown={handleExclusionKeyDown}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        onClick={addExclusion}
                                        disabled={!newExclusion.trim()}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {excludedDirs.length > 0 && (
                                    <ul className="path-list exclusion-list">
                                        {excludedDirs.map((dir, i) => (
                                            <li key={dir} className="path-item">
                                                <span className="path-text">{dir}</span>
                                                <button
                                                    className="btn-remove"
                                                    onClick={() => removeExclusion(i)}
                                                    title="Remove"
                                                >
                                                    &times;
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
