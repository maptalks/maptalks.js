import Class from 'core/Class';

describe('Class', () => {
    it('addInitHook works', () => {
        const D = class extends Class {
            constructor() {
                super();
            }
            addHandler(name) {
                if (!this.handlers) {
                    this.handlers = [];
                }
                this.handlers.push(name);
            }
        };
        const E = class extends D {
        };
        const F = class extends E {
        };
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
