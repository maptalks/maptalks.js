export function getLabelContent(mesh, idx) {
    const { aPickingId, features } = mesh.geometry.properties;
    const pickingId = aPickingId[idx];
    const feature = features && features[pickingId] && features[pickingId].feature;
    return feature && feature.label;
}
