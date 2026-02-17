import { useState, useEffect, useMemo } from 'react';
import { DuplicateGroup, DuplicateGroupData } from './DuplicateGroup';
import { formatSize } from '../utils/format';
import { GetDuplicateGroups, DeleteFiles } from '../../wailsjs/go/main/App';

type SortBy = 'wasted-desc' | 'wasted-asc' | 'files-desc' | 'name-asc' | 'name-desc';
type FilterType = 'all' | 'images' | 'documents' | 'audio' | 'video' | 'archives' | 'code' | 'other';

const FILE_TYPE_MAP: Record<string, FilterType> = {
    '.jpg': 'images', '.jpeg': 'images', '.png': 'images', '.gif': 'images',
    '.bmp': 'images', '.svg': 'images', '.webp': 'images', '.tiff': 'images', '.ico': 'images',
    '.pdf': 'documents', '.doc': 'documents', '.docx': 'documents', '.xls': 'documents',
    '.xlsx': 'documents', '.ppt': 'documents', '.pptx': 'documents', '.txt': 'documents',
    '.rtf': 'documents', '.odt': 'documents', '.csv': 'documents',
    '.mp3': 'audio', '.wav': 'audio', '.flac': 'audio', '.aac': 'audio',
    '.ogg': 'audio', '.wma': 'audio', '.m4a': 'audio',
    '.mp4': 'video', '.avi': 'video', '.mkv': 'video', '.mov': 'video',
    '.wmv': 'video', '.flv': 'video', '.webm': 'video',
    '.zip': 'archives', '.rar': 'archives', '.7z': 'archives', '.tar': 'archives',
    '.gz': 'archives', '.bz2': 'archives', '.xz': 'archives',
    '.js': 'code', '.ts': 'code', '.tsx': 'code', '.jsx': 'code', '.py': 'code',
    '.go': 'code', '.rs': 'code', '.java': 'code', '.c': 'code', '.cpp': 'code',
    '.h': 'code', '.css': 'code', '.html': 'code', '.json': 'code', '.xml': 'code',
    '.yaml': 'code', '.yml': 'code', '.md': 'code', '.sh': 'code',
};

function getGroupType(group: DuplicateGroupData): FilterType {
    const ext = group.files[0]?.name?.match(/\.[^.]+$/)?.[0]?.toLowerCase() || '';
    return FILE_TYPE_MAP[ext] || 'other';
}

const FILTER_LABELS: Record<FilterType, string> = {
    all: 'All',
    images: 'Images',
    documents: 'Documents',
    audio: 'Audio',
    video: 'Video',
    archives: 'Archives',
    code: 'Code',
    other: 'Other',
};

interface Props {
    onReset: () => void;
}

