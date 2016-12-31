
import './editor/GeometryEditor';
import './editor/TextMarkerEditor';

import './ext/Geometry.Animation';
import './ext/Geometry.Drag';
import './ext/Geometry.Edit';
import './ext/Geometry.Events';
import './ext/Geometry.InfoWindow';

import Geometry from './Geometry';
import Marker from './Marker';
import LineString from './LineString';
import Polygon from './Polygon';
import MultiPoint from './MultiPoint';
import MultiLineString from './MultiLineString';
import MultiPolygon from './MultiPolygon';
import GeometryCollection from './GeometryCollection';
import GeoJSON from './GeoJSON';
import Circle from './Circle';
import Ellipse from './Ellipse';
import Rectangle from './Rectangle';
import Sector from './Sector';
import Curve from './Curve';
import ArcCurve from './ArcCurve';
import CubicBezierCurve from './CubicBezierCurve';
import QuadBezierCurve from './QuadBezierCurve';
import TextMarker from './TextMarker';
import TextBox from './TextBox';
import Label from './Label';
import { ConnectorLine, ArcConnectorLine } from './ConnectorLine';

export function exportGeometries(maptalks) {
    maptalks.Geometry = Geometry;
    maptalks.Marker = Marker;
    maptalks.LineString = LineString;
    maptalks.Polyline = ;
    maptalks.Polygon = Polygon;
    maptalks.MultiPoint = MultiPoint;
    maptalks.MultiLineString = MultiLineString;
    maptalks.MultiPolyline = MultiLineString;
    maptalks.MultiPolygon = MultiPolygon;
    maptalks.GeometryCollection = GeometryCollection;
    maptalks.GeoJSON = GeoJSON;
    maptalks.Circle = Circle;
    maptalks.Ellipse = Ellipse;
    maptalks.Rectangle = Rectangle;
    maptalks.Sector = Sector;
    maptalks.Curve = Curve;
    maptalks.ArcCurve = ArcCurve;
    maptalks.CubicBezierCurve = CubicBezierCurve;
    maptalks.QuadBezierCurve = QuadBezierCurve;
    maptalks.TextMarker = TextMarker;
    maptalks.TextBox = TextBox;
    maptalks.Label = Label;
    maptalks.ConnectorLine = ConnectorLine;
    maptalks.ArcConnectorLine = ArcConnectorLine;
}

export {
    ArcCurve,
    Circle,
    ConnectorLine, ArcConnectorLine,
    CubicBezierCurve,
    Curve,
    Ellipse,
    GeoJSON,
    Geometry,
    GeometryCollection,
    Label,
    LineString,
    Marker,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    Polygon,
    QuadBezierCurve,
    Rectangle,
    Sector,
    TextBox,
    TextMarker
};
