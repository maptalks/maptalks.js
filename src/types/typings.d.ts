/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-unused-vars */

type WithNull<T> = T | null;
type WithUndef<T> = T | undefined;

declare const ActiveXObject: any

interface Window {
    MSPointerEvent: any
    opera: any
    DocumentTouch: any
}
