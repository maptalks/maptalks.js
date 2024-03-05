const request = function (url, cb) {
    const image = new Image();
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const imgData = ctx.getImageData(0, 0, image.width, image.height);
        const result = { width : image.width, height : image.height, data : new Uint8Array(imgData.data) };
        cb(null, result);
    };
    image.onerror = function (err) {
        cb(err);
    };
    image.src = url;
};

function uint8ArrayEqual(a, b) {
    for (let i = 0; i < b.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
/* eslint-disable no-undef */
const decoders= {
    'image/crn': maptalksgl.transcoders.crn && maptalksgl.transcoders.crn(),
    'image/ktx2': maptalksgl.transcoders.ktx2 && maptalksgl.transcoders.ktx2(),
    'image/cttf': maptalksgl.transcoders.ktx2 && maptalksgl.transcoders.ktx2(),
    'draco': maptalksgl.transcoders.draco && maptalksgl.transcoders.draco()
}

describe('GLTF', () => {

    beforeEach(() => {
    });

    afterEach(() => {
    });

    it('status', () => {
        expect(gltf.GLTFLoader).to.be.ok();
    });

    it('load gltf', done => {
        const root = 'models/DamagedHelmet/glTF';
        gltf.Ajax.getJSON(root + '/DamagedHelmet.gltf', {}).then(json => {
            expect(json).to.be.ok();
            expect(json.asset.version).to.be.eql('2.0');
            done();
        });
    });

    describe('gltf v2', () => {
        it('load damagedhelmet nodes', done => {
            const root = 'models/DamagedHelmet/glTF';
            gltf.Ajax.getJSON(root + '/DamagedHelmet.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json, { requestImage : request });
                loader.load().then(gltf => {
                    const name = gltf.scenes[gltf.scene].name;
                    expect(name).to.be.eql('Scene');
                    const nodes = gltf.scenes[gltf.scene].nodes;

                    expect(nodes[0]).to.be.ok();
                    expect(gltf.meshes[0]).to.be.ok();
                    expect(gltf.materials.length).to.be.eql(1);
                    const textures = gltf.textures;
                    expect(textures.length).to.be.eql(5);
                    for (let i = 0; i < textures.length; i++) {
                        expect(textures[i].image.array).to.be.ok();
                    }
                    // NOTE: 以下数组的相等测试用来测试以生成的buffer.id和image.id为缓存的key的情况
                    expect(uint8ArrayEqual(textures[0].image.array.slice(0, 6), [188, 202, 205, 255, 188, 202])).to.be.ok();
                    expect(uint8ArrayEqual(textures[1].image.array.slice(0, 6), [0, 24, 0, 255, 0, 24])).to.be.ok();
                    expect(uint8ArrayEqual(textures[2].image.array.slice(0, 6), [0, 0, 0, 255, 0, 0])).to.be.ok();
                    expect(uint8ArrayEqual(textures[3].image.array.slice(0, 6), [252, 252, 252, 255, 252, 252])).to.be.ok();
                    expect(uint8ArrayEqual(textures[4].image.array.slice(0, 6), [126, 127, 253, 255, 126, 127])).to.be.ok();
                    expect(gltf.skins.length).to.be.eql(0);
                    done();
                });
            });
        });

        it('load images and buffers stroed in base64 without requestImage method', done => {
            const root = 'models/v2/BoxTextured';
            gltf.Ajax.getJSON(root + '/BoxTextured.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json);
                loader.load().then(gltf => {
                    expect(gltf.scene).to.be.eql(0);
                    const nodes = gltf.scenes[gltf.scene].nodes;

                    expect(nodes[0]).to.be.ok();
                    const textures = gltf.textures;
                    expect(textures.length).to.be.eql(1);
                    const texture = textures[0];
                    expect(texture.image.array.length).to.be.eql(262144);
                    expect(texture.image.array instanceof Uint8Array).to.be.ok();
                    expect(texture.sampler).to.be.ok();
                    done();
                });
            });
        });

        it('node has many child nodes', done => {
            const root = 'models/v2/scene';
            gltf.Ajax.getJSON(root + '/scene.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json);
                loader.load().then(gltf => {
                    expect(gltf.scene).to.be.eql(0);
                    const nodes = gltf.scenes[gltf.scene].nodes;
                    expect(nodes[0]).to.be.ok();
                    const children0 = nodes[0].children;
                    expect(children0.length).to.be.eql(1);
                    const children1 = children0[0].children;
                    expect(children1.length).to.be.eql(1);
                    const children2 = children1[0].children;
                    expect(children2.length).to.be.eql(12);
                    const children3 = children2[0];
                    expect(children3).to.be.ok();

                    let index = 0;
                    for (const node in gltf.nodes) {
                        expect(Number(gltf.nodes[node].nodeIndex)).to.be.eql(index);
                        index++;
                    }
                    done();
                });
            });
        });

        it('load image data from buffers', done => {
            const root = 'models/dbxc';
            gltf.Ajax.getJSON(root + '/dbxc.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json);
                loader.load().then(gltf => {
                    expect(gltf.scene).to.be.eql(0);
                    const nodes = gltf.scenes[gltf.scene].nodes;
                    expect(nodes[0]).to.be.ok();
                    const textures = gltf.textures;
                    expect(textures.length).to.be.eql(4);
                    expect(textures[0].image.array.length).to.be.eql(262144);
                    expect(textures[1].image.array.length).to.be.eql(262144);
                    expect(textures[2].image.array.length).to.be.eql(65536);
                    expect(textures[3].image.array.length).to.be.eql(262144);
                    done();
                });
            });
        });

        it('get texture\'s width and height', done => {
            const root = 'models/DamagedHelmet/glTF';
            gltf.Ajax.getJSON(root + '/DamagedHelmet.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json);
                loader.load().then(gltf => {
                    expect(gltf.scene).to.be.eql(0);
                    const nodes = gltf.scenes[gltf.scene].nodes;
                    expect(nodes[0]).to.be.ok();
                    const textures = gltf.textures;
                    expect(textures[0].image.width).to.be.eql(2048);
                    expect(textures[1].image.height).to.be.eql(2048);
                    done();
                });
            });
        });

        it('load v2 glb', done => {
            const root = 'models/v2/Duck';
            gltf.Ajax.getArrayBuffer(root + '/Duck.glb', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, { buffer : json.data, byteOffset : 0 }, { requestImage : request });
                loader.load().then(gltf => {
                    expect(gltf.scene).to.be.eql(0);
                    const nodes = gltf.scenes[gltf.scene].nodes;

                    expect(nodes[0]).to.be.ok();
                    expect(nodes[0].children[0].mesh).to.be.eql(0);
                    const primitive = gltf.meshes[0].primitives[0];
                    //primitive
                    expect(primitive.attributes.NORMAL.array.length).to.be.eql(7197);
                    expect(primitive.attributes.NORMAL.array instanceof Float32Array).to.be.ok();

                    expect(primitive.attributes.POSITION.array.length).to.be.eql(7197);
                    expect(primitive.attributes.POSITION.array instanceof Float32Array).to.be.ok();

                    expect(primitive.attributes.TEXCOORD_0.array.length).to.be.eql(4798);
                    expect(primitive.attributes.TEXCOORD_0.array instanceof Float32Array).to.be.ok();

                    expect(primitive.indices.array.length).to.be.eql(12636);
                    expect(primitive.indices.array instanceof Uint16Array).to.be.ok();
                    const textures = gltf.textures;
                    const materials = gltf.materials;
                    //materialasset
                    const index = primitive.material;
                    const baseColorTexture = materials[index].pbrMetallicRoughness.baseColorTexture.index;
                    expect(textures[baseColorTexture].image.array.length).to.be.eql(1048576);
                    expect(textures[baseColorTexture].image.mimeType).to.be.eql('image/png');
                    done();
                });
            });
        });

        it('load animations', done => {
            const root = 'models/dancing/glTF';
            gltf.Ajax.getJSON(root + '/SambaDancing.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json);
                loader.load().then(gltf => {
                    const animations = gltf.animations;
                    expect(animations.length).to.be.eql(1);
                    const aniamtion = animations[0];
                    const samplers = aniamtion.samplers;
                    const channels = aniamtion.channels;
                    expect(samplers.length).to.be.eql(53);
                    expect(channels.length).to.be.eql(53);
                    for (let i = 0; i < samplers.length; i++) {
                        expect(samplers[i].input.array instanceof Float32Array).to.be.ok();
                        expect(samplers[i].output.array instanceof Float32Array).to.be.ok();
                    }
                    expect(samplers[0].input.array.length).to.be.eql(365);
                    expect(samplers[0].output.array.length).to.be.eql(1460);
                    done();
                });
            });
        });

        it('get timespan when gltf has animations', done => {
            const root = 'models/cubicspline';
            gltf.Ajax.getJSON(root + '/cubicspline.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json);
                loader.load().then(data => {
                    const animTimeSpan = gltf.GLTFLoader.getAnimationTimeSpan(data);
                    expect(animTimeSpan.max).to.be.eql(2.5);
                    expect(animTimeSpan.min).to.be.eql(0.0);
                    done();
                });
            });
        });

        it('load gltf model with skinning', done => {
            const root = 'models/dancing/glTF';
            gltf.Ajax.getJSON(root + '/SambaDancing.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json);
                loader.load().then(gltf => {
                    const skins = gltf.skins;
                    const skin0 = skins[0];
                    const skin1 = skins[1];
                    expect(skin0.joints.length).to.be.eql(52);
                    expect(skin1.joints.length).to.be.eql(52);
                    done();
                });
            });
        });

        it('get external resources', (done) => {
            const root = 'models/DamagedHelmet/glTF';
            gltf.Ajax.getJSON(root + '/DamagedHelmet.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json);
                const resources = loader.getExternalResources();
                expect(resources.length).to.be.eql(6);
                expect(resources[0].type).to.be.eql('buffer');
                expect(resources[0].uri).to.be.eql('DamagedHelmet.bin');
                expect(resources[1].type).to.be.eql('image');
                expect(resources[1].uri).to.be.eql('Default_albedo.jpg');
                done();
            });
        });

        it('create channels map', done => {
            const root = 'models/dancing/glTF';
            gltf.Ajax.getJSON(root + '/SambaDancing.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json);
                loader.load().then(gltf => {
                    const node = 0;
                    expect(gltf.animations[0].channelsMap[node]).to.be.ok();
                    expect(gltf.animations[0].channelsMap[node].length).to.be.eql(2);
                    expect(Object.keys(gltf.animations[0].channelsMap).length).to.be.eql(52);
                    done();
                });
            });
        });

        it('get all resources in .bin', (done) => {
            const root = 'models/商业1-17263520294539783362';
            gltf.Ajax.getJSON(root + '/商业1.gltf', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, json);
                loader.load().then(gltf => {
                    expect(gltf.scene).to.be.eql(0);
                    const nodes = gltf.scenes[gltf.scene].nodes;
                    expect(nodes[0]).to.be.ok();
                    const children0 = nodes[0].children;
                    expect(children0.length).to.be.eql(1);
                    const children1 = children0[0].children;
                    expect(children1.length).to.be.eql(1);
                    const children2 = children1[0].children;
                    expect(children2.length).to.be.eql(1);
                    const children3 = children2[0];
                    expect(children3).to.be.ok();

                    let index = 0;
                    for (const node in gltf.nodes) {
                        expect(Number(gltf.nodes[node].nodeIndex)).to.be.eql(index);
                        index++;
                    }
                    done();
                });
            });
        });

        it('fix the source image could not be decode', (done) => {
            const root = 'models/rw';
            gltf.Ajax.getArrayBuffer(root + '/RW_nanren_1_1663921653346.glb', {}).then(json => {
                const loader = new gltf.GLTFLoader(root, { buffer : json.data, byteOffset : 0 }, { requestImage : request });
                loader.load().then(gltf => {
                    expect(gltf.scene).to.be.eql(0);
                    const textures = gltf.textures;
                    expect(textures.length).to.be.eql(1);
                    const materials = gltf.materials;
                    expect(materials.length).to.be.eql(1);
                    expect(textures[0].image.array.length).to.be.eql(4194304);
                    done();
                });
            });
        });
    });
});
describe('gltf v1', () => {

    it('load box glb', done => {
        const root = 'models/v1/Box';
        gltf.Ajax.getArrayBuffer(root + '/Box.glb', {}).then(response => {
            const loader = new gltf.GLTFLoader(root, { buffer : response.data, byteOffset : 0 });
            loader.load()
                .then(json => {
                    expect(json.scene).to.be.eql(0);

                    const nodes = json.scenes[json.scene].nodes;

                    expect(nodes[0]).to.be.ok();
                    expect(nodes[0].children.length).to.be.eql(1);

                    const meshId = nodes[0].children[0].mesh;
                    const mesh = json.meshes[meshId];
                    const primitive = mesh.primitives[0];
                    //primitive
                    expect(primitive.attributes.NORMAL.array.length).to.be.eql(72);
                    expect(primitive.attributes.NORMAL.array instanceof Float32Array).to.be.ok();

                    const normal = primitive.attributes.NORMAL;
                    expect(normal.array.slice(0, 3)).to.be.eql({ '0': 0, '1': 0, '2': 1 });

                    expect(primitive.attributes.POSITION.array.length).to.be.eql(72);
                    expect(primitive.attributes.POSITION.array instanceof Float32Array).to.be.ok();
                    const position = primitive.attributes.POSITION;
                    expect(position.array.slice(0, 3)).to.be.eql({ '0': -0.5, '1': -0.5, '2': 0.5 });

                    expect(primitive.indices.array.length).to.be.eql(36);
                    expect(primitive.indices.array instanceof Uint16Array).to.be.ok();
                    done();
                });
        });
    });
});

