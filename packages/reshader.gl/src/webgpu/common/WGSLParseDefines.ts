/*!
 * codes from GEngine
 * https://github.com/GEngine-js/GEngine/blob/e9c0e2c4a28cc6b9fec133c75958b80115e53a63/src/shader/WGSLParseDefines.ts
 * ISC License
 */
import { extend } from "../../common/Util";
import { ShaderDefines } from "../../types/typings";

const defineConstantRexg = /\s*#define\s+(\w+)\s+(\w+)/g;
const preprocessorSymbols = /#([^\s]*)(\s*)/gm;
const defineRexg = /\b[0-9A-Z_&&||]+\b/g;
const isNumeric = (n) => !isNaN(n);
export function WGSLParseDefines(shader: string, meshDefines: ShaderDefines): string {
	if (!shader) return undefined;
    // extract define const in shader
    const matches = shader.matchAll(defineConstantRexg);
    const defines = extend({}, meshDefines);
    for (const match of matches) {
        defines[match[1]] = match[2];
    }
    // delete define const in shader
    shader = shader.replace(/^\s+#define.*$/gm, '');
	// parse shader inner const define
	const notDefineConstShader = ParseDefinesConst(shader, defines);
	// filter "&&","||",number
	const rexgDefines = notDefineConstShader
		.match(defineRexg)
		?.filter((define) => !["&&", "||", "_"].includes(define) && !isNumeric(define) && define != "");
	// normallize defines
	const normalizeDefines = getNormalizeDefines(rexgDefines, defines);
	// split Shader
	const shaderStrs = splitShaderStrsByDefine(notDefineConstShader, rexgDefines);
	// parse conditional macro definition
	return shaderStrs.length > 0 ? ParseDefines(shaderStrs, normalizeDefines) : notDefineConstShader;
}
function ParseDefines(strings: Array<string>, values: Array<boolean | number>): string {
	const stateStack = [];
	let state = { frag: "", elseIsValid: false, expression: true };
	let depth = 1;
	for (let i = 0; i < strings.length; ++i) {
		const frag = strings[i];
		const matchedSymbols = frag.matchAll(preprocessorSymbols);

		let lastIndex = 0;
		let valueConsumed = false;
		for (const match of matchedSymbols) {
			state.frag += frag.substring(lastIndex, match.index);

			switch (match[1]) {
				case "if":
                case "ifdef":
					if (match.index + match[0].length != frag.length) {
						throw new Error("#if must be immediately followed by a template expression (ie: ${value})");
					}
					valueConsumed = true;
					stateStack.push(state);
					depth++;
					state = { frag: "", elseIsValid: true, expression: !!values[i] };
					break;
				case "elif":
					if (match.index + match[0].length != frag.length) {
						throw new Error("#elif must be immediately followed by a template expression (ie: ${value})");
					} else if (!state.elseIsValid) {
						throw new Error("#elif not preceeded by an #if or #elif");
					}
					valueConsumed = true;
					if (state.expression && stateStack.length != depth) {
						stateStack.push(state);
					}
					state = { frag: "", elseIsValid: true, expression: !!values[i] };
					break;
				case "else":
					if (!state.elseIsValid) {
						throw new Error("#else not preceeded by an #if or #elif");
					}
					if (state.expression && stateStack.length != depth) {
						stateStack.push(state);
					}
					state = { frag: match[2], elseIsValid: false, expression: true };
					break;
				case "endif":
					if (!stateStack.length) {
						throw new Error("#endif not preceeded by an #if");
					}
					// eslint-disable-next-line no-case-declarations
					const branchState = stateStack.length == depth ? stateStack.pop() : state;
					state = stateStack.pop();
					depth--;
					if (branchState.expression) {
						state.frag += branchState.frag;
					}
					state.frag += match[2];
					break;
				default:
					// Unknown preprocessor symbol. Emit it back into the output frag unchanged.
					state.frag += match[0];
					break;
			}

			lastIndex = match.index + match[0].length;
		}

		// If the frag didn't end on one of the preprocessor symbols append the rest of it here.
		if (lastIndex != frag.length) {
			state.frag += frag.substring(lastIndex, frag.length);
		}

		// If the next value wasn't consumed by the preprocessor symbol, append it here.
		if (!valueConsumed && values.length > i) {
			state.frag += values[i];
		}
	}
	if (stateStack.length) {
		throw new Error("Mismatched #if/#endif count");
	}
	return state.frag;
}
function ParseDefinesConst(sourceShader: string, defines: ShaderDefines) {
	if (!defines) return sourceShader;
	let result = sourceShader;
	const constDefineKeys = Object.keys(defines)?.filter?.((key) => key != key.toUpperCase());
	constDefineKeys?.forEach?.((key: string) => {
		result = result.replaceAll(key, defines[key] + '');
	});
	return result;
}
function getNormalizeDefines(rexgDefines: Array<string>, defines: any) {
	return rexgDefines?.map?.((define) => {
		if (define?.includes("&&") || define?.includes("||")) {
			if (define.includes("&&")) {
				const splitDefines = define.split("&&");
				return getAndDefineValue(splitDefines, defines);
			}
			const splitDefines = define.split("||");
			return !getOrDefineValue(splitDefines, defines);
		}
		return defines[define];
	});
}
function getAndDefineValue(splitDefines: Array<string>, defines: ShaderDefines): boolean {
	let total = 0;
	splitDefines?.forEach?.((defineKey) => (total += Number(defines[defineKey]) > 1 ? 1 : Number(defines[defineKey])));
	return total === splitDefines.length;
}
function getOrDefineValue(splitDefines: Array<string>, defines: ShaderDefines): boolean {
	let total = 0;
	splitDefines?.forEach?.((defineKey) => (total += Number(defines[defineKey]) > 1 ? 1 : Number(defines[defineKey])));
	return total === 0;
}
function splitShaderStrsByDefine(shader: string, defines: Array<string>): Array<string> {
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
