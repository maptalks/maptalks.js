import Container from './../../src/core/Container';
import WebGLRenderer from './../../src/renderer/WebGLRenderer';

let cont = new Container();
let render = new WebGLRenderer(null, null);
render.on('event.fire', function () {
    //console("event.fire");
});


describe("test core function", () => {

    describe("#container test", () => {


        //render.fire("event.fire",{});

    });


});