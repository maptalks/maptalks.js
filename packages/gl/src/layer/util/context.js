import { extend } from './util';

export function fillIncludes(defines, uniformDeclares, context) {
    const includes = context && context.includes;
    if (includes) {
        for (const p in includes) {
            if (includes[p]) {
                if (context[p].uniformDeclares) {
                    uniformDeclares.push(...context[p].uniformDeclares);
                }
                if (context[p].defines) {
                    extend(defines, context[p].defines);
                }
            }
        }
    }
}

export function setIncludeUniformValues(uniforms, context) {
    const includes = context && context.includes;
    if (includes) {
        for (const p in includes) {
            if (includes[p]) {
                if (context[p].renderUniforms) {
                    extend(uniforms, context[p].renderUniforms);
                }
            }
        }
    }
}
