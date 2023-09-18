export function isRelativeURL(url) {
    return url.indexOf('http://') === -1 && url.indexOf('https://') === -1 && url.indexOf('file://') === -1;
}
