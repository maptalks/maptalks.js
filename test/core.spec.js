import Container from './../src/core/Container';
import Context from './../src/renderer/Context';

describe("test core function", () => {
    describe('#context', () => {
        it('@', () => {
            //
            let cvs = document.createElement('canvas');
            cvs.width = 800;
            cvs.height = 600;
            document.body.appendChild(cvs);
            let ctx = new Context(cvs);


        });
    });
});