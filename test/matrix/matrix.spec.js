//const kiwi=require('./../../dist/kiwi.gl');

describe("vec2",()=>{

    describe("#add",()=>{
        it("ve2向量基本运算",()=>{
           
            let v1 = new kiwi.matrix.vec2().set(7,9),
                v2 = new kiwi.matrix.vec2().set(1,6);
            let v3=v1.clone().add(v2);
            v1.add(v2);

            expect(v3.toString()).to.be.equal(v1.toString());
        });
    });


});