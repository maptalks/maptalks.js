import Control from './Control';
/**
 * @classdesc
 * A control to allows to display attribution content in a small text box on the map.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var map = new maptalks.Map('map', {
 *    center: [-0.113049, 51.498568],
 *    zoom: 14,
 *    attribution: {
 *       content : 'my attribution',
 *       position : 'bottom-left'
 *    },
 *    baseLayer: new maptalks.TileLayer('base', {
 *        urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
 *        subdomains: ['a','b','c','d'],
 *        attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
 *    })
 * });
 * map.addLayer(new maptalks.TileLayer('base', {
 *      urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
 *      subdomains: ['a','b','c','d'],
 *      attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
 * }));
 */
declare class Attribution extends Control {
    _attributionContainer: HTMLDivElement;
    buildOn(): HTMLDivElement;
    onAdd(): void;
    onRemove(): void;
    _update(): void;
}
export default Attribution;
