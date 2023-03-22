let container, map;
const center = [0, 0];

beforeEach(function () {
    container = document.createElement('div');
    container.style.width = '400px';
    container.style.height = '300px';
    document.body.appendChild(container);
    map = new maptalks.Map(container, {
        center,
        zoom: 17
    });
});

afterEach(function () {
    map.remove();
    maptalks.DomUtil.removeDomNode(container);
});

describe('add transform control to map', function () {
});
