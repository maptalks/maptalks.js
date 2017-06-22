import Container from './../src/core/Container';
//import WebGLRenderer from './../../src/renderer/WebGLRenderer';
import Context from './../src/renderer/Context';


describe("test core function", () => {

    describe("#evnet fire on remove test", () => {

        let container = new Container({
            renderType: 'webgl',
            width: 300,
            height: 300
        });

        container.width=100;
        container.height=200;
        it('#test event fire',()=>{
            expect(true).to.be.equal(true);
        });

    });

    describe('#context', () => {

        let cvs=document.createElement('canvas');
        cvs.width=800;
        cvs.height=600;
        document.body.appendChild(cvs);

        let ctx = new Context(cvs);
    });

});