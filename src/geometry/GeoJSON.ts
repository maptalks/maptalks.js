import {
    isNil,
    isString,
    parseJSON,
    isArrayHasData,
    pushIn,
    isNumber,
    extend,
    getAbsoluteURL,
    GUID
} from '../core/util';
import Marker from './Marker';
import LineString from './LineString';
import Polygon from './Polygon';
import MultiPoint from './MultiPoint';
import MultiLineString from './MultiLineString';
import MultiPolygon from './MultiPolygon';
import GeometryCollection from './GeometryCollection';
import Geometry from './Geometry';
import { GEOJSON_TYPES } from '../core/Constants';
import { runTaskAsync } from '../core/MicroTask';
import Actor from '../core/worker/Actor';
import { registerWorkerAdapter } from '../core/worker/Worker';

const types = {
    'Marker': Marker,
    'LineString': LineString,
    'Polygon': Polygon,
    'MultiPoint': MultiPoint,
    'MultiLineString': MultiLineString,
    'MultiPolygon': MultiPolygon
};

const WORKER_KEY = 'geojson-fetch-worker-page-async';
const WORKER_CODE = `
function (exports) {
    const resultMap = {};

    function handleResult(msg, postResponse) {
        const data = msg.data || {};
        const { taskId } = data;
        const features = resultMap[taskId];
        if (!features) {
            postResponse('not find geojson dataset the taskId:' + taskId);
            return;
        }
        if (features.length === 0) {
            delete resultMap[taskId];
            postResponse(null, []);
            return;
        }
        const pageSize = data.pageSize || 2000;
        const pageFeatures = features.slice(0, pageSize);
        resultMap[taskId] = features.slice(pageSize, Infinity);
        postResponse(null, pageFeatures);
    }
    //worker init
    exports.initialize = function () {
        // console.log("geojson fetch init");
    };
    //recive message
    exports.onmessage = function (msg, postResponse) {
        const { taskId, type, url } = msg.data || {};
        if (!taskId) {
            postResponse('not find task id for get geojson dataset,taskId=' + taskId);
            return;
        }
        if (type === 'fetchdata') {
            if (!url) {
                postResponse('url is null,url=' + url);
                return;
            }
            fetch(url).then(res => res.json()).then(geojson => {
                let features;
                if (Array.isArray(geojson)) {
                    features = geojson;
                } else if (geojson.features) {
                    features = geojson.features;
                } else {
                    features = [geojson];
                }
                resultMap[taskId] = features;
                handleResult(msg, postResponse);
            }).catch(errror => {
                postResponse(errror.message);
            });
        } else if (type === 'pagefeatures') {
            handleResult(msg, postResponse);
        } else {
            postResponse('not support task type:' + type);
        }
    };
}`;

class GeoJSONFetchActor extends Actor {

    constructor() {
        super(WORKER_KEY);
    }

    _sendMsg(options: any, featuresList: any, cb: any) {
        this.send(options, [], (error?: any, data?: any) => {
            if (error) {
                cb(error);
            } else {
                this._pageFeatures(options, data, featuresList, cb);
            }
        }, options.workerId);
    }

    _fetchGeoJSON(url: any, options: any, featuresList: [] = [], cb: any): void {
        const opts = extend({}, options);
        opts.type = 'fetchdata';
        opts.url = url;
        this._sendMsg(opts, featuresList, cb);
    }

    _pageFeatures(options: any, features: any, featuresList: any, cb: any): void {
        featuresList.push(features);
        if (features.length === 0) {
            cb(null, featuresList);
            return;
        }
        const opts = extend({}, options);
        opts.type = 'pagefeatures';
        this._sendMsg(opts, featuresList, cb);
    }
}

registerWorkerAdapter(WORKER_KEY, function () { return WORKER_CODE; });

let fetchActor: GeoJSONFetchActor;

/**
 * GeoJSON工具类
 * @english
 * GeoJSON utilities
 * @category geometry
 */
