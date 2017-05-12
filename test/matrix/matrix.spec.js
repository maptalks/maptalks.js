
/// <reference path="../../dist/kiwi.gl.js"/>


describe("vec2",()=>{

    describe("#add",()=>{
        it("ve2向量基本运算",()=>{
            var s = new kiwi.matrix.vec2();
            var s2 = new kiwi.matrix.vec2().set(1,6);
            s.add(s2);
            console.log(s.toString());
            console.log(s2.toString());
            expect(s.toString()).to.be.equal(s2.toString());
        });
    });


});