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

export type Geometries =
    | ArcCurve
    | Circle
    | ConnectorLine
    | ArcConnectorLine
    | CubicBezierCurve
    | Curve
    | Ellipse
    | Geometry
    | GeometryCollection
    | Label
    | LineString
    | Marker
    | MultiLineString
    | MultiPoint
    | MultiPolygon
    | Polygon
    | QuadBezierCurve
    | Rectangle
    | Sector
    | TextBox
    | TextMarker

export type PathLikeGeometries =
    | Curve
    | ArcCurve
    | CubicBezierCurve
    | QuadBezierCurve
    | LineString
    | MultiLineString
    | ConnectorLine
    | Rectangle
    | Polygon
    | MultiPolygon
    | Circle
    | Sector
    | Ellipse

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
