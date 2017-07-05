import Container from './../src/core/Container';
import Context from './../src/renderer/Context';

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
                width: width,
                height:height
            });
            //
            


        });
    });
});