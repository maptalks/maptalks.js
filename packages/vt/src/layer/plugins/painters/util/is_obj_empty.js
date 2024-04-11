export function isObjectEmpty(features) {
    if (!features) {
        return true;
    }
    if (features.empty !== undefined) {
        return features.empty;
    }
    features.empty = isEmpty(features);
    return features.empty;
}

function isEmpty(obj) {
    for (const p in obj) return false;
    return true;
}
