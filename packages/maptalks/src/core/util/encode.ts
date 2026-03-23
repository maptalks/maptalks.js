
const encoder = new TextEncoder();
const decoder = new TextDecoder();
export function encodeJSON(json: any) {
    try {
        const str = JSON.stringify(json);
        return encoder.encode(str);
    } catch (error) {
        console.error('encode JSON to Uint8Array error:', error);
    }
}

export function decodeJSON(uint8Array: Uint8Array) {
    try {
        const str = decoder.decode(uint8Array);
        return JSON.parse(str);
    } catch (error) {
        console.error('decode Uint8Array to JSON error:', error);
    }
}