describe('get animation clip', () => {
    it('get TRS matrix', done => {
        const root = 'models/cubicspline';
        gltf.Ajax.getJSON(root + '/cubicspline.gltf', {}).then(json => {
            const loader = new gltf.GLTFLoader(root, json);
            loader.load().then(data => {
                const  time = 0.5;
                const animation = gltf.GLTFLoader.getAnimationClip(data, 0, time);
                //const correctMat = mat4.fromValues(1.0290393123321313, 0, -0, 0, 0, 1.0290393123321313, 0, 0, 0, -0, 1.0290393123321313, 0, 0, 0, 0, 1);
                expect(animation.translation).to.be.eql([0, 0, 0]);
                expect(animation.rotation).to.be.eql([0, 0, 0, 1]);
                expect(animation.scale).to.be.eql([1.0290393123321313, 1.0290393123321313, 1.0290393123321313]);
                done();
            });
        });
    });

    it('get weights for morph targets', done => {
        const root = 'models/v2/simpleMorph';
        gltf.Ajax.getJSON(root + '/simpleMorph.gltf', {}).then(json => {
            const loader = new gltf.GLTFLoader(root, json);
            loader.load().then(data => {
                gltf.GLTFLoader.getAnimationClip(data, 0, 0.5);
                expect(data.nodes[0].weights).to.be.eql([0, 0.5]);
                gltf.GLTFLoader.getAnimationClip(data, 0, 1.0);
                expect(data.nodes[0].weights).to.be.eql([0, 1]);
                gltf.GLTFLoader.getAnimationClip(data, 0, 1.5);
                expect(data.nodes[0].weights).to.be.eql([0.5, 1]);
                gltf.GLTFLoader.getAnimationClip(data, 0, 2.0);
                expect(data.nodes[0].weights).to.be.eql([1, 1]);
                done();
            });
        });
    });

    it('more than 8 morph targets', done => {
        const root = 'models/v2/simple_flower_loop';
        gltf.Ajax.getJSON(root + '/scene.gltf', {}).then(json => {
            const loader = new gltf.GLTFLoader(root, json);
            loader.load().then(data => {
                expect(data.nodes[6].weights).to.be.eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                expect(data.meshes[0].primitives[0].morphTargets['POSITION_35']).to.be.ok();
                const animation = gltf.GLTFLoader.getAnimationClip(data, 6, 0.8);
                const weights = animation.weights;
                expect(weights).to.be.eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7999999046327038, 0.19999961853013806, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                done();
            });
        });
    });

    it('asset', done => {
        const root = 'models/dancing/glTF';
        gltf.Ajax.getJSON(root + '/SambaDancing.gltf', {}).then(json => {
            const loader = new gltf.GLTFLoader(root, json);
            loader.load().then(gltf => {
                expect(gltf.asset).to.be.ok();
                done();
            });
        });
    });

    it('more than one animations', done => {
        const root = 'models/v2/Fox';
        gltf.Ajax.getJSON(root + '/Fox.gltf', {}).then(json => {
            const loader = new gltf.GLTFLoader(root, json);
            loader.load().then(data => {
                const timeSpan1 = gltf.GLTFLoader.getAnimationTimeSpan(data);
                const timeSpan2 = gltf.GLTFLoader.getAnimationTimeSpan(data, 'Survey');
                const timeSpan3 = gltf.GLTFLoader.getAnimationTimeSpan(data, 'Walk');
                const timeSpan4 = gltf.GLTFLoader.getAnimationTimeSpan(data, 'Run');
                expect(timeSpan1).to.be.eql({ max: 3.4166667461395264, min: 0 });
                expect(timeSpan2).to.be.eql({ max: 3.4166667461395264, min: 0 });
                expect(timeSpan3).to.be.eql({ max: 0.7083333134651184, min: 0 });
                expect(timeSpan4).to.be.eql({ max: 1.1583333015441895, min: 0 });
                done();
            });
        });
    });

    it('a large number of meshes', done => {
        const root = 'models/258-Third';
        gltf.Ajax.getArrayBuffer(root + '/258-Third.glb', {}).then(response => {
            const loader = new gltf.GLTFLoader(root, { buffer : response.data, byteOffset : 0 }, { decoders, transferable: true });
            loader.load({
                skipAttributeTransform: true
            })
                .then(json => {
                    expect(json).to.be.ok();
                    expect(Object.keys(json.meshes).length).to.be.eql(1755);
                    expect(Object.keys(json.nodes).length).to.be.eql(1887);
                    done();
                });
        });
    })
});

