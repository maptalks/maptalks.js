describe('Control.Attribution', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {

    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('add attribution of added layer; no baseLayer', function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center,
            attribution: true // option
        };
        map = new maptalks.Map(container, option);

        var tileLayer = new maptalks.TileLayer('boudaries', {
            'urlTemplate': 'http://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png',
            'subdomains': ['a', 'b', 'c', 'd'],
            'attribution': 'guzr'
        });
        map.addLayer(tileLayer);
        var expectResult = 'Powered By <a href="http://www.maptalks.org" target="_blank">maptalks</a>guzr';
        var realResult = document.getElementsByClassName('maptalks-attribution')[0].firstChild.innerHTML;

        expect(expectResult).to.eql(realResult);
    });
    it('has baseLayer', function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center,
            baseLayer: new maptalks.TileLayer('base', {
                urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                subdomains: ['a', 'b', 'c', 'd'],
                attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
            })
        };
        map = new maptalks.Map(container, option);
        var expectResult = 'Powered By <a href="http://www.maptalks.org" target="_blank">maptalks</a>© <a href="https://carto.com/">CARTO</a>';
        var realResult = document.getElementsByClassName('maptalks-attribution')[0].firstChild.innerHTML;
        expect(expectResult).to.eql(realResult);
    });
});
