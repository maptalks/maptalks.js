import Container from './../../src/core/Container';
import WebGLRenderer from './../../src/renderer/WebGLRenderer';


describe("test core function", () => {

    describe("#evnet fire on remove test", () => {

        let container = new Container({
            renderType: 'webgl',
            width: 300,
            height: 300
        });

        let cvs=document.createElement('canvas');
        let ctx = cvs.getContext('2d');
        ctx.width=300;
        ctx.height=300;
        //第三步：指定绘制线样式、颜色
        ctx.strokeStyle = "red";
        //第四步：绘制矩形，只有线。内容是空的
        ctx.strokeRect(10, 10, 190, 100);
        
        //以下演示填充矩形。
        ctx.fillStyle = "blue";
        ctx.fillRect(0,11,100,100);

        
        document.body.appendChild(cvs);

        container.fire("event.fire", { a: 123123 }, true);

        it('#test event fire',()=>{
            expect(true).to.be.equal(true);
        })

    });


});