
export function getBlockTagIndex(ref, tagName: string) {
    const blockTags = ref.blockTags;
    if (!blockTags) {
        return -1;
    }
    for (let i = 0; i < blockTags.length; i++) {
        if (blockTags[i].tag === tagName) {
            return i;
        }
    }
    return -1;
}

