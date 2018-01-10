describe('Control.Attribution', function () {

var container;
var map;
var center = new maptalks.Coordinate(118.846825, 32.046534);

beforeEach(function () {
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
});

afterEach(function () {
    map.remove();
    REMOVE_CONTAINER(container);
});

it('add attribution of added layer', function () {
    var tileLayer = new maptalks.TileLayer('boudaries', {
        'urlTemplate': 'http://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png',
        'subdomains': ['a', 'b', 'c', 'd'],
        'attribution': 'guzr'
    });
    map.addLayer(tileLayer);
    var expectResult = 'Powered By <a href="http://www.maptalks.org" target="_blank">maptalks</a>guzr';
    var realResult = document.getElementsByClassName('maptalks-attribution')[0].firstChild.innerHTML;

    expect(expectResult).to.eql(realResult);

    // expect(control._attributionContainer.innerHTML).to.eql('<div>new content</div>');
    });
});
