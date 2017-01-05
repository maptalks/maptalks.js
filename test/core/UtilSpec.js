describe('Util', function() {


    describe('replace variable', function() {
        it('replace variables with value', function () {
            var str = '{foo} is not {foo2}.';
            var r = maptalks.Util.replaceVariable(str, {foo : 'apple', foo2 : 'pear'});
            expect(r).to.eql('apple is not pear.');
        });

        it('input null', function () {
            var str = '{foo} is not {foo2}.';
            var r = maptalks.Util.replaceVariable(str, null);
            expect(r).to.eql(str);
        });
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
});
