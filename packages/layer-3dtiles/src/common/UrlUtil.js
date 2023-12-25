export function isRelativeURL(url) {
    return url.indexOf('http://') === -1 && url.indexOf('https://') === -1 && url.indexOf('file://') === -1;
}

export function prepareFetchOptions(fetchOptions) {
    fetchOptions = fetchOptions || {};
    fetchOptions.referrerPolicy = fetchOptions.referrerPolicy || 'origin';
    fetchOptions.referrer = window && window.location.href;
    return fetchOptions;
}
