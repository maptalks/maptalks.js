import Class from 'core/class/index';

describe('Class-es5', () => {
    it('addInitHook works', () => {
        const D = Class.extend({
            addHandler(name) {
                if (!this.handlers) {
                    this.handlers = [];
                }
                this.handlers.push(name);
            }
        });
        const E = D.extend({
        });
        const F = E.extend({
        });
        E.addInitHook('addHandler', 'e');
        F.addInitHook('addHandler', 'f');
        const d = new D();
        const e = new E();
        const f = new F();
        expect(d.handlers).to.be(undefined);
        expect(e.handlers).to.eql(['e']);
        expect(f.handlers).to.eql(['e', 'f']);
    });
});
