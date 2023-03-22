

export function fillNodepagesToCache(nodeCache, nodes) {
    if (!nodes) {
        return;
    }
    for (let i = 0; i < nodes.length; i++) {
        // 1.6版是id，1.7/1.8版是index
        const id = nodes[i].id || nodes[i].index;
        nodeCache[id] = nodes[i];
    }
}
