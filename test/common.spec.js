const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Common = require('./common/common');
const Fusion = require('./../src/init');

describe('common.spec', () => {
    it('should create a canvas instance', () => {
        const w = 30, h = 20;
        const canvas = Common.createHeadlessCanvas(w, h);        
        assert.equal(canvas.width, w);
        assert.equal(canvas.height, h);        

        const ctx = canvas.getContext('2d');
        const gl = canvas.getContext('webgl');
        const gl2 = canvas.getContext('experimental-webgl');

        assert.ok(!!canvas.gl);
        assert.ok(!!(ctx && gl && gl2));
    });

    it('should get canvas\'s image buffer', () => {
        const w = 30, h = 20;
        const canvas = Common.createHeadlessCanvas(w, h);        

        let buffer = Common.getGlImage(canvas);
        assert.ok(!buffer);
        const gl = canvas.getContext('webgl');
        buffer = Common.getGlImage(canvas);
        assert.ok(buffer.length > 0);
    });

    it('should write canvas to file', (done) => {
        const w = 30, h = 20;
        const canvas = Common.createHeadlessCanvas(w, h);    
        const gl = canvas.getContext('webgl');
        const filepath = path.join(__dirname, 'tmp.png');
        Common.writeGlImage(canvas, filepath, err => {
            assert(err === null);
            fs.accessSync(filepath);
            fs.unlinkSync(filepath);
            done();
        });
    });

    it('shoud write glCanvas to file ',(done)=>{
        const w = 30, h = 20;
        const canvas = Common.createHeadlessCanvas(w, h);
        const glCanvas = new Fusion.gl.GLCanvas(canvas);
        const gl = glCanvas.getContext('webgl');
        const filepath = path.join(__dirname, 'tmp2.png');
        Common.writeGlImage(glCanvas, filepath, err => {
            assert(err === null);
            fs.accessSync(filepath);
            fs.unlinkSync(filepath);
            done();
        });
    });

});