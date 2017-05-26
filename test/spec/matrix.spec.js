import {matrix} from 'kiwi.matrix';


describe("vec2",()=>{

    describe("#add",()=>{
        it("ve2向量基本运算",()=>{
            var s=new matrix.vec2();
            expect(s.toString()).to.be.equal("vec2(0,0)");
        });
    });


});