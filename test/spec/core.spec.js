import Container from './../../src/core/Container';
import WebGLRenderer from './../../src/renderer/WebGLRenderer';


describe("test core function", () => {

    describe("#evnet fire on remove test", () => {

        let container = new Container({
            renderType: 'webgl',
            width: 300,
            height: 300
        });

        //container.fire("event.fire", { a: 123123 }, true);

        let canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        let ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(20, 25, 80, 120);
        document.body.appendChild(canvas);
        //render.fire("event.fire",{});

    });


});