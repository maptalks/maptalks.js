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
    it('set map.options.attribution to false', function () {
        container = document.createElement('div');
        container.style.width = '10px';
        container.style.height = '10px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center,
            attribution: false
        };
        map = new maptalks.Map(container, option);

        var tileLayer = new maptalks.TileLayer('boudaries', {
            urlTemplate : '#',
            'subdomains': ['a', 'b', 'c', 'd'],
            'attribution': 'guzr'
        });
        map.addLayer(tileLayer);
        var expectResult = 0;
        var realResult = document.getElementsByClassName('maptalks-attribution').length;

        expect(expectResult).to.eql(realResult);
    });

    it('add attribution of added layer; no baseLayer', function () {
        container = document.createElement('div');
        container.style.width = '10px';
        container.style.height = '10px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center,
            attribution: true // option
        };
        map = new maptalks.Map(container, option);

        var tileLayer = new maptalks.TileLayer('boudaries', {
            urlTemplate : '#',
            'subdomains': ['a', 'b', 'c', 'd'],
            'attribution': 'guzr'
        });
        map.addLayer(tileLayer);
        var expectResult = '<a href="http://maptalks.org" target="_blank">maptalks</a> - guzr';
        var realResult = document.getElementsByClassName('maptalks-attribution')[0].firstChild.innerHTML;

        expect(expectResult).to.eql(realResult);
    });
    it('has baseLayer', function () {
        container = document.createElement('div');
        container.style.width = '10px';
        container.style.height = '10px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center,
            baseLayer: new maptalks.TileLayer('base', {
                urlTemplate : '#',
                subdomains: ['a', 'b', 'c', 'd'],
                attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
            })
        };
        map = new maptalks.Map(container, option);
        var expectResult = '<a href="http://maptalks.org" target="_blank">maptalks</a> - © <a href="https://carto.com/">CARTO</a>';
        var realResult = document.getElementsByClassName('maptalks-attribution')[0].firstChild.innerHTML;
        expect(expectResult).to.eql(realResult);
    });
    it('no attribution content in map options', function () {
        container = document.createElement('div');
        container.style.width = '10px';
        container.style.height = '10px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center,
            attribution: {
                'position': 'bottom-right'
            }
        };
        map = new maptalks.Map(container, option);
        var expectResult = '<a href="http://maptalks.org" target="_blank">maptalks</a>';
        var realResult = document.getElementsByClassName('maptalks-attribution')[0].firstChild.innerHTML;
        expect(expectResult).to.eql(realResult);
    });
    it('set custom attribution content', function () {
        container = document.createElement('div');
        container.style.width = '10px';
        container.style.height = '10px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center,
            attribution: {
                'position': 'bottom-right',
                'content': 'tests'
            }
        };
        map = new maptalks.Map(container, option);
        var expectResult = 'tests';
        var realResult = document.getElementsByClassName('maptalks-attribution')[0].firstChild.innerHTML;
        expect(expectResult).to.eql(realResult);
    });
    it('set custom attribution content and add layer', function () {
        container = document.createElement('div');
        container.style.width = '10px';
        container.style.height = '10px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center,
            attribution: {
                'position': 'bottom-right',
                'content': 'tests'
            }
        };
        map = new maptalks.Map(container, option);
        var tileLayer = new maptalks.TileLayer('boudaries', {
            urlTemplate : '#',
            'subdomains': ['a', 'b', 'c', 'd'],
            'attribution': 'guzr'
        });
        map.addLayer(tileLayer);
        var expectResult = 'tests - guzr';
        var realResult = document.getElementsByClassName('maptalks-attribution')[0].firstChild.innerHTML;
        expect(expectResult).to.eql(realResult);
    });
});
