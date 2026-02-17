import { formatSize, formatDate } from '../utils/format';
import { OpenFile, OpenFolder } from '../../wailsjs/go/main/App';

interface FileInfo {
    path: string;
    size: number;
    name: string;
    modified: number;
}

export interface DuplicateGroupData {
    id: string;
    kind: string;
    files: FileInfo[];
    total_size: number;
    wasted_size: number;
}

interface Props {
    group: DuplicateGroupData;
    keptPaths: Set<string>;
    onToggle: (groupId: string, path: string) => void;
}

export function DuplicateGroup({ group, keptPaths, onToggle }: Props) {
    return (
        <div className="group-card">
            <div className="group-header">
                <span>{group.files.length} files</span>
                <span>{formatSize(group.wasted_size)} wasted</span>
            </div>

            {group.files.map((file) => {
                const isKept = keptPaths.has(file.path);

                return (
                    <label
                        key={file.path}
                        className={`file-row${isKept ? ' selected' : ' will-trash'}`}
                    >
                        <input
                            type="checkbox"
                            checked={isKept}
                            onChange={() => onToggle(group.id, file.path)}
                        />
                        <div className="file-details">
                            <div className="file-name">{file.name}</div>
                            <div className="file-path">{file.path}</div>
                            <div className="file-meta">
                                <span className="file-date">{formatDate(file.modified)}</span>
                                <span className="file-actions">
                                    <button
                                        className="btn-action"
                                        onClick={(e) => { e.preventDefault(); OpenFile(file.path); }}
                                        title="Open file"
                                    >
                                        Open File
                                    </button>
                                    <button
                                        className="btn-action"
                                        onClick={(e) => { e.preventDefault(); OpenFolder(file.path); }}
                                        title="Reveal in folder"
                                    >
                                        Open Folder
                                    </button>
                                </span>
                            </div>
                        </div>
                        <span className="file-size">{formatSize(file.size)}</span>
                    </label>
                );
            })}
        </div>
    );
}
