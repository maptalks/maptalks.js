describe("Util", function() {


    describe("replace variable", function() {
        it('replace variables with value', function() {
            var str = '{foo} is not {foo2}.';
            var r = maptalks.StringUtil.replaceVariable(str, {foo : 'apple', foo2 : 'pear'});
            expect(r).to.eql('apple is not pear.');
        });


    });

});
