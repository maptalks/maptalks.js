import { vec3, mat4, quat, reshader } from '@maptalks/gl';
import PhongPainter from './PhongPainter';

const pickingVert = `
    attribute vec3 POSITION;
    uniform mat4 projViewMatrix;
    uniform mat4 modelMatrix;
    //引入fbo picking的vert相关函数
    #include <fbo_picking_vert>
    #include <get_output>
    void main()
    {
        frameUniforms.modelMatrix = getModelMatrix();
        gl_Position = projViewMatrix * frameUniforms.modelMatrix * getPosition(POSITION);
        //传入gl_Position的depth值
        fbo_picking_setData(gl_Position.w, true);
    }`;

class GLTFPhongPainter extends PhongPainter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);
        this._ready = false;
    }

    createGeometry(glData, features) {
        if (!glData || !this._ready) {
            return null;
        }
        const { data, positionSize } = glData;
        return {
            data,
            positionSize,
            features
        };
    }

    createMesh(geometry, transform, { tileTranslationMatrix, tileExtent }) {
        const { positionSize } = geometry;
        const { aPosition } = geometry.data;
        const count = aPosition.length / positionSize;
        if (count === 0) {
            return null;
        }
        const instanceData = {
            'instance_vectorA': new Float32Array(count * 4),
            'instance_vectorB': new Float32Array(count * 4),
            'instance_vectorC': new Float32Array(count * 4),
            'instance_vectorD': new Float32Array(count * 4),
            // 'instance_color': [],
            'aPickingId': []
        };
        this._updateInstanceData(instanceData, tileTranslationMatrix, tileExtent, aPosition, positionSize);
        const instanceBuffers = {};
        //所有mesh共享一个instance buffer，以节省内存
        for (const p in instanceData) {
            instanceBuffers[p] = {
                buffer: this.regl.buffer(instanceData[p]),
                divisor: 1
            };
        }

        const meshInfos = this._gltfMeshInfos;
        const meshes = meshInfos.map(info => {
            const { geometry, materialInfo } = info;
            const material = new reshader.PhongMaterial(materialInfo);
            const mesh = new reshader.InstancedMesh(instanceBuffers, count, geometry, material, {
                transparent: false,
                castShadow: false,
                picking: true
            });

            //创建普通的mesh用于测试
            // const mesh = new reshader.Mesh(geometry, material);
            // mesh.setLocalTransform(mat);

            geometry.generateBuffers(this.regl);
            //上面已经生成了buffer，无需再生成
            // mesh.generateInstancedBuffers(this.regl);
            if (instanceData['instance_color']) {
                mesh.getDefines()['HAS_INSTANCE_COLOR'] = 1;
            }
            return mesh;
        });
        meshes.insContext = {
            instanceData,
            tileTranslationMatrix,
            tileExtent,
            aPosition,
            positionSize
        };

        return meshes;
    }

    _updateInstanceData(instanceData, tileTranslationMatrix, tileExtent, aPosition, positionSize) {
        function setInstanceData(name, idx, start, stride, matrix) {
            instanceData[name][idx * 4] = matrix[start * stride];
            instanceData[name][idx * 4 + 1] = matrix[start * stride + 1];
            instanceData[name][idx * 4 + 2] = matrix[start * stride + 2];
            instanceData[name][idx * 4 + 3] = matrix[start * stride + 3];
        }

        const { translation, rotation, scale } = this.getSymbol();
        const gltfMatrix = this._getGLTFMatrix([], translation, rotation, scale);

        const count = aPosition.length / positionSize;
        const tileSize = this.layer.getTileSize();
        const tileScale = tileSize.width / tileExtent * this.layer.getMap().getGLScale();
        const position = [];
        const mat = [];
        for (let i = 0; i < count; i++) {
            const pos = vec3.set(
                position,
                aPosition[i * positionSize] * tileScale,
                aPosition[i * positionSize + 1] * tileScale,
                positionSize === 2 ? 0 : aPosition[i * positionSize + 2]
            );
            mat4.copy(mat, tileTranslationMatrix);
            mat[12] += pos[0];
            mat[13] += pos[1];
            mat4.multiply(mat, mat, gltfMatrix);
            setInstanceData('instance_vectorA', i, 0, 4, mat);
            setInstanceData('instance_vectorB', i, 1, 4, mat);
            setInstanceData('instance_vectorC', i, 2, 4, mat);
            setInstanceData('instance_vectorD', i, 3, 4, mat);
            instanceData['aPickingId'][i] = i;
        }
    }

    getShaderConfig() {
        const config = super.getShaderConfig();
        config.positionAttribute = 'POSITION';
        config.normalAttribute = 'NORMAL';
        config.extraCommandProps['frontFace'] = 'cw';
        return config;
    }

    addMesh(mesh, progress) {
        // if (progress !== null) {
        //     const mat = mesh.localTransform;
        //     if (progress === 0) {
        //         progress = 0.01;
        //     }
        //     SCALE[2] = progress;
        //     mat4.fromScaling(mat, SCALE);
        //     mat4.multiply(mat, mesh.properties.tileTransform, mat);
        //     mesh.setLocalTransform(mat);
        // } else {
        //     mesh.setLocalTransform(mesh.properties.tileTransform);
        // }

        this.scene.addMesh(mesh);
        return this;
    }

    init(context) {
        super.init(context);
        const url = this.getSymbol().url;
        reshader.GLTFHelper.load(url).then(gltfData => {
            const pack = reshader.GLTFHelper.exportGLTFPack(gltfData, this.regl);
            this._gltfMeshInfos = pack.getMeshesInfo();
            this._ready = true;
            this.setToRedraw();
        });
    }

    getPickingVert() {
        return pickingVert;
    }

    deleteMesh(meshes) {
        if (!meshes) {
            return;
        }
        this.scene.removeMesh(meshes);
        //geometry应该一直保留，在painter.delete中才删除
        for (let i = 0; i < meshes.length; i++) {
            meshes[i].disposeInstanceData();
            meshes[i].dispose();
        }
    }

    delete(/* context */) {
        super.delete();
        if (this._gltfMeshInfos) {
            this._gltfMeshInfos.forEach(info => {
                const { geometry, materialInfo } = info;
                if (geometry) {
                    geometry.dispose();
                }
                if (materialInfo) {
                    for (const p in materialInfo) {
                        if (materialInfo[p] && materialInfo[p].destroy) {
                            materialInfo[p].destroy();
                        }
                    }
                }
            });
        }
    }
}

GLTFPhongPainter.prototype._getGLTFMatrix = function () {
    const V3 = [];
    const Q4 = [];
    const DEFAULT_TRANSLATION = [0, 0, 0];
    const DEFAULT_ROTATION = [0, 0, 0];
    const DEFAULT_SCALE = [1, 1, 1];
    return function (out, t, r, s) {
        const translation = vec3.set(V3, ...(t || DEFAULT_TRANSLATION));
        const rotation = r || DEFAULT_ROTATION;
        const scale = s || DEFAULT_SCALE;
        const eluerQuat = quat.fromEuler(Q4, rotation[0], rotation[1], rotation[2]);
        return mat4.fromRotationTranslationScale(out, eluerQuat, translation, scale);
    };
}();

export default GLTFPhongPainter;
