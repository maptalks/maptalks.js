// https://stackoverflow.com/questions/56018167/typescript-does-not-copy-d-ts-files-to-build

export type WithNull<T> = T | null;
export type WithUndef<T> = T | undefined;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Requireal<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

declare global {
    interface Window {
        MSPointerEvent: any
        opera: any
        DocumentTouch: any
    }

    interface CanvasRenderingContext2D {
        isHitTesting: boolean;
    }
}
