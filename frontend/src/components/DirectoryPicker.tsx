import { SelectDirectory } from '../../wailsjs/go/main/App';

interface Props {
    paths: string[];
    onPathsChange: (paths: string[]) => void;
    disabled: boolean;
}

export function DirectoryPicker({ paths, onPathsChange, disabled }: Props) {
    const addDirectory = async () => {
        const selected = await SelectDirectory();
        if (selected && !paths.includes(selected)) {
            onPathsChange([...paths, selected]);
        }
    };

    const removePath = (index: number) => {
        onPathsChange(paths.filter((_, i) => i !== index));
    };

    return (
        <div className="directory-picker">
            <div className="picker-header">
                <h3>Directories to Scan</h3>
                <button
                    className="btn btn-secondary"
                    onClick={addDirectory}
                    disabled={disabled}
                >
                    + Add Folder
                </button>
            </div>

            {paths.length === 0 ? (
                <div className="picker-empty">
                    No directories selected. Click "Add Folder" to begin.
                </div>
            ) : (
                <ul className="path-list">
                    {paths.map((path, i) => (
                        <li key={path} className="path-item">
                            <span className="path-text" title={path}>{path}</span>
                            <button
                                className="btn-remove"
                                onClick={() => removePath(i)}
                                disabled={disabled}
                                title="Remove"
                            >
                                &times;
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
