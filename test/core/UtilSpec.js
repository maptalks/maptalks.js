describe('Util', function () {


    describe('replace variable', function () {
        it('replace variables with value', function () {
            var str = '{foo} is not {foo2}.';
            var r = maptalks.StringUtil.replaceVariable(str, { foo : 'apple', foo2 : 'pear' });
            expect(r).to.eql('apple is not pear.');
        });

        it('replace variables without value', function () {
            var str = '{foo} is not {foo2}.';
            var r = maptalks.StringUtil.replaceVariable(str, { foo : 'apple' });
            expect(r).to.eql('apple is not .');
        });

        it('input null', function () {
            var str = '{foo} is not {foo2}.';
            var r = maptalks.StringUtil.replaceVariable(str, null);
            expect(r).to.eql(' is not .');
        });
    });

    it('sign', function () {
        expect(maptalks.Util.sign(-2)).to.be.eql(-1);
        expect(maptalks.Util.sign(2)).to.be.eql(1);
    });

    it('getSymbolStamp', function () {
        var symbol = {
            'markerType' : 'ellipse',
            'markerFill' : {
                type : 'radial',
                colorStops : [
                    [0.40, 'rgba(17, 172, 263, 1)'],
                    [0.00, 'rgba(17, 172, 263, 0)'],
                ]
            },
            'markerWidth' : 10,
            'markerHeight' : 10
        };
        var expected = 'markerType=ellipse;markerFill=radial_0,rgba(17, 172, 263, 0),0.4,rgba(17, 172, 263, 1);markerWidth=10;markerHeight=10';
        expect(maptalks.Util.getSymbolStamp(symbol)).to.be.eql(expected);

        symbol = [
            {
                'markerFile' : 'foo.png',
                'markerWidth' : 5,
                'markerHeight': 5
            },
            {
                'markerType' : 'ellipse',
                'markerFill' : {
                    type : 'radial',
                    colorStops : [
                        [0.40, 'rgba(17, 172, 263, 1)'],
                        [0.00, 'rgba(17, 172, 263, 0)'],
                    ]
                },
                'markerWidth' : 10,
                'markerHeight' : 10
            }
        ];
        expected = '[ markerFile=foo.png;markerWidth=5;markerHeight=5 , markerType=ellipse;markerFill=radial_0,rgba(17, 172, 263, 0),0.4,rgba(17, 172, 263, 1);markerWidth=10;markerHeight=10 ]';
        expect(maptalks.Util.getSymbolStamp(symbol)).to.be.eql(expected);
    });

    describe('split content', function () {
        var style = {
            'textFaceName': 'sans-serif',
            'textSize': 18,
            'textFill': '#333333',
            'textWrapWidth': 100,
            'textLineSpacing' : 8
        };
        var font = maptalks.StringUtil.getFont(style), wrapWidth = style['textWrapWidth'];
        var shortText = 'short text.';
        it('split short text', function () {
            var shorts = maptalks.StringUtil.splitContent(shortText, font, wrapWidth);
            for (var i = 0; i < shorts.length; i++) {
                var size = maptalks.StringUtil.stringLength(shorts[i], font);
                expect(size['width']).to.be.below(wrapWidth);
            }
        });

        var longText = 'This is a long text : 213232132323213213123213213123213213213123123123123123123123123123123123123123.';
        it('split long text', function () {
            var longs = maptalks.StringUtil.splitContent(longText, font, wrapWidth);
            for (var i = 0; i < longs.length; i++) {
                var size = maptalks.StringUtil.stringLength(longs[i], font);
                expect(size['width']).not.to.be.above(wrapWidth);
            }
        });

        var longText = '这是一段需要分割的中文长文本字符串;这是一段需要分割的中文长文本字符串;这是一段需要分割的中文长文本字符串。';
        it('split chinese text', function () {
            var longs = maptalks.StringUtil.splitContent(longText, font, wrapWidth);
            for (var i = 0; i < longs.length; i++) {
                var size = maptalks.StringUtil.stringLength(longs[i], font);
                expect(size['width']).not.to.be.above(wrapWidth);
            }
        });
    });
});