describe('gltf extensions', () => {
    it('KHR_materials_pbrSpecularGlossiness', (done) => {
        const root = 'models/v2/KHR/';
        gltf.Ajax.getArrayBuffer(root + '/scene.glb', {}).then(json => {
            const loader = new gltf.GLTFLoader(root, { buffer : json.data, byteOffset : 0 });
            loader.load().then(gltfData => {
                const meshes = gltfData.meshes;
                const materials = gltfData.materials;
                const textures = gltfData.textures;
                const pbrSpecularGlossiness = materials[meshes[0].primitives[0].material].extensions['KHR_materials_pbrSpecularGlossiness'];
                expect(pbrSpecularGlossiness).to.be.ok();
                const diffuseTexture = pbrSpecularGlossiness.diffuseTexture;
                expect(textures[diffuseTexture.index].image.array.length).to.be.eql(4194304);
                expect(pbrSpecularGlossiness.glossinessFactor).to.be.eql(0);
                expect(pbrSpecularGlossiness.specularFactor).to.be.eql([0, 0, 0]);
                done();
            });
        });
    });
});

describe('interleaved', () => {
    it('interleaved data structrue model', done => {
        const root = 'models/interleaved/SimpleTexture';
        gltf.Ajax.getJSON(root + '/SimpleTexture.gltf', {}).then(json => {
            const loader = new gltf.GLTFLoader(root, json);
            loader.load().then(gltf => {
                const mesh = gltf.meshes[0];
                const primitive = mesh.primitives[0];
                expect(primitive.attributes['POSITION'].array.length).to.be.eql(12);
                expect(primitive.attributes['POSITION'].byteLength).to.be.eql(48);
                expect(primitive.attributes['POSITION'].byteStride).to.be.eql(0);
                expect(primitive.attributes['POSITION'].itemSize).to.be.eql(3);
                expect(primitive.attributes['POSITION'].byteOffset).to.be.eql(0);
                expect(primitive.attributes['POSITION'].componentType).to.be.eql(5126);

                expect(primitive.attributes['TEXCOORD_0'].array.length).to.be.eql(8);
                expect(primitive.attributes['TEXCOORD_0'].byteLength).to.be.eql(32);
                expect(primitive.attributes['TEXCOORD_0'].byteStride).to.be.eql(0);
                expect(primitive.attributes['TEXCOORD_0'].itemSize).to.be.eql(2);
                expect(primitive.attributes['TEXCOORD_0'].byteOffset).to.be.eql(0);
                expect(primitive.attributes['POSITION'].componentType).to.be.eql(5126);
                expect(primitive.indices.array.length).to.be.eql(6);
                done();
            });
        });
    });

    it('readInterleavedArray', done => {
        const root = 'models/interleaved/SimpleTexture';
        gltf.Ajax.getJSON(root + '/SimpleTexture.gltf', {}).then(json => {
            const loader = new gltf.GLTFLoader(root, json);
            loader.load().then(json => {
                const mesh = json.meshes[0];
                const primitive = mesh.primitives[0];
                expect(primitive.attributes['POSITION'].array.length).to.be.eql(12);
                expect(primitive.attributes['POSITION'].array.slice(3, 6)).to.eql({'0': 1, '1': 0, '2': 0});
                done();
            });
        });
    })
});

describe('draco', () => {
    it('draco model', done => {
        const root = 'models/draco';
        gltf.Ajax.getJSON(root + '/draco.gltf', {}).then(json => {
            const loader = new gltf.GLTFLoader(root, json, { decoders, transferable: true });
            loader.load().then(json => {
                expect(json.meshes[0]).to.be.ok();
                expect(json.nodes[0]).to.be.ok();
                const mesh = json.meshes[0];
                const primitive = mesh.primitives[0];
                expect(primitive.attributes['POSITION'].array.length).to.be.eql(43668);
                expect(primitive.attributes['POSITION'].array.slice(0, 3)).to.eql({0: -0.6119945645332336, 1: -0.03094087541103363, 2: 0.48309004306793213});
                done();
            });
        });
    });
});
