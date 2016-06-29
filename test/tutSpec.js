describe('#example', function () {

    it('using library expect', function () {
        var foo = 'bar',
            obj = { name: 'object' };

        // expect
        expect(foo).to.be.a('string');
        expect(foo).to.equal('bar');
        expect(foo).to.have.length(3);
        // expect(obj).to.have.property('name').with.length(6);
        expect(obj).to.have.property('name', 'object');

        // # assert of chai
        // assert.typeOf(foo, 'string');
        // assert.equal(foo, 'bar');
        // assert.lengthOf(foo, 3)
        // assert.property(obj, 'name');
        // assert.lengthOf(obj.name, 6);
    });

    it('using library sinon', function () {
        function once(fn) {
            var returnValue, called = false;
            return function () {
                if (!called) {
                    called = true;
                    returnValue = fn.apply(this, arguments);
                }
                return returnValue;
            };
        }

        var callback = sinon.spy();
        var proxy = once(callback);
        var obj = {};

        proxy.call(obj, 1, 2, 3);

        expect(callback.called).to.be.ok();
        expect(callback.calledOnce).to.be.ok();
        expect(callback.calledOn(obj)).to.be.ok();
        expect(callback.calledWith(1, 2, 3)).to.be.ok();
    });

});
