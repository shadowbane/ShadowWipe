import { useState, useEffect } from 'react';
import { GetThumbnail } from '../../wailsjs/go/main/App';

const IMAGE_EXTS = /^(jpg|jpeg|png|gif|bmp|tiff|webp)$/i;

const cache = new Map<string, string>();

export function isImageFile(extension: string): boolean {
    return IMAGE_EXTS.test(extension);
}

export function clearThumbnailCache(): void {
    cache.clear();
}

export function useThumbnail(path: string, extension: string): { dataUri: string; loading: boolean } {
    const [dataUri, setDataUri] = useState<string>(() => cache.get(path) || '');
    const [loading, setLoading] = useState<boolean>(() => isImageFile(extension) && !cache.has(path));

    useEffect(() => {
        if (!isImageFile(extension)) return;

        const cached = cache.get(path);
        if (cached !== undefined) {
            setDataUri(cached);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        GetThumbnail(path).then((uri) => {
            if (!cancelled) {
                cache.set(path, uri);
                setDataUri(uri);
                setLoading(false);
            }
        }).catch(() => {
            if (!cancelled) {
                cache.set(path, '');
                setDataUri('');
                setLoading(false);
            }
        });

        return () => { cancelled = true; };
    }, [path, extension]);

    return { dataUri, loading };
}
