const assert = require('assert');
const { PackUtil } = require('../../dist/maptalks.vt.js');

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

describe('pack position', () => {
    it('pack normal altitude', () => {
        const coord = [1024, 256, 200];
        const packed = PackUtil.packPosition([], ...coord);

        const unpacked = PackUtil.unpackPosition([], ...packed);

        assert.deepEqual(coord, unpacked);
    });

    it('pack negative altitude', () => {
        const coord = [1024, 256, -200];
        const packed = PackUtil.packPosition([], ...coord);

        const unpacked = PackUtil.unpackPosition([], ...packed);

        assert.deepEqual(coord, unpacked);
    });

    it('pack edge altitude', () => {
        const coord = [1024, 256, Math.pow(2, 17)];
        const packed = PackUtil.packPosition([], ...coord);

        assert(packed[2] === 0);

        const unpacked = PackUtil.unpackPosition([], ...packed);

        assert.deepEqual(coord, unpacked);
    });

    it('pack negative edge altitude', () => {
        const coord = [1024, 256, -Math.pow(2, 17)];
        const packed = PackUtil.packPosition([], ...coord);

        assert(packed[2] === -1);

        const unpacked = PackUtil.unpackPosition([], ...packed);

        assert.deepEqual([1024, 256, -131073], unpacked);
    });

    it('pack edge altitude left', () => {
        const coord = [1024, 256, Math.pow(2, 17) - 1];
        const packed = PackUtil.packPosition([], ...coord);

        const unpacked = PackUtil.unpackPosition([], ...packed);

        assert.deepEqual(coord, unpacked);
    });

    it('pack edge altitude right', () => {
        const coord = [1024, 256, Math.pow(2, 17) + 1];
        const packed = PackUtil.packPosition([], ...coord);

        assert(packed[2] === 1);

        const unpacked = PackUtil.unpackPosition([], ...packed);

        assert.deepEqual(coord, unpacked);
    });

    it('pack negative edge altitude right', () => {
        const coord = [1024, 256, -Math.pow(2, 17) + 1];
        const packed = PackUtil.packPosition([], ...coord);

        const unpacked = PackUtil.unpackPosition([], ...packed);

        assert.deepEqual(coord, unpacked);
    });

    it('pack negative edge altitude left', () => {
        const coord = [1024, 256, -Math.pow(2, 17) - 1];
        const packed = PackUtil.packPosition([], ...coord);

        assert(packed[2] === -1);

        const unpacked = PackUtil.unpackPosition([], ...packed);

        assert.deepEqual(coord, unpacked);
    });
});

function reverseStr(s) {
    return s.split('').reverse().join('');
}
