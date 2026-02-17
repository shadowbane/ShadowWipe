import { useState, useEffect, useCallback } from 'react';
import { EventsOn, EventsOff } from '../../wailsjs/runtime/runtime';
import { StartScan, CancelScan } from '../../wailsjs/go/main/App';
import { models } from '../../wailsjs/go/models';
import { ScanProgress, ScanStatus } from '../types';
import { clearThumbnailCache } from './useThumbnail';

export function useScan() {
    const [status, setStatus] = useState<ScanStatus>('idle');
    const [progress, setProgress] = useState<ScanProgress>({ stage: '', processed: 0, total: 0 });
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        const offProgress = EventsOn('scan:progress', (data: ScanProgress) => {
            setProgress(data);
        });

        const offComplete = EventsOn('scan:complete', (count: number) => {
            setDuplicateCount(count);
            setStatus('complete');
        });

        const offError = EventsOn('scan:error', (msg: string) => {
            if (msg === 'Scan cancelled') {
                setStatus('cancelled');
            } else {
                setError(msg);
                setStatus('error');
            }
        });

        return () => {
            offProgress();
            offComplete();
            offError();
        };
    }, []);

    const startScan = useCallback(async (settings: models.ScanSettings) => {
        setStatus('scanning');
        setProgress({ stage: '', processed: 0, total: 0 });
        setDuplicateCount(0);
        setError('');
        try {
            await StartScan(settings);
        } catch (e: any) {
            setError(e?.message || String(e));
            setStatus('error');
        }
    }, []);

    const cancelScan = useCallback(async () => {
        await CancelScan();
    }, []);

    const reset = useCallback(() => {
        setStatus('idle');
        setProgress({ stage: '', processed: 0, total: 0 });
        setDuplicateCount(0);
        setError('');
        clearThumbnailCache();
    }, []);

    return { status, progress, duplicateCount, error, startScan, cancelScan, reset };
}
