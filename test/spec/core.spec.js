import Container from './../../src/core/Container';
import WebGLRenderer from './../../src/renderer/WebGLRenderer';


describe("test core function", () => {

    describe("#evnet fire on remove test", () => {

        let container = new Container({
            renderType: 'webgl',
            width: 300,
            height: 300
        });


        container.fire("event.fire", { a: 123123 }, true);

        it('#test event fire',()=>{
            expect(true).to.be.equal(true);
        })

    });


});