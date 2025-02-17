describe('LabelEdit', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;
    function getLabel() {
        var label = new maptalks.Label('I am a Text', map.getCenter()).addTo(layer);
        return label;
    }

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null);
        container = setups.container;
        map = setups.map;
        map.config('panAnimation', false);
        layer = new maptalks.VectorLayer('id', { 'drawImmediate' : true });
        map.addLayer(layer);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('edit label', function () {
        it('edit content', function () {
            var label = getLabel();
            label.on('edittextstart', startEdit);
            label.on('edittextend', endEdit);
            label.startEditText();


            function startEdit() {
                var size = label.getSize();
                expect(label.isEditingText()).to.be.ok();
                expect(label._textEditor.clientWidth + 2).to.be.eql(Math.round(size.width));
                expect(label._textEditor.clientHeight + 2).to.be.eql(Math.round(size.height));
                var dom = label.getTextEditor().getDOM();
                maptalks.DomUtil.on(dom, 'keyup', function (ev) {
                    var oEvent = ev || event;
                    var char = String.fromCharCode(oEvent.keyCode);
                    if (oEvent.shiftKey) {
                        if (char === '1') {
                            char = '!';
                        }
                    }
                    dom.innerText += char;
                    label.endEditText();
                });
                happen.keyup(dom, {
                    shiftKey: true,
                    keyCode: 49
                });
                expect(label.isEditingText()).to.not.be.ok();
            }
            function endEdit() {
                expect(label.getContent()).to.eql('I am a Text!');
            }
        });

        it.skip('edit content with "Enter" key', function () {
            var label = getLabel();

            label.on('edittextstart', startEdit);
            label.on('edittextend', endEdit);
            label.startEditText();
            function startEdit() {
                var dom = label.getTextEditor().getDOM();
                maptalks.DomUtil.on(dom, 'keyup', function (ev) {
                    var oEvent = ev || event;
                    if (oEvent.keyCode === 13) {
                        dom.innerText += '\n';
                    }
                    var char = String.fromCharCode(oEvent.keyCode);
                    if (oEvent.shiftKey) {
                        if (char === '1') {
                            char = '!';
                            dom.innerText += char;
                            label.endEditText();
                        }
                    }
                });
                happen.keyup(dom, {
                    keyCode: 13
                });
                happen.keyup(dom, {
                    shiftKey: true,
                    keyCode: 49
                });
            }
            function endEdit() {
                var symbol = label._getInternalSymbol(),
                    font = maptalks.StringUtil.getFont(symbol);
                var spacing = symbol['textLineSpacing'] || 0;
                var h = maptalks.StringUtil.stringLength('test', font).height;
                var expected = h * 2 + spacing;
                expect(label.getSize()['height'] >= expected).to.be.ok();
            }
        });

        it('can not be edited with startEdit', function () {
            var label = getLabel();
            expect(label._canEdit()).not.to.be.ok();
        });

    });

});
