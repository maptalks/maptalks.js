import Container from './../src/core/Container';
import Context from './../src/renderer/Context';
import { ShaderFactory } from './../src/renderer/shader/ShaderLib';
import { GLBuffer, GLVertexBuffer, GLIndexBuffer } from './../src/renderer/gl/GLBuffer';


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

            let point_program = ctx.useProgram('point');
            point_program.uniforms.uSampler = 1;
            point_program.uniforms.positions = 0;
            point_program.uniforms.bounds = [ctx._width, ctx._height];
            point_program.uniforms.zoom = 0.5;
            //设置attribute



        });
    });
});