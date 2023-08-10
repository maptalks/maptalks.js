describe('3dtiles layer', () => {
    it('fuzhenn/maptalks-3dtiles#60', done => {
        const url = 'models/b3dm/60-guiyang/Tile_0007_0006_0003_0002.b3dm';
        const loader = new maptalks.B3DMLoader(null, gltf.GLTFLoader);
        loader.load(url).then(b3dm => {
            expect(b3dm).to.be.ok();

            const meshId = b3dm.gltf.scenes[0].nodes[0].mesh;
            const mesh = b3dm.gltf.meshes[meshId].primitives[0];

            expect(mesh.attributes.POSITION.array.buffer.byteLength).to.be.eql(471744);
            expect(mesh.attributes.POSITION.array instanceof Float32Array).to.be.ok();
            const position = mesh.attributes.POSITION;
            const count = position.count, size = position.itemSize, stride = position.byteStride, byteOffset = position.byteOffset, componentType = position.componentType;
            const out = new Float32Array(count * size);
            const interleavedArray = gltf.GLTFLoader.readInterleavedArray(out, position.array.buffer,count, size, stride, byteOffset, componentType);
            expect(interleavedArray instanceof Float32Array).to.be.ok();
            expect(interleavedArray.length).to.be.eql(117936);
            expect(interleavedArray.slice(0, 3)).to.be.eql({ '0': 316567.5625, '1': -675256.1875, '2': -2831444.75 });

            expect(mesh.attributes.TEXCOORD_0.array.buffer.byteLength).to.be.eql(314496);
            expect(mesh.attributes.TEXCOORD_0.array instanceof Float32Array).to.be.ok();

            expect(mesh.indices.array.length).to.be.eql(114363);
            expect(mesh.indices.array instanceof Uint16Array).to.be.ok();
            done();
        });
    });

    describe('b3dm v1', () => {
        it('load a sample b3dm tile', done => {
            const url = 'models/b3dm/v1_orlando/mesh_13.b3dm';
            const loader = new maptalks.B3DMLoader(null, gltf.GLTFLoader);
            loader.load(url).then(b3dm => {
                expect(b3dm).to.be.ok();
                expect(b3dm.gltf.extensions['CESIUM_RTC']).to.be.ok();
                const meshId = b3dm.gltf.scenes[0].nodes[0].children[0].mesh;
                const mesh = b3dm.gltf.meshes[meshId].primitives[0];
                expect(mesh.attributes.NORMAL.array.length).to.be.eql(16242);
                expect(mesh.attributes.NORMAL.array instanceof Int8Array).to.be.ok();
                const normal = mesh.attributes.NORMAL;
                expect(normal.array.slice(0, 3)).to.be.eql({ '0': 64, '1': -112, '2': 9 });

                expect(mesh.attributes.POSITION.array.length).to.be.eql(24363);
                expect(mesh.attributes.POSITION.array instanceof Float32Array).to.be.ok();

                const position = mesh.attributes.POSITION;
                /* eslint-disable no-loss-of-precision */
                expect(position.array.slice(0, 3)).to.be.eql({ '0': -160.81741333007812, '1': -117.21524810791016, '2': -184.55604553222656 });
                /* eslint-enable no-loss-of-precision */

                expect(mesh.attributes.TEXCOORD_0.array.length).to.be.eql(16242);
                expect(mesh.attributes.TEXCOORD_0.array instanceof Float32Array).to.be.ok();
                const texcoord = mesh.attributes.TEXCOORD_0;
                expect(texcoord.array.slice(0, 3)).to.be.eql({ '0': 0.13357797265052795, '1': 0.6996229887008667, '2': 0.0988546684384346 });

                expect(mesh.indices.array.length).to.be.eql(14997);
                expect(mesh.indices.array instanceof Uint16Array).to.be.ok();
                done();
            });
        });

        it('load a sample skyline b3dm tile', done => {
            const url = 'models/b3dm/v1_skyline/mesh_30.b3dm';
            const loader = new maptalks.B3DMLoader(null, gltf.GLTFLoader);
            loader.load(url).then(b3dm => {
                expect(b3dm).to.be.ok();
                expect(b3dm.gltf.extensions['CESIUM_RTC']).to.be.ok();
                // const mesh = b3dm.gltf.scenes[0].nodes[0].children[0].meshes[0].primitives[0];
                const meshId = b3dm.gltf.scenes[0].nodes[0].children[0].mesh;
                const mesh = b3dm.gltf.meshes[meshId].primitives[0];
                // expect(mesh.attributes.NORMAL.array.length).to.be.eql(14830);
                // expect(mesh.attributes.NORMAL.array instanceof Int8Array).to.be.ok();

                // expect(mesh.attributes.POSITION.array.length).to.be.eql(22245);
                expect(mesh.attributes.POSITION.array instanceof Float32Array).to.be.ok();
                expect(mesh.attributes.POSITION.array.slice(0, 3)).to.be.eql({ '0': -478.548095703125, '1': -218.0432891845703, '2': -104.1346664428711 });

                // expect(mesh.attributes.TEXCOORD_0.array.length).to.be.eql(14830);
                expect(mesh.attributes.TEXCOORD_0.array instanceof Float32Array).to.be.ok();
                expect(mesh.attributes.TEXCOORD_0.array.slice(0, 3)).to.be.eql({ '0': 0.38136976957321167, '1': 0.4192439913749695, '2': 0.6719885468482971 });

                // expect(mesh.indices.length).to.be.eql(14997);
                expect(mesh.indices.array instanceof Uint16Array).to.be.ok();
                const texId = b3dm.gltf.materials[mesh.material].baseColorTexture.index;
                const texture = b3dm.gltf.textures[texId];
                expect(texture).to.be.ok();
                expect(texture.image.array.length).to.be.eql(4194304);
                expect(texture.image.width).to.be.eql(1024);
                expect(texture.image.height).to.be.eql(1024);

                // expect(b3dm.transferables.length).to.be.eql(1);
                // expect(b3dm.transferables[0].byteLength === 606268).to.be.eql(1);
                done();
            });
        });

        it('load putian b3dm tile', done => {
            const url = 'models/b3dm/putian/17_36726_117244_93046.b3dm';
            const loader = new maptalks.B3DMLoader(null, gltf.GLTFLoader);
            loader.load(url).then(b3dm => {
                expect(b3dm).to.be.ok();
                expect(b3dm.gltf.extensions).not.to.be.ok();
                const meshId = b3dm.gltf.scenes[0].nodes[0].mesh;
                const mesh = b3dm.gltf.meshes[meshId].primitives[0];

                expect(mesh.attributes.POSITION.array.length).to.be.eql(1485);
                expect(mesh.attributes.POSITION.array instanceof Float32Array).to.be.ok();
                expect(mesh.attributes.POSITION.array.slice(0, 2)).to.be.eql([-136.2065887451172, -126.83392333984375]);

                expect(mesh.attributes.TEXCOORD_0.array.length).to.be.eql(990);
                expect(mesh.attributes.TEXCOORD_0.array instanceof Float32Array).to.be.ok();
                expect(mesh.attributes.TEXCOORD_0.array.slice(0, 3)).to.be.eql({ '0': 0.8642932176589966, '1': 0.9424789547920227, '2': 0.8491482138633728 });

                expect(mesh.indices.array.length).to.be.eql(1587);
                expect(mesh.indices.array instanceof Uint16Array).to.be.ok();
                done();
            });
        });

        // 小熊哥给的cesiumlab生成的tile2数据无法加载，是因为原数据是interweaved格式
        it('load 小熊哥\'s b3dm interweaved tile2', done => {
            const url = 'models/b3dm/xx_tile2/Tile_+011_+011_+000_L17_0.b3dm';
            const loader = new maptalks.B3DMLoader(null, gltf.GLTFLoader);
            loader.load(url).then(b3dm => {
                expect(b3dm).to.be.ok();
                expect(b3dm.gltf.extensions).not.to.be.ok();
                // const mesh = b3dm.gltf.scenes[0].nodes[0].meshes[0].primitives[0];
                const meshId = b3dm.gltf.scenes[0].nodes[0].mesh;
                const mesh = b3dm.gltf.meshes[meshId].primitives[0];

                expect(mesh.attributes.POSITION.array.length).to.be.eql(1530);
                expect(mesh.attributes.POSITION.array instanceof Float32Array).to.be.ok();
                const position = mesh.attributes.POSITION;
                const count = position.count, size = position.itemSize, stride = position.byteStride, byteOffset = position.byteOffset, componentType = position.componentType;
                const out = new Float32Array(count * size);
                const interleavedPosition = gltf.GLTFLoader.readInterleavedArray(out, position.array.buffer, count, size, stride, byteOffset, componentType);
                expect(interleavedPosition.length).to.be.eql(1530);
                expect(interleavedPosition instanceof Float32Array).to.be.ok();
                expect(interleavedPosition.slice(0, 3)).to.be.eql({ '0': 158.61570739746094, '1': 72.18417358398438, '2': 19.372602462768555 });

                expect(mesh.attributes.TEXCOORD_0.array.length).to.be.eql(1020);
                expect(mesh.attributes.TEXCOORD_0.array instanceof Float32Array).to.be.ok();
                const texcoord = mesh.attributes.TEXCOORD_0;
                expect(texcoord.array.slice(0, 3)).to.be.eql({ '0': 0.3029152750968933, '1': 0.4971412420272827, '2': 0.26721569895744324 });

                expect(mesh.indices.array.length).to.be.eql(1143);
                expect(mesh.indices.array instanceof Uint16Array).to.be.ok();
                done();
            });
        });
    });

    it('support EXT_texture_webp(maptalks/issues/issues/306)', done => {
        const url = 'models/b3dm/EXT_texture_webp/2_2_0_0.b3dm';
        const loader = new maptalks.B3DMLoader(null, gltf.GLTFLoader);
        loader.load(url).then(b3dm => {
            expect(b3dm).to.be.ok();
            const { gltf } = b3dm;
            expect(gltf).to.be.ok();
            const position = gltf.meshes[0].primitives[0].attributes.POSITION.array;
            expect(position.slice(0, 3)).to.be.eql({ '0': 147.86264038085938, '1': 113.31120300292969, '2': 762.8773193359375 });
            const texture = gltf.textures[0];
            expect(texture.extensions['EXT_texture_webp'].source).to.be.eql(0);
            done();
        });
    })
});
