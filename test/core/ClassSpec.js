/* eslint-env es6 */
describe('Class', () => {
    it('addInitHook', () => {
        const D = class extends maptalks.Class {
            constructor() {
                super();
            }
            addHandler(name, clazz) {
                if (!this.handlers) {
                    this.handlers = [];
                }
                var handler = this[name] = new clazz();
                this.handlers.push(handler);
            }
        };
        const E = class extends D {
        };
        const F = class extends E {
        };

        const EHandler = class extends maptalks.Class {
            getV() {
                return 'e';
            }
        };

        const FHandler = class extends maptalks.Class {
            getV() {
                return 'f';
            }
        };

        E.addInitHook('addHandler', 'e', EHandler);
        F.addInitHook('addHandler', 'f', FHandler);
        const d = new D();
        const e = new E();
        const f = new F();
        expect(d.handlers).to.be(undefined);
        expect(e.handlers.length).to.eql(1);
        expect(f.handlers.length).to.eql(2);
        expect(e['e'].getV()).to.eql('e');
        expect(f['f'].getV()).to.eql('f');
    });

    it('include', () => {
        const D = class extends maptalks.Class {
            constructor() {
                super();
            }
        };
        D.include({
            foo(bar) {
                return bar;
            }
        });
        expect(new D().foo('bar')).to.be.eql('bar');
    });

    it('mergeOptions', () => {
        const D = class extends maptalks.Class {
        };
        D.mergeOptions({
            'foo' : 'd',
            'bar' : 'd'
        });

        const E = class extends D {
        };

        E.mergeOptions({
            'foo' : 'e'
        });

        const d1 = new D();
        const d2 = new D();
        d2.config('foo', 'd2');
        const e = new E();
        expect(d1.options['foo']).to.be.eql('d');
        expect(d1.options['bar']).to.be.eql('d');
        expect(d2.options['foo']).to.be.eql('d2');
        expect(d2.options['bar']).to.be.eql('d');
        expect(e.options['foo']).to.be.eql('e');
        expect(e.options['bar']).to.be.eql('d');
    });

    it('throws an error when creating without new operator', () => {
        expect(() => { maptalks.Marker(); }).to.throwException();
    });

    it('call parent\'s method by super', function () {
        const D = class extends maptalks.Class {
            constructor() {
                super();
            }

            foo(name, gender) {
                return name + ',' + gender;
            }
        };
        const E = class extends D {
            constructor() {
                super();
            }

            foo2() {
                return super.foo.apply(this, arguments);
            }
        };
        expect(new E().foo2('bar', 'male')).to.be.eql('bar,male');
    });
});

