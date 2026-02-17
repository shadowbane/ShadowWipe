import { useState, useEffect } from 'react';
import { DuplicateGroup, DuplicateGroupData } from './DuplicateGroup';
import { formatSize } from '../utils/format';
import { GetDuplicateGroups, DeleteFiles } from '../../wailsjs/go/main/App';

interface Props {
    onReset: () => void;
}

export function DuplicateList({ onReset }: Props) {
    const [groups, setGroups] = useState<DuplicateGroupData[]>([]);
    const [loading, setLoading] = useState(true);
    // Map<groupId, Set<keptPaths>> — checked files are kept, unchecked get trashed
    const [selections, setSelections] = useState<Map<string, Set<string>>>(new Map());
    const [deleting, setDeleting] = useState(false);
    const [deletedCount, setDeletedCount] = useState<number | null>(null);

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

    // Count total files that will be trashed (unchecked files)
    let trashCount = 0;
    groups.forEach((group) => {
        const kept = selections.get(group.id);
        if (kept) {
            trashCount += group.files.length - kept.size;
        }
    });

    const handleTrash = async () => {
        const pathsToDelete: string[] = [];

        groups.forEach((group) => {
            const kept = selections.get(group.id);
            if (kept) {
                group.files.forEach((file) => {
                    if (!kept.has(file.path)) {
                        pathsToDelete.push(file.path);
                    }
                });
            }
        });

        if (pathsToDelete.length === 0) return;

        setDeleting(true);
        try {
            await DeleteFiles(pathsToDelete);
            setDeletedCount(pathsToDelete.length);
        } catch {
            // Deletion failed — stay on current view
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <div className="loading-text">Loading duplicate groups...</div>;
    }

    if (deletedCount !== null) {
        return (
            <div className="trash-result">
                <p>Moved {deletedCount} file{deletedCount !== 1 ? 's' : ''} to trash.</p>
                <button className="btn btn-secondary" onClick={onReset}>
                    Scan Again
                </button>
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

            {groups.map((group) => (
                <DuplicateGroup
                    key={group.id}
                    group={group}
                    keptPaths={selections.get(group.id) || new Set()}
                    onToggle={handleToggle}
                />
            ))}

            <button
                className="btn btn-trash"
                disabled={trashCount === 0 || deleting}
                onClick={handleTrash}
            >
                {deleting
                    ? 'Moving to Trash...'
                    : trashCount > 0
                      ? `Move ${trashCount} file${trashCount !== 1 ? 's' : ''} to Trash`
                      : 'Move to Trash'}
            </button>
        </div>
    );
}
