
import './editor/GeometryEditor';
import './editor/TextMarkerEditor';

import './ext/Geometry.Animation';
import './ext/Geometry.Drag';
import './ext/Geometry.Edit';
import './ext/Geometry.Events';
import './ext/Geometry.InfoWindow';
import './ext/Geometry.Menu';

import 'renderer/vectorlayer/Geometry.Renderer';
import 'renderer/vectorlayer/Geometry.Canvas';

import { Geometry } from './Geometry';
import { Marker } from './Marker';
import { Vector } from './Vector';
import { LineString, Polyline } from './LineString';
import { Polygon } from './Polygon';
import { MultiPoint } from './MultiPoint';
import { MultiLineString, MultiPolyline } from './MultiLineString';
import { MultiPolygon } from './MultiPolygon';
import { GeometryCollection } from './GeometryCollection';
import { GeoJSON } from './GeoJSON';
import { Circle } from './Circle';
import { Ellipse } from './Ellipse';
import { Rectangle } from './Rectangle';
import { Sector } from './Sector';
import { Curve } from './Curve';
import { ArcCurve } from './ArcCurve';
import { CubicBezierCurve } from './CubicBezierCurve';
import { QuadBezierCurve } from './QuadBezierCurve';
import { TextMarker } from './TextMarker';
import { TextBox } from './TextBox';
import { Label } from './Label';
import { ConnectorLine, ArcConnectorLine } from './ConnectorLine';

export function initGeometry(maptalks) {
    maptalks.Geometry = Geometry;
    maptalks.Marker = Marker;
    maptalks.Vector = Vector;
    maptalks.LineString = LineString;
    maptalks.Polyline = Polyline;
    maptalks.Polygon = Polygon;
    maptalks.MultiPoint = MultiPoint;
    maptalks.MultiLineString = MultiLineString;
    maptalks.MultiPolyline = MultiPolyline;
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

export * from './ArcCurve';
export * from './Circle';
export * from './ConnectorLine';
export * from './CubicBezierCurve';
export * from './Curve';
export * from './Ellipse';
export * from './GeoJSON';
export * from './Geometry';
export * from './GeometryCollection';
export * from './Label';
export * from './LineString';
export * from './Marker';
export * from './MultiLineString';
export * from './MultiPoint';
export * from './MultiPolygon';
export * from './Polygon';
export * from './QuadBezierCurve';
export * from './Rectangle';
export * from './Sector';
export * from './TextBox';
export * from './TextMarker';
export * from './Vector';
