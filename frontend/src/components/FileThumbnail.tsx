import { useThumbnail, isImageFile } from '../hooks/useThumbnail';

interface Props {
    path: string;
    extension: string;
    name: string;
}

export function FileThumbnail({ path, extension, name }: Props) {
    const { dataUri, loading } = useThumbnail(path, extension);

    if (!isImageFile(extension)) return null;

    if (loading) {
        return <div className="file-thumbnail-placeholder" />;
    }

    if (!dataUri) return null;

    return (
        <img
            className="file-thumbnail"
            src={dataUri}
            alt={name}
            loading="lazy"
        />
    );
}
