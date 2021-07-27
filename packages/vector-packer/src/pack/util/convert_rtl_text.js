import { stringContainsRTLText, charInRTLScript } from './script_detection';

const EMPTY_STR = '';

export function convertRTLText(text) {
    if (!stringContainsRTLText(text)) {
        return text;
    }
    // debugger
    const converted = [];
    const block = [];
    // initial direction is ltr
    let dir = 1;
    let preBlockDir = 1;
    for (const char of text) {
        const codePoint = char.codePointAt(0);
        if (charInRTLScript(codePoint)) {
            dir = -1;
        } else {
            dir = 1;
        }
        if (preBlockDir !== dir) {
            if (block.length) {
                if (preBlockDir > 0) {
                    block.reverse();
                }
                converted.push(...block);
            }
            preBlockDir = dir;
            block.length = 0;
        }
        block.push(char);
    }
    if (block.length) {
        if (preBlockDir > 0) {
            block.reverse();
        }
        converted.push(...block);
    }
    return converted.reverse().join(EMPTY_STR);
}
