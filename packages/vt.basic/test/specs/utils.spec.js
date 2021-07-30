const assert = require('assert');
const { PackUtil } = require('@maptalks/vt');

describe('util specs', () => {
    it('rtl text conversion', () => {
        const text = 'افغانستان';
        const converted = PackUtil.convertRTLText(text);
        assert.ok(converted === reverseStr(text), text + '\n' + converted);
    });

    it('rtl text with ltr text conversion', () => {
        const ltr = 'hello world ';
        const text = 'افغانستان ';
        const converted = PackUtil.convertRTLText(ltr + text);
        assert.ok(converted === reverseStr(text) + ' hello world', ltr + text + '\n' + converted);
    });
});

function reverseStr(s) {
    return s.split('').reverse().join('');
}
