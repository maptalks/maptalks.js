import Ellipse from '../../geometry/Ellipse';
import ArcCurve from '../../geometry/ArcCurve';
import LineString from '../../geometry/LineString';
import { extendSymbol } from '../../core/util/style';
import QuadBezierCurve from '../../geometry/QuadBezierCurve';
import Coordinate from '../../geo/Coordinate';
import Marker from '../../geometry/Marker';
import CubicBezierCurve from '../../geometry/CubicBezierCurve';
import Circle from '../../geometry/Circle';
import Polygon from '../../geometry/Polygon';
import Point from '../../geo/Point';

const RegisterModes = {};

RegisterModes['circle'] = {
    'freehand': false,
    'limitClickCount': 1,
    'action': ['click'],
    'create': function (coordinate) {
        return new Circle(coordinate, 0);
    },
    'update': function (coordinate, geometry) {
        const map = geometry.getMap();
        const radius = map.computeLength(geometry.getCenter(), coordinate);
        geometry.setRadius(radius);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

RegisterModes['ellipse'] = {
    'freehand': true,
    'action': ['mousedown', 'drag', 'mouseup'],
    'create': function (coordinate) {
        return new Ellipse(coordinate, 0, 0);
    },
    'update': function (coordinate, geometry) {
        const map = geometry.getMap();
        const center = geometry.getCenter();
        const rx = map.computeLength(center, new Coordinate({
            x: coordinate.x,
            y: center.y
        }));
        const ry = map.computeLength(center, new Coordinate({
            x: center.x,
            y: coordinate.y
        }));
        geometry.setWidth(rx * 2);
        geometry.setHeight(ry * 2);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

RegisterModes['rectangle'] = {
    'action': 'drag',
    'create': function (coordinate, param) {
        const rect = new Polygon([]);
        rect._firstClick = param['containerPoint'];
        return rect;
    },
    'update': function (coordinate, geometry, param) {
        const map = geometry.getMap();
        const containerPoint = param['containerPoint'];
        const firstClick = geometry._firstClick;
        const ring = [
            [firstClick.x, firstClick.y],
            [containerPoint.x, firstClick.y],
            [containerPoint.x, containerPoint.y],
            [firstClick.x, containerPoint.y],
        ];
        geometry.setCoordinates(ring.map(c => map.containerPointToCoord(new Point(c))));
    },
    'generate': function (geometry) {
        return geometry;
    }
};

RegisterModes['point'] = {
    'action': 'click',
    'create': function (coordinate) {
        return new Marker(coordinate);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

RegisterModes['polygon'] = {
    'action': 'clickDblclick',
    'create': function (path) {
        return new LineString(path);
    },
    'update': function (path, geometry) {
        const symbol = geometry.getSymbol();
        geometry.setCoordinates(path);

        const layer = geometry.getLayer();
        if (layer) {
            let polygon = layer.getGeometryById('polygon');
            if (!polygon && path.length >= 3) {
                polygon = new Polygon([path], {
                    'id': 'polygon'
                });
                if (symbol) {
                    const pSymbol = extendSymbol(symbol, {
                        'lineOpacity': 0
                    });
                    polygon.setSymbol(pSymbol);
                }
                polygon.addTo(layer);
            }
            if (polygon) {
                polygon.setCoordinates(path);
            }
        }
    },
    'generate': function (geometry) {
        return new Polygon(geometry.getCoordinates(), {
            'symbol': geometry.getSymbol()
        });
    }
};

RegisterModes['linestring'] = {
    'action': 'clickDblclick',
    'create': function (path) {
        return new LineString(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

RegisterModes['arccurve'] = {
    'action': 'clickDblclick',
    'create': function (path) {
        return new ArcCurve(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

RegisterModes['quadbeziercurve'] = {
    'action': 'clickDblclick',
    'create': function (path) {
        return new QuadBezierCurve(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

RegisterModes['cubicbeziercurve'] = {
    'action': 'clickDblclick',
    'create': function (path) {
        return new CubicBezierCurve(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

RegisterModes['boxZoom'] = {
    'action': 'drag',
    'create': function (coordinate) {
        const marker = new Marker(coordinate);
        marker._firstClick = coordinate;
        return marker;
    },
    'update': function (coordinate, geometry, param) {
        const map = geometry.getMap();
        const p1 = map.coordToContainerPoint(geometry._firstClick),
            p2 = param['containerPoint'];
        const coord = map.containerPointToCoordinate(new Coordinate(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y)));
        geometry.setCoordinates(coord)
            .updateSymbol({
                markerWidth  : Math.abs(p1.x - p2.x),
                markerHeight : Math.abs(p1.y - p2.y)
            });
    },
    'generate': function (geometry) {
        return geometry;
    }
};

export default RegisterModes;
