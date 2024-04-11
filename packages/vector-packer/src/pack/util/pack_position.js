export function packPosition(out, x, y, altitude) {
    const high = Math.abs(altitude) >> 15;
    const highx = high >> 1;
    const highy = high % 2;
    const modValue = Math.pow(2, 15);
    let low = altitude % modValue;
    const posx = x + (highx << 14) * Math.sign(x);
    const posy = y + (highy << 14) * Math.sign(y);

    out[0] = posx;
    out[1] = posy;
    low = Math.round(low);
    out[2] = low === 0 ? (altitude < 0 ? -1 : 0) : low;
    return out;
}


const modValue = Math.pow(2.0, 14.0);
const modValue1 = Math.pow(2.0, 15.0);

export function unpackPosition(out, x, y, z) {
    const posx = (Math.sign(x) || 1) * (Math.abs(x) % modValue);
    const posy = (Math.sign(y) || 1) * (Math.abs(y) % modValue);

    const highx = Math.floor(Math.abs(x) / modValue);
    const highy = Math.floor(Math.abs(y) / modValue);

    out[0] = posx;
    out[1] = posy;
    out[2] = Math.sign(z + 0.00001) * (highx * 2 + highy) * modValue1 + z;
    return out;
}
