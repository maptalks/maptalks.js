import Ellipse from '../../geometry/Ellipse';
import ArcCurve from '../../geometry/ArcCurve';
import LineString from '../../geometry/LineString';
import { extendSymbol } from '../../core/util/style';
import QuadBezierCurve from '../../geometry/QuadBezierCurve';
import Coordinate from '../../geo/Coordinate';
import Point from '../../geo/Point';
import Marker from '../../geometry/Marker';
import CubicBezierCurve from '../../geometry/CubicBezierCurve';
import Circle from '../../geometry/Circle';
import Polygon from '../../geometry/Polygon';
import DrawTool from './DrawTool';

DrawTool.registerMode('circle', {
    'clickLimit': 2,
    'action': ['click', 'mousemove', 'click'],
    'create': function (coordinate) {
        return new Circle(coordinate[0], 0);
    },
    'update': function (path, geometry) {
        const map = geometry.getMap();
        const radius = map.computeLength(geometry.getCenter(), path[path.length - 1]);
        geometry.setRadius(radius);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('freeHandCircle', {
    'action': ['mousedown', 'mousemove', 'mouseup'],
    'create': function (coordinate) {
        return new Circle(coordinate[0], 0);
    },
    'update': function (path, geometry) {
        const map = geometry.getMap();
        const radius = map.computeLength(geometry.getCenter(), path[path.length - 1]);
        geometry.setRadius(radius);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('ellipse', {
    'clickLimit': 2,
    'action': ['click', 'mousemove', 'click'],
    'create': function (coordinates) {
        return new Ellipse(coordinates[0], 0, 0);
    },
    'update': function (path, geometry) {
        const map = geometry.getMap();
        const center = geometry.getCenter();
        const rx = map.computeLength(center, new Coordinate({
            x: path[path.length - 1].x,
            y: center.y
        }));
        const ry = map.computeLength(center, new Coordinate({
            x: center.x,
            y: path[path.length - 1].y
        }));
        geometry.setWidth(rx * 2);
        geometry.setHeight(ry * 2);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('freeHandEllipse', {
    'action': ['mousedown', 'mousemove', 'mouseup'],
    'create': function (coordinates) {
        return new Ellipse(coordinates[0], 0, 0);
    },
    'update': function (path, geometry) {
        const map = geometry.getMap();
        const center = geometry.getCenter();
        const rx = map.computeLength(center, new Coordinate({
            x: path[path.length - 1].x,
            y: center.y
        }));
        const ry = map.computeLength(center, new Coordinate({
            x: center.x,
            y: path[path.length - 1].y
        }));
        geometry.setWidth(rx * 2);
        geometry.setHeight(ry * 2);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('rectangle', {
    'clickLimit': 2,
    'action': ['click', 'mousemove', 'click'],
    'create': function (coordinates) {
        const rect = new Polygon([]);
        rect._firstClick = coordinates[0];
        return rect;
    },
    'update': function (coordinates, geometry, param) {
        const map = geometry.getMap();
        const containerPoint = param['containerPoint'];
        const firstClick = map.coordToContainerPoint(geometry._firstClick);
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
});

DrawTool.registerMode('freeHandRectangle', {
    'action': ['mousedown', 'mousemove', 'mouseup'],
    'create': function (coordinates) {
        const rect = new Polygon([]);
        rect._firstClick = coordinates[0];
        return rect;
    },
    'update': function (coordinates, geometry) {
        const firstClick = geometry._firstClick;
        const ring = [
            [firstClick.x, firstClick.y],
            [coordinates[0].x, firstClick.y],
            [coordinates[0].x, coordinates[0].y],
            [firstClick.x, coordinates[0].y],
        ];
        geometry.setCoordinates(ring);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('point', {
    'clickLimit': 1,
    'action': ['click'],
    'create': function (coordinate) {
        return new Marker(coordinate[0]);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('polygon', {
    'action': ['click', 'mousemove', 'dblclick'],
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
});

DrawTool.registerMode('freeHandPolygon', {
    'action': ['mousedown', 'mousemove', 'mouseup'],
    'create': function (path) {
        return new LineString(path);
    },
    'update': function (path, geometry) {
        const coordinates = geometry.getCoordinates();
        const symbol = geometry.getSymbol();
        geometry.setCoordinates(coordinates.concat(path));

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
});

DrawTool.registerMode('linestring', {
    'action': ['click', 'mousemove', 'dblclick'],
    'create': function (path) {
        return new LineString(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('freeHandLinestring', {
    'action': ['mousedown', 'mousemove', 'mouseup'],
    'create': function (path) {
        return new LineString(path);
    },
    'update': function (path, geometry) {
        const coordinates = geometry.getCoordinates();
        geometry.setCoordinates(coordinates.concat(path));
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('arccurve', {
    'action': ['click', 'mousemove', 'dblclick'],
    'create': function (path) {
        return new ArcCurve(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('quadbeziercurve', {
    'action': ['click', 'mousemove', 'dblclick'],
    'create': function (path) {
        return new QuadBezierCurve(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('cubicbeziercurve', {
    'action': ['click', 'mousemove', 'dblclick'],
    'create': function (path) {
        return new CubicBezierCurve(path);
    },
    'update': function (path, geometry) {
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
});

// TODO When action contains 'mousedown', It is in drag mode.
DrawTool.registerMode('boxZoom', {
    'action': ['mousedown', 'mousemove', 'mouseup'],
    'create': function (coordinates) {
        const marker = new Marker(coordinates[0]);
        marker._firstClick = coordinates[0];
        return marker;
    },
    'update': function (path, geometry, param) {
        const map = geometry.getMap();
        const p1 = map.coordToContainerPoint(geometry._firstClick),
            p2 = param['containerPoint'];
        const coords = map.containerPointToCoordinate(new Coordinate(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y)));
        geometry.setCoordinates(coords)
            .updateSymbol({
                markerWidth  : Math.abs(p1.x - p2.x),
                markerHeight : Math.abs(p1.y - p2.y)
            });
    },
    'generate': function (geometry) {
        return geometry;
    }
});
