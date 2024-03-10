type AjaxOptions = {
    url?: string;
    headers?: object;
    responseType?: string;
    credentials?: string;
    postData?: any;
};
type AjaxCallBack = (err: any, data: any) => void;
/**
 * @classdesc
 * Ajax Utilities. It is static and should not be initiated.
 * @class
 * @static
 * @category core
 */
declare const Ajax: {
    /**
     * Get JSON data by jsonp
     * from https://gist.github.com/gf3/132080/110d1b68d7328d7bfe7e36617f7df85679a08968
     * @param  {String}   url - resource url
     * @param  {Function} cb  - callback function when completed
     */
    jsonp: (url: string, callback: AjaxCallBack) => any;
    /**
     * Fetch remote resource by HTTP "GET" method
     * @param  {String}   url - resource url
     * @param  {Object}   [options=null] - request options
     * @param  {Object}   [options.headers=null] - HTTP headers
     * @param  {String}   [options.responseType=null] - responseType
     * @param  {String}   [options.credentials=null]  - if with credentials, set it to "include"
     * @param  {Function} cb  - callback function when completed
     * @return {Ajax}  Ajax
     * @example
     * maptalks.Ajax.get(
     *     'url/to/resource',
     *     (err, data) => {
     *         if (err) {
     *             throw new Error(err);
     *         }
     *         // do things with data
     *     }
     * );
     */
    get: (url: string, options: AjaxOptions, cb: AjaxCallBack) => any;
    /**
     * Fetch remote resource by HTTP "POST" method
     * @param  {String}   url - resource url
     * @param  {Object}   options - request options
     * @param  {String|Object}  options.postData - post data
     * @param  {Object}   [options.headers=null]  - HTTP headers
     * @param  {Function} cb  - callback function when completed
     * @return {Ajax}  Ajax
     * @example
     * maptalks.Ajax.post(
     *   'url/to/post',
     *   {
     *     postData : {
     *       'param0' : 'val0',
     *       'param1' : 1
     *     }
     *   },
     *   (err, data) => {
     *     if (err) {
     *       throw new Error(err);
     *     }
     *     // do things with data
     *   }
     * );
     */
    post: (url: string, options: AjaxOptions, cb: AjaxCallBack) => any;
    _wrapCallback: (client: any, cb: any) => () => void;
    _getClient: (cb: any) => any;
    /**
     * Fetch resource as arraybuffer.
     * @param {String} url    - url
     * @param {Object} [options=null] - options, same as Ajax.get
     * @param {Function} cb   - callback function when completed.
     * @example
     * maptalks.Ajax.getArrayBuffer(
     *     'url/to/resource.bin',
     *     (err, data) => {
     *         if (err) {
     *             throw new Error(err);
     *         }
     *         // data is a binary array
     *     }
     * );
     */
    getArrayBuffer(url: string, options: AjaxOptions, cb: AjaxCallBack): any;
    getImage(img: HTMLImageElement, url: string, options: AjaxOptions): any;
    /**
     * Fetch resource as a JSON Object.
     * @param {String} url          - json's url
     * @param {Object} [options=null]        - optional options
     * @param {String} [options.jsonp=false] - fetch by jsonp, false by default
     * @param {Function} cb   - callback function when completed.
     * @example
     * maptalks.Ajax.getJSON(
     *     'url/to/resource.json',
     *     { jsonp : true },
     *     (err, json) => {
     *         if (err) {
     *             throw new Error(err);
     *         }
     *         // json is a JSON Object
     *         console.log(json.foo);
     *     }
     * );
     * @static
     */
    getJSON: (url: string, options: AjaxOptions, cb: AjaxCallBack) => any;
};
export default Ajax;
