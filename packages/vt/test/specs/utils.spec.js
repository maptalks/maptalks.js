const assert = require('assert');
const maptalks = require('maptalks');
const { PackUtil, FilterUtil } = require('../../dist/maptalks.vt.js');

const mapRenderer = window.mapRenderer;

maptalks.Map.mergeOptions({
    renderer: mapRenderer || 'gl',
    preserveGpuDrawingBuffer: true
});

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

describe('compile filter specs', () => {
    it('normal filter', () => {
        const compiled = FilterUtil.compileStyle([
            {
                filter: ['==', 'foo', 'bar'],
                symbol: {
                    foo: 'bar'
                }
            }
        ]);

        const feature = {
            layer: 'layer',
            properties: {
                foo: 'bar'
            }
        };
        assert(compiled[0].filter(feature));
    });

    it('filter with condition and layer', () => {
        const compiled = FilterUtil.compileStyle([
            {
                filter: {
                    condition: ['==', 'foo', 'bar'],
                    layer: 'layer'
                },
                symbol: {
                    foo: 'bar'
                }
            }
        ]);

        const feature = {
            layer: 'layer',
            properties: {
                foo: 'bar'
            }
        };
        assert(compiled[0].filter(feature));

        const falseFeature = {
            layer: 'falseLayer',
            properties: {
                foo: 'bar'
            }
        };
        assert(!compiled[0].filter(falseFeature));
    });

    it('filter with true condition', () => {
        const compiled = FilterUtil.compileStyle([
            {
                filter: {
                    condition: true,
                    layer: 'layer'
                },
                symbol: {
                    foo: 'bar'
                }
            }
        ]);

        const feature = {
            layer: 'layer',
            properties: {
                foo: 'bar'
            }
        };
        assert(compiled[0].filter(feature));

        const falseFeature = {
            layer: 'falseLayer',
            properties: {
                foo: 'bar'
            }
        };
        assert(!compiled[0].filter(falseFeature));
    });


    it('filter with group condition', () => {
        const compiled = FilterUtil.compileStyle([
            {
                filter: {
                    condition: [{ condition: true, layer: 'layer' }],
                    type: 'any'
                },
                symbol: {
                    foo: 'bar'
                }
            }
        ]);

        const feature = {
            layer: 'layer',
            properties: {
                foo: 'bar'
            }
        };
        assert(compiled[0].filter(feature));

        const falseFeature = {
            layer: 'falseLayer',
            properties: {
                foo: 'bar'
            }
        };
        assert(!compiled[0].filter(falseFeature));
    });

    it('expression has operator', () => {
        const compiled = FilterUtil.compileStyle([
            {
                filter: {
                    condition: [
                        {
                            condition: [
                                "all",
                                ["has", "foo"],
                                ["<=", ["get", "reflen"], 4]
                            ]
                        }
                    ],
                    type: 'any'
                },
                customProperties: {
                    filter: true,
                    properties: {
                        'type': 1
                    }
                },
                symbol: {
                    foo: 'bar'
                }
            }
        ]);

        const feature = {
            layer: 'layer',
            properties: {
                foo: 'bar',
                'reflen': 4
            }
        };
        const feature2 = {
            layer: 'layer',
            properties: {
                'reflen': 4
            }
        };
        assert(compiled[0].filter(feature));
        assert(!compiled[0].filter(feature2));
    });
});

function reverseStr(s) {
    return s.split('').reverse().join('');
}