export function DuplicateList({ onReset }: Props) {
    const [groups, setGroups] = useState<DuplicateGroupData[]>([]);
    const [loading, setLoading] = useState(true);
    // Map<groupId, Set<keptPaths>> — checked files are kept, unchecked get trashed
    const [selections, setSelections] = useState<Map<string, Set<string>>>(new Map());
    const [deleting, setDeleting] = useState(false);
    const [trashResult, setTrashResult] = useState<{
        deletedCount: number;
        failed: { path: string; reason: string }[];
    } | null>(null);
    const [trashError, setTrashError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [sortBy, setSortBy] = useState<SortBy>('wasted-desc');
    const [filterType, setFilterType] = useState<FilterType>('all');

    useEffect(() => {
        GetDuplicateGroups()
            .then((result: DuplicateGroupData[]) => {
                const data = result || [];
                setGroups(data);
                // Default: all files checked (kept) — safe, nothing trashed
                const initial = new Map<string, Set<string>>();
                data.forEach((g) => {
                    initial.set(g.id, new Set(g.files.map((f) => f.path)));
                });
                setSelections(initial);
            })
            .catch(() => {
                setGroups([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleToggle = (groupId: string, path: string) => {
        setSelections((prev) => {
            const next = new Map(prev);
            const paths = new Set(prev.get(groupId) || []);
            if (paths.has(path)) {
                paths.delete(path);
            } else {
                paths.add(path);
            }
            next.set(groupId, paths);
            return next;
        });
    };

    const handleKeepFirst = (groupId: string) => {
        setSelections((prev) => {
            const next = new Map(prev);
            const group = groups.find((g) => g.id === groupId);
            if (group && group.files.length > 0) {
                next.set(groupId, new Set([group.files[0].path]));
            }
            return next;
        });
    };

    const handleKeepAll = (groupId: string) => {
        setSelections((prev) => {
            const next = new Map(prev);
            const group = groups.find((g) => g.id === groupId);
            if (group) {
                next.set(groupId, new Set(group.files.map((f) => f.path)));
            }
            return next;
        });
    };

    // Count total files that will be trashed (unchecked files)
    let trashCount = 0;
    groups.forEach((group) => {
        const kept = selections.get(group.id);
        if (kept) {
            trashCount += group.files.length - kept.size;
        }
    });

    // Determine which filter types have groups
    const availableTypes = useMemo(() => {
        const types = new Set<FilterType>();
        groups.forEach((g) => types.add(getGroupType(g)));
        return types;
    }, [groups]);

    // Filter and sort groups
    const displayGroups = useMemo(() => {
        let filtered = groups;
        if (filterType !== 'all') {
            filtered = groups.filter((g) => getGroupType(g) === filterType);
        }
        const sorted = [...filtered];
        switch (sortBy) {
            case 'wasted-desc':
                sorted.sort((a, b) => b.wasted_size - a.wasted_size);
                break;
            case 'wasted-asc':
                sorted.sort((a, b) => a.wasted_size - b.wasted_size);
                break;
            case 'files-desc':
                sorted.sort((a, b) => b.files.length - a.files.length);
                break;
            case 'name-asc':
                sorted.sort((a, b) => (a.files[0]?.name || '').localeCompare(b.files[0]?.name || ''));
                break;
            case 'name-desc':
                sorted.sort((a, b) => (b.files[0]?.name || '').localeCompare(a.files[0]?.name || ''));
                break;
        }
        return sorted;
    }, [groups, filterType, sortBy]);

    const collectPathsToDelete = (): string[] => {
        const paths: string[] = [];
        groups.forEach((group) => {
            const kept = selections.get(group.id);
            if (kept) {
                group.files.forEach((file) => {
                    if (!kept.has(file.path)) {
                        paths.push(file.path);
                    }
                });
            }
        });
        return paths;
    };

    const handleTrashClick = () => {
        if (trashCount === 0) return;
        setShowConfirm(true);
    };

    const handleConfirmTrash = async () => {
        setShowConfirm(false);
        const pathsToDelete = collectPathsToDelete();
        if (pathsToDelete.length === 0) return;

        setTrashError(null);
        setDeleting(true);
        try {
            const result = await DeleteFiles(pathsToDelete);
            const deletedCount = result.deleted_paths?.length ?? 0;
            const failed = result.failed_paths ?? [];
            setTrashResult({ deletedCount, failed });
        } catch (e: any) {
            setTrashError(e?.message || String(e));
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <div className="loading-text">Loading duplicate groups...</div>;
    }

    if (!loading && groups.length === 0 && trashResult === null) {
        return (
            <div className="trash-result">
                <p>All duplicates have been resolved!</p>
                <button className="btn btn-secondary" onClick={onReset}>
                    Scan Again
                </button>
            </div>
        );
    }

    if (trashResult !== null) {
        return (
            <div className="trash-result-container">
                {trashResult.deletedCount > 0 && (
                    <div className="trash-result">
                        <p>Moved {trashResult.deletedCount} file{trashResult.deletedCount !== 1 ? 's' : ''} to trash.</p>
                    </div>
                )}
                {trashResult.failed.length > 0 && (
                    <div className="trash-failures">
                        <p>Failed to move {trashResult.failed.length} file{trashResult.failed.length !== 1 ? 's' : ''}:</p>
                        <ul>
                            {trashResult.failed.map((f) => (
                                <li key={f.path}>
                                    <span className="fail-path">{f.path}</span>
                                    <span className="fail-reason">{f.reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={onReset}>
                        Scan Again
                    </button>
                </div>
            </div>
        );
    }

    const totalWasted = groups.reduce((sum, g) => sum + g.wasted_size, 0);

    return (
        <div className="duplicate-list">
            <div className="duplicate-summary">
                <strong>{groups.length}</strong> duplicate group{groups.length !== 1 ? 's' : ''} —{' '}
                <strong>{formatSize(totalWasted)}</strong> wasted
            </div>

            <div className="duplicate-info">
                Checked files will be <strong>kept</strong>. Unchecked files will be moved to trash.
                All files are checked by default — uncheck the duplicates you want to remove.
            </div>

            <div className="duplicate-actions-top">
                <button className="btn btn-secondary" onClick={onReset}>
                    Scan Again
                </button>
            </div>

            <div className="duplicate-toolbar">
                <div className="toolbar-group">
                    <span className="toolbar-label">Sort:</span>
                    <select className="toolbar-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                        <option value="wasted-desc">Biggest first</option>
                        <option value="wasted-asc">Smallest first</option>
                        <option value="files-desc">Most files first</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                    </select>
                </div>
                <div className="toolbar-group">
                    <span className="toolbar-label">Filter:</span>
                    {(['all', ...Object.keys(FILTER_LABELS).filter((t) => t !== 'all')] as FilterType[])
                        .filter((t) => t === 'all' || availableTypes.has(t))
                        .map((t) => (
                            <button
                                key={t}
                                className={`filter-chip${filterType === t ? ' active' : ''}`}
                                onClick={() => setFilterType(t)}
                            >
                                {FILTER_LABELS[t]}
                            </button>
                        ))}
                </div>
            </div>

            {displayGroups.length === 0 && (
                <div className="loading-text">No groups match this filter.</div>
            )}

            {displayGroups.map((group) => (
                <DuplicateGroup
                    key={group.id}
                    group={group}
                    keptPaths={selections.get(group.id) || new Set()}
                    onToggle={handleToggle}
                    onKeepFirst={handleKeepFirst}
                    onKeepAll={handleKeepAll}
                />
            ))}

            {trashError && (
                <div className="trash-error">
                    Failed to move files to trash: {trashError}
                </div>
            )}

            <button
                className="btn btn-trash"
                disabled={trashCount === 0 || deleting}
                onClick={handleTrashClick}
            >
                {deleting
                    ? 'Moving to Trash...'
                    : trashCount > 0
                      ? `Move ${trashCount} file${trashCount !== 1 ? 's' : ''} to Trash`
                      : 'Move to Trash'}
            </button>

            {showConfirm && (
                <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
                    <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <p>Move <strong>{trashCount}</strong> file{trashCount !== 1 ? 's' : ''} to trash?</p>
                        <p className="confirm-detail">This action can be undone from your system trash.</p>
                        <div className="confirm-actions">
                            <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-confirm-trash" onClick={handleConfirmTrash}>
                                Move to Trash
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
