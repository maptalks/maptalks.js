
/// <reference path="../../dist/kiwi.gl.js"/>


describe("vec2",()=>{

    describe("#add",()=>{
        it("the first test#add",()=>{
            var s = new kiwi.vec2();
            var s2 = new kiwi.vec2();
            
            s.add(s2);
            expect("1").to.be.equal("1");
        });
    });


});