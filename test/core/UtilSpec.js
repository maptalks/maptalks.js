describe("Util", function() {

    describe("convertMinusToCamel", function() {

        it("convert string with spinal-case to camelCase", function() {
            var s = 'a-simple-variable',
                r = Z.Util.convertMinusToCamel(s);

            expect(r).to.eql('aSimpleVariable');
        });

    });

    describe("convertCamelToMinus", function() {

        it("convert string with camelCase to spinal-case", function() {
            var s = 'ASimpleVariable',
                r = Z.Util.convertCamelToMinus(s);

            expect(r).to.eql('a-simple-variable');
        });

    });

});
