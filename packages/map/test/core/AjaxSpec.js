describe('Ajax.Spec', function () {
    it('get with options', function (done) {
        var url = 'http://localhost:9876/resources/arcgis.json';
        maptalks.Ajax.get(url, {
            headers : { foo : 'bar' }
        }, function (err, data) {
            expect(JSON.parse(data).mapName).to.be.ok();
            done();
        });
    });

    it('get without options', function (done) {
        var url = 'http://localhost:9876/resources/arcgis.json';
        maptalks.Ajax.get(url, function (err, data) {
            expect(JSON.parse(data).mapName).to.be.ok();
            done();
        });
    });

    it('get with old style options', function (done) {
        var url = 'http://localhost:9876/resources/arcgis.json';
        maptalks.Ajax.get(url, function (err, data) {
            expect(JSON.parse(data).mapName).to.be.ok();
            done();
        }, {
            headers : { foo : 'bar' }
        });
    });

    it('getJSON', function (done) {
        var url = 'http://localhost:9876/resources/arcgis.json';
        maptalks.Ajax.getJSON(url, {
            headers : { foo : 'bar' }
        }, function (err, data) {
            expect(data.mapName).to.be.ok();
            done();
        });
    });

    it('getJSON without options', function (done) {
        var url = 'http://localhost:9876/resources/arcgis.json';
        maptalks.Ajax.getJSON(url, function (err, data) {
            expect(data.mapName).to.be.ok();
            done();
        });
    });

    it('getJSON with old style options', function (done) {
        var url = 'http://localhost:9876/resources/arcgis.json';
        maptalks.Ajax.getJSON(url, function (err, data) {
            expect(data.mapName).to.be.ok();
            done();
        }, {
            headers : { foo : 'bar' }
        });
    });

    it('getArrayBuffer', function (done) {
        var url = 'http://localhost:9876/resources/arcgis.json';
        maptalks.Ajax.getArrayBuffer(url, {
            headers : { foo : 'bar' }
        }, function (err, data) {
            expect(data.cacheControl).to.be.ok();
            expect(data.expires).to.be.ok();
            expect(data.contentType).to.be.eql('application/json');
            expect(data.data instanceof ArrayBuffer).to.be.ok();
            done();
        });
    });

    it('getArrayBuffer without options', function (done) {
        var url = 'http://localhost:9876/resources/arcgis.json';
        maptalks.Ajax.getArrayBuffer(url, function (err, data) {
            expect(data.cacheControl).to.be.ok();
            expect(data.expires).to.be.ok();
            expect(data.contentType).to.be.eql('application/json');
            expect(data.data instanceof ArrayBuffer).to.be.ok();
            done();
        });
    });

    it('getArrayBuffer with old style options', function (done) {
        var url = 'http://localhost:9876/resources/arcgis.json';
        maptalks.Ajax.getArrayBuffer(url, function (err, data) {
            expect(data.cacheControl).to.be.ok();
            expect(data.expires).to.be.ok();
            expect(data.contentType).to.be.eql('application/json');
            expect(data.data instanceof ArrayBuffer).to.be.ok();
            done();
        }, {
            headers : { foo : 'bar' }
        });
    });

    it('getImage', function (done) {
        var url = 'http://localhost:9876/resources/tile.png';
        var image = new Image();
        image.onload = function () {
            expect(image.width).to.be.eql(13);
            expect(image.height).to.be.eql(13);
            done();
        };
        maptalks.Ajax.getImage(image, url, {
            headers : { foo : 'bar' }
        });
    });

    it('getImage without options', function (done) {
        var url = 'http://localhost:9876/resources/tile.png';
        var image = new Image();
        image.onload = function () {
            expect(image.width).to.be.eql(13);
            expect(image.height).to.be.eql(13);
            done();
        };
        maptalks.Ajax.getImage(image, url);
    });

    it('jsonp', function (done) {
        var url = 'http://localhost:9876/resources/jsonp';
        maptalks.Ajax.getJSON(url, {
            headers : { foo : 'bar' },
            jsonp : true
        }, function (err, data) {
            expect(data.foo).to.be.eql('bar');
            done();
        });
    });
});
