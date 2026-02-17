export interface ScanProgress {
    stage: string;
    processed: number;
    total: number;
}

export type ScanStatus = 'idle' | 'scanning' | 'complete' | 'error' | 'cancelled';

export const STAGE_LABELS: Record<string, string> = {
    'walking': 'Discovering files',
    'partial-hashing': 'Quick-checking candidates',
    'full-hashing': 'Verifying duplicates',
    'perceptual-hashing': 'Analyzing images',
};
