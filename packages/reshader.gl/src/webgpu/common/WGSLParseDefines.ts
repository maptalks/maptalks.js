/*!
 * codes from GEngine
 * https://github.com/GEngine-js/GEngine/blob/e9c0e2c4a28cc6b9fec133c75958b80115e53a63/src/shader/WGSLParseDefines.ts
 * ISC License
 */
import { ShaderDefines } from "../../types/typings";

const defineConstantRexg = /\s*#define\s+(\w+)\s+([^\n]+)/g;
const preprocessorSymbols = /#([^\s]*)(\s*)/gm;
const usedDefineRexg = /#[^\s]*\s*\b[0-9A-Z][0-9A-Z_&&\|=! ]+\b/g;
const isNumeric = (n) => !isNaN(n);
export function WGSLParseDefines(
    shader: string,
    meshDefines: ShaderDefines,
): string {
    if (!shader) return undefined;
    // extract define const in shader
    const matches = shader.matchAll(defineConstantRexg);
    const defineConsts = {};
    for (const match of matches) {
        defineConsts[match[1]] = match[2];
    }
    // delete define const in shader
    shader = shader.replace(/#define.*$/gm, "");
    // parse shader inner const define
    let notDefineConstShader = ParseDefinesConst(shader, defineConsts);
    // filter "&&","||",number
    const rexgDefines = notDefineConstShader
        .match(usedDefineRexg)
        ?.filter((define) => !isNumeric(define) && define != "")
        .map((define) => {
            const firstSpace = define.indexOf(" ");
            // remove #foo
            return define.substring(firstSpace).trim();
        });
    // normallize defines
    const { normalizeDefines, constValues } = getNormalizeDefines(rexgDefines, meshDefines);
    // const define defined by mesh
    notDefineConstShader = ParseDefinesConst(notDefineConstShader, constValues);
    // split Shader
    const shaderStrs = splitShaderStrsByDefine(
        notDefineConstShader,
        rexgDefines,
    );
    // parse conditional macro definition
    return shaderStrs.length > 0
        ? ParseDefines(shaderStrs, normalizeDefines)
        : notDefineConstShader;
}

class ConditionalState {
    elseIsValid = true;
    branches = [];

    constructor(initialExpression) {
        this.pushBranch("if", initialExpression);
    }

    pushBranch(token, expression) {
        if (!this.elseIsValid) {
            throw new Error(`#${token} not preceeded by an #if or #elif`);
        }
        this.elseIsValid = token === "if" || token === "elif";
        this.branches.push({
            expression: !!expression,
            string: "",
        });
    }

    appendStringToCurrentBranch(...strings) {
        for (const string of strings) {
            this.branches[this.branches.length - 1].string += string;
        }
    }

    resolve() {
        for (const branch of this.branches) {
            if (branch.expression) {
                return branch.string;
            }
        }

        return "";
    }
}

function ParseDefines(
    strings: Array<string>,
    values: Array<boolean | number>,
): string {
    const stateStack = [];
    let state = new ConditionalState(true);
    state.elseIsValid = false;
    let depth = 1;

    const assertTemplateFollows = (match, string) => {
        if (match.index + match[0].length != string.length) {
            throw new Error(
                `#${match[1]} must be immediately followed by a template expression (ie: \${value})`,
            );
        }
    };

    for (let i = 0; i < strings.length; ++i) {
        const string = strings[i];
        const matchedSymbols = string.matchAll(preprocessorSymbols);

        let lastIndex = 0;
        let valueConsumed = false;

        for (const match of matchedSymbols) {
            state.appendStringToCurrentBranch(
                string.substring(lastIndex, match.index),
            );

            switch (match[1]) {
                case "if":
                case "ifdef":
                case "ifndef":
                    assertTemplateFollows(match, string);

                    valueConsumed = true;
                    stateStack.push(state);
                    // eslint-disable-next-line no-case-declarations
                    const value = match[1] === 'ifndef' ? !values[i] : !!values[i];
                    state = new ConditionalState(value);
                    break;
                case "elif":
                    assertTemplateFollows(match, string);

                    valueConsumed = true;
                    state.pushBranch(match[1], values[i]);
                    break;
                case "else":
                    state.pushBranch(match[1], true);
                    state.appendStringToCurrentBranch(match[2]);
                    break;
                case "endif":
                    if (!stateStack.length) {
                        throw new Error(`#${match[1]} not preceeded by an #if`);
                    }

                    // eslint-disable-next-line no-case-declarations
                    const result = state.resolve();

                    state = stateStack.pop();
                    state.appendStringToCurrentBranch(result, match[2]);
                    break;
                default:
                    // Unknown preprocessor symbol. Emit it back into the output string unchanged.
                    state.appendStringToCurrentBranch(match[0]);
                    break;
            }

            lastIndex = match.index + match[0].length;
        }

        // If the string didn't end on one of the preprocessor symbols append the rest of it here.
        if (lastIndex != string.length) {
            state.appendStringToCurrentBranch(
                string.substring(lastIndex, string.length),
            );
        }

        // If the next value wasn't consumed by the preprocessor symbol, append it here.
        if (!valueConsumed && values.length > i) {
            state.appendStringToCurrentBranch(values[i]);
        }
    }

    if (stateStack.length) {
        throw new Error("Mismatched #if/#endif count");
    }

    return state.resolve();
}
function ParseDefinesConst(sourceShader: string, defines: ShaderDefines) {
    if (!defines) return sourceShader;
    let result = sourceShader;
    const keys = Object.keys(defines);
    keys?.forEach?.((key: string) => {
        const regex = new RegExp("\\b" + key + "\\b", "g");
        result = result.replace(regex, defines[key] + "");
    });
    return result;
}
function getNormalizeDefines(rexgDefines: Array<string>, defines: any) {
    const usedDefines = new Set<string>();
    const normalizeDefines = rexgDefines?.map?.((define) => {
        return getDefineConditionValue(define, defines, usedDefines);
    });
    const constValues = {};
    for (const p in defines) {
        if (!usedDefines.has(p)) {
            constValues[p] = defines[p];
        }
    }
    return { normalizeDefines, constValues };
}

export function getDefineConditionValue(define, defines, usedDefines) {
    if (define?.includes("&&") || define?.includes("||")) {
        if (define.includes("&&")) {
            const splitDefines = define
                .split("&&")
                .map((key) => key.trim());
            return getAndDefineValue(splitDefines, defines, usedDefines);
        }
        const splitDefines = define.split("||").map((key) => key.trim());
        return !getOrDefineValue(splitDefines, defines, usedDefines);
    }
    return getDefineValue(defines, define, usedDefines);
}

function getAndDefineValue(
    splitDefines: Array<string>,
    defines: ShaderDefines,
    usedDefines: Set<string>
): boolean {
    let total = 0;
    splitDefines?.forEach?.(
        (defineKey) =>
            (total +=
                Number(getDefineValue(defines, defineKey, usedDefines) || 0) > 1
                    ? 1
                    : Number(getDefineValue(defines, defineKey, usedDefines) || 0)),
    );
    return total === splitDefines.length;
}
function getDefineValue(defines, defineKey, usedDefines) {
    if (defineKey && defineKey.startsWith && defineKey.startsWith("!")) {
        defineKey = defineKey.substring(1);
        if (usedDefines) {
            usedDefines.add(defineKey);
        }
        return !defines[defineKey];
    } else if (defineKey && defineKey.includes && (defineKey.includes("==") || defineKey.includes("!="))) {
        // 解析 FOO == 1 或者 FOO != 1 形式的define
        const isEqual = defineKey.includes("==");
        const parts = defineKey.split(isEqual ? "==" : "!=").map(key => key.trim());

        if (usedDefines) {
            usedDefines.add(parts[0]);
        }
        if (isEqual) {
            return defines[parts[0]] === +parts[1];
        } else {
            return defines[parts[0]] !== +parts[1];
        }
    } else {
        if (usedDefines) {
            usedDefines.add(defineKey);
        }
        return defines[defineKey];
    }
}
function getOrDefineValue(
    splitDefines: Array<string>,
    defines: ShaderDefines,
    usedDefines: Set<string>
): boolean {
    let total = 0;
    splitDefines?.forEach?.((defineKey) => {
        const value = getDefineValue(defines, defineKey, usedDefines);
        return (total += value ? 1 : 0);
    });
    return total === 0;
}
function splitShaderStrsByDefine(
    shader: string,
    defines: Array<string>,
): Array<string> {
    let currentShaderStr = shader;
    const shaderStrs =
        defines?.map((define) => {
            const length = currentShaderStr.indexOf(define);
            const sliceStr = currentShaderStr.slice(0, length);
            currentShaderStr = currentShaderStr.slice(length + define.length);
            return sliceStr;
        }) || [];
    if (shaderStrs?.length) shaderStrs.push(currentShaderStr);
    return shaderStrs;
}
