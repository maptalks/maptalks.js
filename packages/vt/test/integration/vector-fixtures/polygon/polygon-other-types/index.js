const maptalks = require('maptalks');

const cirlce = new maptalks.Circle([1, 1], 40000, {
    symbol: {
        polygonFill: '#f00'
    }
});

const ellipse = new maptalks.Ellipse([-1, 1], 80000, 40000, {
    symbol: {
        polygonFill: '#f00'
    }
});

const rectangle = new maptalks.Rectangle([-1, -0.5], 80000, 40000, {
    symbol: {
        polygonFill: '#f00'
    }
});

const sector = new maptalks.Sector([1, -0.5], 40000, 20, 90, {
    symbol: {
        polygonFill: '#f00'
    }
});



module.exports = {
    data: [cirlce, ellipse, rectangle, sector],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
