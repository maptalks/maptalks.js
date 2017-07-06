import Container from './../src/core/Container';
import Context from './../src/renderer/Context';
import { ShaderFactory } from './../src/renderer/shader/ShaderLib';

describe("test core function", () => {
    describe('#context', () => {
        it('@', () => {
            const width = 800,
                height = 600;
            let cvs = document.createElement('canvas');
            cvs.width = width;
            cvs.height = height;
            document.body.appendChild(cvs);
            let ctx = new Context({
                alpha: false,
                antialias: false,
                premultipliedAlpha: false,
                stencil: false,
                preserveDrawingBuffer: false,
                width: width,
                height: height
            });
            //背景设置为白色
            ctx.clearColor(1, 1, 1, 1);
            
            ctx.useProgram('physics');

        });
    });
});