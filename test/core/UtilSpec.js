describe("Util", function() {

    describe("case convert", function() {

        it("convert string with spinal-case to camelCase", function() {
            var s = 'a-simple-variable',
                r = Z.Util.convertMinusToCamel(s);

            expect(r).to.eql('aSimpleVariable');
        });

        it("convert string with camelCase to spinal-case", function() {
            var s = 'ASimpleVariable',
                r = Z.Util.convertCamelToMinus(s);

            expect(r).to.eql('a-simple-variable');
        });

    });

    describe("replace variable", function() {
        it('replace variables with value', function() {
            var str = '{foo} is not {foo2}.';
            var r = maptalks.StringUtil.replaceVariable(str, {foo : 'apple', foo2 : 'pear'});
            expect(r).to.eql('apple is not pear.');
        });


    });

});
