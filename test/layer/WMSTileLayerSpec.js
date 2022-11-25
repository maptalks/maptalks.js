describe('WMSTileLayer', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '3px';
        container.style.height = '3px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('set tile size', function () {
        var tile1 = new maptalks.WMSTileLayer('tile', {
            urlTemplate : '/resources/tile.png',
            'layers' : 'layer',
            'styles' : 'styles',
            'version' : '1.3.0',
            'format': 'image/png',
            'transparent' : true,
            'uppercase' : true,
            'crs' : 'EPSG:4490',
            'renderer' : 'canvas',
            tileSize : [1, 2]
        });
        expect(tile1.getTileSize().toArray()).to.be.eql([1, 2]);

        var tile2 = new maptalks.WMSTileLayer('tile', {
            urlTemplate : '/resources/tile.png',
            'layers' : 'layer',
            'styles' : 'styles',
            'version' : '1.3.0',
            'format': 'image/png',
            'transparent' : true,
            'uppercase' : true,
            'crs' : 'EPSG:4490',
            'renderer' : 'canvas',
            tileSize : { width : 1, height : 2 }
        });

        expect(tile2.getTileSize().toArray()).to.be.eql([1, 2]);
    });

    /* it('add with dom renderer', function (done) {
        var tile = new maptalks.WMSTileLayer('tile', {
            urlTemplate : '/resources/tile.png',
            'layers' : 'layer',
            'styles' : 'styles',
            'version' : '1.3.0',
            'format': 'image/png',
            'transparent' : true,
            'uppercase' : true,
            'crs' : 'EPSG:4490',
            'renderer' : 'dom'
        });
        tile.once('layerload', function () {
            expect(tile.getTileUrl(1, 2, 1)).to.be.eql('/resources/tile.png?SERVICE=WMS&REQUEST=GetMap&LAYERS=layer&STYLES=styles&FORMAT=image%2Fpng&TRANSPARENT=true&VERSION=1.3.0&WIDTH=256&HEIGHT=256&CRS=EPSG%3A4490&BBOX=0.002789244055747986,-40075016.688367724,20037508.345578488,-20037508.34557848');
            done();
        });
        map.addLayer(tile);
    }); */

    it('add with canvas renderer', function () {
        var tile = new maptalks.WMSTileLayer('tile', {
            urlTemplate : '/resources/tile.png',
            'layers' : 'layer',
            'styles' : 'styles',
            'version' : '1.3.0',
            'format': 'image/png',
            'transparent' : true,
            'uppercase' : true,
            'crs' : 'EPSG:4490',
            'renderer' : 'canvas'
        });
        map.addLayer(tile);
        var expected = '/resources/tile.png?SERVICE=WMS&REQUEST=GetMap&LAYERS=layer&STYLES=styles&FORMAT=image%2Fpng&TRANSPARENT=true&VERSION=1.3.0&WIDTH=256&HEIGHT=256&CRS=EPSG%3A4490&BBOX=-40075016.68557848,0,-20037508.342789244,20037508.342789244';
        expect(tile.getTileUrl(1, 2, 1)).to.be.eql(expected);
    });

    it('map with crs EPSG:4326', function () {
        map.setSpatialReference({
            'projection' : 'EPSG:4326'
        });
        var tile = new maptalks.WMSTileLayer('tile', {
            urlTemplate : '/resources/tile.png',
            'layers' : 'layer',
            'styles' : 'styles',
            'version' : '1.3.0',
            'format': 'image/png',
            'transparent' : true,
            'uppercase' : true,
            'renderer' : 'canvas'
        });
        map.addLayer(tile);
        expect(tile.getTileUrl(0, 0, 1)).to.be.eql('/resources/tile.png?SERVICE=WMS&REQUEST=GetMap&LAYERS=layer&STYLES=styles&FORMAT=image%2Fpng&TRANSPARENT=true&VERSION=1.3.0&WIDTH=256&HEIGHT=256&CRS=EPSG%3A4326&BBOX=-90,-180,90,0');
    });

    it('map with crs EPSG:4326 in version 1.1.1', function () {
        map.setSpatialReference({
            'projection' : 'EPSG:4326'
        });
        var tile = new maptalks.WMSTileLayer('tile', {
            urlTemplate : '/resources/tile.png',
            'layers' : 'layer',
            'styles' : 'styles',
            'version' : '1.1.1',
            'format': 'image/png',
            'transparent' : true,
            'uppercase' : true,
            'renderer' : 'canvas'
        });
        map.addLayer(tile);
        expect(tile.getTileUrl(0, 0, 1)).to.be.eql('/resources/tile.png?SERVICE=WMS&REQUEST=GetMap&LAYERS=layer&STYLES=styles&FORMAT=image%2Fpng&TRANSPARENT=true&VERSION=1.1.1&WIDTH=256&HEIGHT=256&SRS=EPSG%3A4326&BBOX=-180,-90,0,90');
    });

    it('set crs to EPSG:4326 in options', function () {
        map.setSpatialReference({
            'projection' : 'EPSG:4326'
        });
        var tile = new maptalks.WMSTileLayer('tile', {
            urlTemplate : '/resources/tile.png',
            'layers' : 'layer',
            'styles' : 'styles',
            'version' : '1.3.0',
            'format': 'image/png',
            'transparent' : true,
            'uppercase' : true,
            'crs' : 'EPSG:4326',
            'renderer' : 'canvas'
        });
        map.addLayer(tile);
        expect(tile.getTileUrl(0, 0, 1)).to.be.eql('/resources/tile.png?SERVICE=WMS&REQUEST=GetMap&LAYERS=layer&STYLES=styles&FORMAT=image%2Fpng&TRANSPARENT=true&VERSION=1.3.0&WIDTH=256&HEIGHT=256&CRS=EPSG%3A4326&BBOX=-90,-180,90,0');
    });

    it('toJSON', function () {
        var tile = new maptalks.WMSTileLayer('tile', {
            urlTemplate : '/resources/tile.png',
            'layers' : 'layer',
            'styles' : 'styles',
            'version' : '1.3.0',
            'format': 'image/png',
            'transparent' : true,
            'uppercase' : true,
            'crs' : 'EPSG:4326',
            'renderer' : 'canvas'
        });
        expect(tile.toJSON()).to.be.eql({
            type: 'WMSTileLayer',
            id: 'tile',
            options: {
                urlTemplate: '/resources/tile.png',
                layers: 'layer',
                styles: 'styles',
                version: '1.3.0',
                format: 'image/png',
                transparent: true,
                uppercase: true,
                crs: 'EPSG:4326',
                renderer: 'canvas'
            }
        });
    });

    it('fromJSON', function () {
        var json = {
            type: 'WMSTileLayer',
            id: 'tile',
            options: {
                urlTemplate: '/resources/tile.png',
                layers: 'layer',
                styles: 'styles',
                version: '1.3.0',
                format: 'image/png',
                transparent: true,
                uppercase: true,
                renderer: 'canvas'
            }
        };
        var layer = maptalks.Layer.fromJSON(json);
        map.addLayer(layer);
        expect(layer.getTileUrl(1, 2, 1)).to.be.eql('/resources/tile.png?SERVICE=WMS&REQUEST=GetMap&LAYERS=layer&STYLES=styles&FORMAT=image%2Fpng&TRANSPARENT=true&VERSION=1.3.0&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX=0,-40075016.68557848,20037508.342789244,-20037508.342789244');
    });
});
