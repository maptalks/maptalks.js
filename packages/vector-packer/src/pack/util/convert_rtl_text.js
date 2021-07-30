import { stringContainsRTLText, charInRTLScript, isWhiteSpace } from './script_detection';

const EMPTY_STR = '';

export function convertRTLText(text) {
    if (!stringContainsRTLText(text)) {
        return text;
    }
    const converted = [];
    const block = [];
    const whiteSpaces = [];
    // initial direction is ltr
    let index = 0;
    let prevStartIndex = 0;
    let dir = 1;
    let preBlockDir = 1;
    for (const char of text) {
        const codePoint = char.codePointAt(0);
        // 把空格暂时存放在whiteSpaces中。
        // ناتسناغفا    hello world
        // 例如上文中hello world前的空格，转换后应换到hello world后面，正确结果：
        // hello world   ناتسناغفا
        // 错误结果
        //     hello worldاتسناغفا
        if (isWhiteSpace(codePoint)) {
            whiteSpaces.push(char);
            index++;
            continue;
        }
        if (charInRTLScript(codePoint)) {
            dir = -1;
        } else {
            dir = 1;
        }
        if (preBlockDir !== dir) {
            prevStartIndex = index;
            if (block.length) {
                if (preBlockDir > 0) {
                    block.reverse();
                }
                converted.push(...block);
            }
            // 文字转换方向，把它们之间的空格插入到之前的block的开头
            if (whiteSpaces.length) {
                converted.splice(prevStartIndex, 0, ...whiteSpaces);
                whiteSpaces.length = 0;
            }
            preBlockDir = dir;
            block.length = 0;
        } else if (whiteSpaces.length) {
            block.push(...whiteSpaces);
            whiteSpaces.length = 0;
        }

        block.push(char);
        index++;
    }
    if (whiteSpaces.length) {
        block.push(...whiteSpaces);
    }
    if (block.length) {
        if (preBlockDir > 0) {
            block.reverse();
        }
        converted.push(...block);
    }
    return converted.reverse().join(EMPTY_STR);
}
