import { Coordinate } from "./geo"

/**
 * for global type:such as MapView MapEvent etc;
 */

export type MapView = {
    center?: Array<number> | Coordinate;
    zoom?: number;
    pitch?: number;
    bearing?: number;
}