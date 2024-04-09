import { Coordinate, Point } from '../../geo';

export type Event = {
    type: string;
    target: any;
    coordinate: Coordinate;
    containerPoint: Point;
    viewPoint: Point;
    domEvent: Event
}


// TODO:等待Coordinate，Geometry，Point补充类型
export type Param = {
    type: string;
    target: any;
    geometry: any;
    coordinate: Coordinate;
    containerPoint: Point;
    viewPoint: Point;
    domEvent: MouseEvent;
    ignoreEndEvent?: boolean;
    interupted?: boolean;
}
