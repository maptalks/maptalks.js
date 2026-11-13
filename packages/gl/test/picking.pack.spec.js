describe('FBORayPicking id packing (maptalks/issues#924)', () => {
    // Mirror the RGB bytes written by frag2 for pickingId + 1.
    function encodePickingId(pickingId) {
        const f = pickingId + 1;
        const b = Math.floor(f / 65536);
        const g = Math.floor((f - b * 65536) / 256);
        const r = f - b * 65536 - g * 256;
        return [r, g, b, 255];
    }

    it('decodes second-pass picking ids and empty pixels', () => {
        const ids = [0, 1, 254, 255, 256, 65534, 65535, 65536];
        const pixels = new Uint8Array(ids.concat(null).flatMap(id =>
            id === null ? [0, 0, 0, 0] : encodePickingId(id)));
        // Stub GPU operations only: exercise the production readback and decoder.
        const picking = Object.create(maptalks.reshader.FBORayPicking.prototype);
        picking._shader2 = {};
        picking._renderer = {
            device: { read: () => pixels },
            render: () => {}
        };
        picking._scene1 = { setMeshes: () => {} };
        picking._getFBO1 = () => ({});
        picking._clearFbo = () => {};

        const result = picking._getPickingId(0, 0, ids.length + 1, 1, pixels, [], {});
        expect(result).to.be.eql(ids.concat(null));
    });
});
