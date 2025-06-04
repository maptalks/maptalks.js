const DEPTH_DICTIONARY = {
    '=': 'equal',
    '<': 'less',
    '<=': 'less-equal',
    'lequal': 'less-equal',
    '>': 'greater',
    '!=': 'not-equal',
    'notequal': 'not-equal',
    '>=': 'greater-equal',
    'gequal': 'greater-equal'
}
export function toGPUCompareFunction(func): GPUCompareFunction {
    return DEPTH_DICTIONARY[func] || func;
}

const TOPOLOGY_DICTIONARY = {
    // 'points': 'point-list',
    'triangles': 'triangle-list',
    'triangle strip': 'triangle-strip',
    'lines': 'line-list',
    // 'line strip': 'line-strip'
};
export function toTopology(primitive): GPUPrimitiveTopology {
    return TOPOLOGY_DICTIONARY[primitive] || 'triangle-list';
}

const BLENDFACTOR_DICTIONARY = {
    0: 'zero',
    1: 'one',
    'src color': 'src',
    'one minus src color': 'one-minus-src',
    'src alpha': 'src-alpha',
    'one minus src alpha': 'one-minus-src-alpha',
    'dst color': 'dst',
    'one minus dst color': 'one-minus-dst',
    'dst alpha': 'dst-alpha',
    'one minus dst alpha': 'one-minus-dst-alpha'
    // 其实还有一些别的值，但因为没用到，这里就不用继续翻译了
}

export function toGPUBlendFactor(blendFactor): GPUBlendFactor {
    return BLENDFACTOR_DICTIONARY[blendFactor] || blendFactor;
}

const ADDRESS_MODE_DICTIONARY = {
    'clamp': 'clamp-to-edge',
    'mirror': 'mirror-repeat'
};

export function toGPUSampler(minFilter: string, magFilter: GPUFilterMode,
    wrapS: string, wrapT: string, compare?: GPUCompareFunction) {
    const sampler: GPUSamplerDescriptor = {
        magFilter
    };
    if (minFilter === 'nearest' || minFilter === 'linear') {
        sampler.minFilter = minFilter;
    } else if (minFilter === 'linear mipmap linear' || minFilter === 'mipmap') {
        sampler.minFilter = 'linear';
        sampler.mipmapFilter = 'linear';
    } else if (minFilter === 'nearest mipmap nearest') {
        sampler.minFilter = 'linear';
        sampler.mipmapFilter = 'nearest';
    } else if (minFilter === 'nearest mipmap linear') {
        sampler.minFilter = 'nearest';
        sampler.mipmapFilter = 'linear';
    } else if (minFilter === 'linear mipmap nearest') {
        sampler.minFilter = 'linear';
        sampler.mipmapFilter = 'nearest';
    }
    sampler.addressModeU = ADDRESS_MODE_DICTIONARY[wrapS || 'clamp'] || wrapS;
    sampler.addressModeV = ADDRESS_MODE_DICTIONARY[wrapT || 'clamp'] || wrapT;
    if (compare) {
        sampler.compare = compare;
    }
    return sampler;
}

export type GPUTexFormat = { format: string, bytesPerTexel: number, isDepthStencil: boolean };

export function toTextureFormat(format: string, type: string): GPUTexFormat {
    format = format || 'rgba';
    type = type || 'uint8';

    if (format === 'depth stencil' || format === 'depth24 stencil8') {
        return { format: 'depth24plus-stencil8', bytesPerTexel: 4, isDepthStencil: true};
    } else if (format === 'depth') {
        return { format: 'depth24plus', bytesPerTexel: 4, isDepthStencil: false };
    } else if (format === 'alpha') {
        return { format: 'r8unorm', bytesPerTexel: 1, isDepthStencil: false}
    }

    if (type === 'uint8') {
        let texFormat = format;
        if (format === 'rgba') {
            texFormat = 'rgba8unorm';
        }
        return { format: texFormat, bytesPerTexel: 4, isDepthStencil: false };
    } else if (type === 'float16' || type === 'half float') {
        return { format: 'r16float', bytesPerTexel: 2, isDepthStencil: false };
    } else if (type === 'float') {
        return { format: 'r32float', bytesPerTexel: 4, isDepthStencil: false };
    }
    return { format, bytesPerTexel: 4, isDepthStencil: false };
}