const GeoJSON = {

    /**
     * 将一个或多个GeoJSON对象转换为几何体
     * @english
     * Convert one or more GeoJSON objects to geometry
     * @param  {String|Object|Object[]} geoJSON - GeoJSON objects or GeoJSON string
     * @param  {Function} [foreachFn=undefined] - callback function for each geometry
     * @return {Geometry|Geometry[]} a geometry array when input is a FeatureCollection
     * @example
     * var collection = {
     *      "type": "FeatureCollection",
     *      "features": [
     *          { "type": "Feature",
     *            "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
     *            "properties": {"prop0": "value0"}
     *           },
     *           { "type": "Feature",
     *             "geometry": {
     *                 "type": "LineString",
     *                 "coordinates": [
     *                     [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
     *                 ]
     *             },
     *             "properties": {
     *                 "prop0": "value0",
     *                 "prop1": 0.0
     *             }
     *           },
     *           { "type": "Feature",
     *             "geometry": {
     *                 "type": "Polygon",
     *                 "coordinates": [
     *                     [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
     *                       [100.0, 1.0], [100.0, 0.0] ]
     *                 ]
     *             },
     *             "properties": {
     *                 "prop0": "value0",
     *                 "prop1": {"this": "that"}
     *             }
     *          }
     *      ]
     *  }
     *  // A geometry array.
     *  const geometries = GeoJSON.toGeometry(collection, geometry => { geometry.config('draggable', true); });
     */
    toGeometry: function (geoJSON: any, foreachFn?: any): any {
        if (isString(geoJSON)) {
            geoJSON = parseJSON(geoJSON);
        }
        if (Array.isArray(geoJSON)) {
            const resultGeos = [];
            for (let i = 0, len = geoJSON.length; i < len; i++) {
                const geo = GeoJSON._convert(geoJSON[i], foreachFn);
                if (Array.isArray(geo)) {
                    pushIn(resultGeos, geo);
                } else {
                    resultGeos.push(geo);
                }
            }
            return resultGeos;
        } else {
            const resultGeo = GeoJSON._convert(geoJSON, foreachFn);
            return resultGeo;
        }

    },
    /**
     * async将一个或多个GeoJSON对象转换为几何体
     * @english
    * async Convert one or more GeoJSON objects to geometry
    * @param  {String|Object|Object[]} geoJSON - GeoJSON objects or GeoJSON string
    * @param  {Function} [foreachFn=undefined] - callback function for each geometry
    * @param  {Number} [countPerTime=2000] - Number of graphics converted per time
    * @return {Promise}
    * @example
    *  GeoJSON.toGeometryAsync(geoJSON).then(geos=>{
    *    console.log(geos);
    * })
    * */
    toGeometryAsync(geoJSON: any, foreachFn: any, countPerTime: number = 2000): any {
        if (isString(geoJSON)) {
            geoJSON = parseJSON(geoJSON);
        }
        return new Promise((resolve) => {
            const resultGeos = [];
            if (geoJSON && (Array.isArray(geoJSON) || Array.isArray(geoJSON.features))) {
                const pageSize = isNumber(countPerTime) ? Math.round(countPerTime) : 2000;
                const features = geoJSON.features || geoJSON;
                const count = Math.ceil(features.length / pageSize);
                let page = 1;
                const run = () => {
                    const startIndex = (page - 1) * pageSize, endIndex = (page) * pageSize;
                    const fs = features.slice(startIndex, endIndex);
                    const geos = GeoJSON.toGeometry(fs, foreachFn);
                    page++;
                    return geos;
                };
                runTaskAsync({ count, run }).then((geoList) => {
                    for (let i = 0, len = geoList.length; i < len; i++) {
                        const geo = geoList[i];
                        if (!geo) {
                            continue;
                        }
                        if (Array.isArray(geo)) {
                            pushIn(resultGeos, geo);
                        } else {
                            resultGeos.push(geo);
                        }
                    }
                    resolve(resultGeos);
                });
            } else {
                const geo = GeoJSON.toGeometry(geoJSON, foreachFn);
                resolve(geo);
            }
        });
    },

    /**
     * 转换单个GeoJSON对象
     * @english
     * Convert single GeoJSON object
     * @param  {Object} geoJSONObj - a GeoJSON object
     * @return {Geometry}
     * @private
     */
    _convert: function (json: any, foreachFn?: any): any {
        if (!json || isNil(json['type'])) {
            return null;
        }

        const type = json['type'];
        if (type === 'Feature') {
            const g = json['geometry'];
            const geometry = GeoJSON._convert(g);
            if (!geometry) {
                return null;
            }
            geometry.setId(json['id']);
            geometry.setProperties(json['properties']);
            if (foreachFn) {
                foreachFn(geometry);
            }
            return geometry;
        } else if (type === 'FeatureCollection') {
            const features = json['features'];
            if (!features) {
                return null;
            }
            return GeoJSON.toGeometry(features, foreachFn);
        } else if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].indexOf(type) >= 0) {
            const clazz = (type === 'Point' ? 'Marker' : type);
            const result = new types[clazz](json['coordinates']);
            if (foreachFn) {
                foreachFn(result);
            }
            return result;
        } else if (type === 'GeometryCollection') {
            const geometries = json['geometries'];
            if (!isArrayHasData(geometries)) {
                const result = new GeometryCollection();
                if (foreachFn) {
                    foreachFn(result);
                }
                return result;
            }
            const mGeos = [];
            const size = geometries.length;
            for (let i = 0; i < size; i++) {
                //circle ellipse etc...
                //规范上geojson里是没有Circle等图形的，但是Circle json等的反序列化有用到该方法
                if (geometries[i].subType) {
                    // @ts-expect-error todo
                    mGeos.push(Geometry.getJSONClass(geometries[i].subType).fromJSON(geometries[i]));
                } else {
                    mGeos.push(GeoJSON._convert(geometries[i]));
                }
            }
            const result = new GeometryCollection(mGeos);
            if (foreachFn) {
                foreachFn(result);
            }
            return result;
        }
        return null;
    },

    _isGeoJSON(json: any): boolean {
        if (!json) {
            return false;
        }
        json = json || {};
        //is flat geometries,[geometry,geometry,...]
        if (Array.isArray(json) && json.length) {
            // @ts-expect-error todo
            return GeoJSON.isGeoJSON(json[0]);
        }
        const type = json.type;
        if (!type) {
            return false;
        }
        if (GEOJSON_TYPES.indexOf(type) === -1) {
            return false;
        }
        const { features, geometries, geometry, coordinates } = json;

        //Geometry
        if (coordinates && Array.isArray(coordinates)) {
            return true;
        }
        //GeometryCollection
        if (Array.isArray(geometries)) {
            return true;
        }

        //FeatureCollection
        if (Array.isArray(features)) {
            return true;
        }
        //Feature
        if (geometry) {
            const coordinates = geometry.coordinates;
            if (coordinates && Array.isArray(coordinates)) {
                return true;
            }
        }
        return false;

    },
    /**
     * 正在请求一个大容量的geojson文件。解决主线程阻塞问题
     * @english
    * Requesting a large volume geojson file.Solve the problem of main thread blocking
    * @param  {String} url - GeoJSON file path
    * @param  {Number} [countPerTime=2000] - Number of graphics converted per time
    * @return {Promise}
    * @example
    *  GeoJSON.fetch('https://abc.com/file.geojson',2000).then(geojson=>{
    *    console.log(geojson);
    * })
    * */
    fetch(url: any, countPerTime: number = 2000): any {
        return new Promise((resolve, reject) => {
            if (!url || !isString(url)) {
                reject('url is error,It should be string');
                return;
            }
            const options: any = extend({ pageSize: 2000 }, { pageSize: countPerTime });
            url = getAbsoluteURL(url);
            if (!fetchActor) {
                fetchActor = new GeoJSONFetchActor();
            }
            const workerCount = fetchActor.workers.length;
            let workerId = Math.floor(Math.random() * workerCount);
            workerId = Math.min(workerCount - 1, workerId);
            options.workerId = workerId;
            options.taskId = GUID();
            fetchActor._fetchGeoJSON(url, options, [], (error, featuresList) => {
                if (error) {
                    reject(error);
                    return;
                }
                const result = [];
                featuresList.forEach(features => {
                    for (let i = 0, len = features.length; i < len; i++) {
                        result.push(features[i]);
                    }
                });
                resolve({
                    type: 'FeatureCollection',
                    features: result
                });
            });
        });
    }
};

export default GeoJSON;
