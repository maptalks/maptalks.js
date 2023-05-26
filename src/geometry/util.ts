
export function isGeometry(owner) {
    return owner.isGeometry && owner.isGeometry();
}

export function isPointGeometry(owner) {
    return isGeometry(owner) && owner.type && owner.type === 'Point';
}

export function isMultiPointGeometry(owner) {
    return isGeometry(owner) && owner.type === 'MultiPoint';
}

export function isLineStringGeometry(owner) {
    return isGeometry(owner) && (owner.type === 'LineString' || owner.type === 'Polyline');
}
export function isMultiLineStringGeometry(owner) {
    return isGeometry(owner) && owner.type === 'MultiLineString';
}