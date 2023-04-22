/*!
 * decode-bmp
 * https://github.com/LinusU/decode-bmp
 * MIT License
 */

function makeDivisibleByFour (input) {
    const rest = input % 4

    return rest ? input + 4 - rest : input
}

class Bitmap {
    constructor (data, offset, { width, height, colorDepth, format }) {
        this.format = format
        this.offset = offset
        this.depth = colorDepth
        this.stride = makeDivisibleByFour(width * this.depth / 8)
        this.size = (this.stride * height)
        this.data = data.subarray(this.offset, this.offset + this.size)

        if (this.size !== this.data.byteLength) {
            throw new Error('Truncated bitmap data')
        }
    }

    get (x, y, channel) {
        const idx = this.format.indexOf(channel)

        if (this.depth === 1) {
            const slice = this.data[(y * this.stride) + (x / 8 | 0)]
            const mask = 1 << (7 - (x % 8) * 1)

            return (slice & mask) >> (7 - (x % 8) * 1)
        }

        if (this.depth === 2) {
            const slice = this.data[(y * this.stride) + (x / 4 | 0)]
            const mask = 3 << (6 - (x % 4) * 2)

            return (slice & mask) >>> (6 - (x % 4) * 2)
        }

        if (this.depth === 4) {
            const slice = this.data[(y * this.stride) + (x / 2 | 0)]
            const mask = 15 << (4 - (x % 2) * 4)

            return (slice & mask) >>> (4 - (x % 2) * 4)
        }

        return this.data[(y * this.stride) + (x * (this.depth / 8)) + idx]
    }
}

function decodeTrueColorBmp (out, isRGBA, data, { width, height, colorDepth, icon }) {
    if (colorDepth !== 32 && colorDepth !== 24) {
        throw new Error(`A color depth of ${colorDepth} is not supported`)
    }

    const xor = new Bitmap(data, 0, { width, height, colorDepth, format: 'BGRA' })
    const and = (colorDepth === 24 && icon)
        ? new Bitmap(data, xor.offset + xor.size, { width, height, colorDepth: 1, format: 'A' })
        : null

    const result = out

    let idx = 0
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            result[idx++] = xor.get(x, height - y - 1, 'R')
            result[idx++] = xor.get(x, height - y - 1, 'G')
            result[idx++] = xor.get(x, height - y - 1, 'B')

            if (!isRGBA) {
                continue;
            }
            if (colorDepth === 32) {
                result[idx++] = xor.get(x, height - y - 1, 'A')
            } else {
                result[idx++] = and && and.get(x, height - y - 1, 'A') ? 0 : 255
            }
        }
    }

    return result
}

function decodePaletteBmp (out, isRGBA, data, { width, height, colorDepth, colorCount, icon }) {
    if (colorDepth !== 8 && colorDepth !== 4 && colorDepth !== 2 && colorDepth !== 1) {
        throw new Error(`A color depth of ${colorDepth} is not supported`)
    }

    const colors = new Bitmap(data, 0, { width: colorCount, height: 1, colorDepth: 32, format: 'BGRA' })
    const xor = new Bitmap(data, colors.offset + colors.size, { width, height, colorDepth, format: 'C' })
    const and = icon ? new Bitmap(data, xor.offset + xor.size, { width, height, colorDepth: 1, format: 'A' }) : null

    const result = out

    let idx = 0
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const colorIndex = xor.get(x, height - y - 1, 'C')

            result[idx++] = colors.get(colorIndex, 0, 'R')
            result[idx++] = colors.get(colorIndex, 0, 'G')
            result[idx++] = colors.get(colorIndex, 0, 'B')
            if (isRGBA) {
                result[idx++] = and && and.get(x, height - y - 1, 'A') ? 0 : 255
            }
        }
    }

    return result
}

function checkMagicBytes (bytes) {
    if (bytes !== 0x4D42) throw new Error(`Invalid magic byte 0x${bytes.toString(16)}`)
}

export default function decodeBmp (out, source, bytesOffset, byteLength, { width: iconWidth = 0, height: iconHeight = 0, icon = false } = {}) {
    const data = new DataView(source, bytesOffset, byteLength)

    let headerSize
    let bitmapWidth
    let bitmapHeight
    let colorDepth
    let colorCount

    if (icon) {
        headerSize = data.getUint32(0, true)
        bitmapWidth = (data.getUint32(4, true) / 1) | 0
        bitmapHeight = (data.getUint32(8, true) / 2) | 0
        colorDepth = data.getUint16(14, true)
        colorCount = data.getUint32(32, true)
    } else {
        checkMagicBytes(data.getUint16(0, true))
        headerSize = 14 + data.getUint32(14, true)
        bitmapWidth = data.getUint32(18, true)
        bitmapHeight = data.getUint32(22, true)
        colorDepth = data.getUint16(28, true)
        colorCount = data.getUint32(46, true)
    }

    if (colorCount === 0 && colorDepth <= 8) {
        colorCount = (1 << colorDepth)
    }

    const width = (bitmapWidth === 0 ? iconWidth : bitmapWidth)
    const height = (bitmapHeight === 0 ? iconHeight : bitmapHeight)

    const bitmapData = new Uint8Array(data.buffer, data.byteOffset + headerSize, data.byteLength - headerSize)
    const isRGBA = out.byteLength === width * height * 4;

    const result = colorCount
        ? decodePaletteBmp(out, isRGBA, bitmapData, { width, height, colorDepth, colorCount, icon })
        : decodeTrueColorBmp(out, isRGBA, bitmapData, { width, height, colorDepth, icon })

    return result;
}
