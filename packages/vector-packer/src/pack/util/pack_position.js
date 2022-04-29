export function packPosition(out, x, y, altitude) {
    const high = Math.abs(altitude) >> 15;
    const highx = high >> 1;
    const highy = high % 2;
    const modValue = Math.pow(2, 15);
    const low = altitude % modValue;
    const posx = x + (highx << 14) * Math.sign(x);
    const posy = y + (highy << 14) * Math.sign(y);

    out[0] = posx;
    out[1] = posy;
    out[2] = low;
    return out;
}

export function unpackPosition(x, y, z) {
    const modValue = Math.pow(2.0, 14.0);

    const posx = x % modValue;
    const posy = y % modValue;

    const highx = Math.floor(Math.abs(x) / modValue);
    const highy = Math.floor(Math.abs(y) / modValue);

    return [posx, posy, Math.sign(z) * (highx * 2 + highy) * Math.pow(2.0, 15.0) + z];
}
