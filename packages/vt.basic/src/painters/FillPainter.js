import BasicPainter from './BasicPainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/fill.vert';
import frag from './glsl/fill.frag';
import pickingVert from './glsl/fill.picking.vert';
import { setUniformFromSymbol, createColorSetter } from '../Util';

const DEFAULT_UNIFORMS = {
    'polygonFill': [1, 1, 1, 1],
    'polygonOpacity': 1
};

const EMPTY_UV_OFFSET = [0, 0];

class FillPainter extends BasicPainter {

    createMesh(geometry, transform, { tileCenter }) {
        this._colorCache = this._colorCache || {};
        const symbol = this.getSymbol();
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio
        };
        setUniformFromSymbol(uniforms, 'polygonFill', symbol, 'polygonFill', createColorSetter(this._colorCache));
        setUniformFromSymbol(uniforms, 'polygonOpacity', symbol, 'polygonOpacity');

        if (symbol.polygonPatternFile) {
            uniforms.tileCenter = tileCenter.toArray();
            const iconAtlas = geometry.properties.iconAtlas;
            uniforms.polygonPatternFile = iconAtlas;
            uniforms.patternSize = [iconAtlas.width, iconAtlas.height];
            uniforms.uvScale = iconAtlas ? [256 / iconAtlas.width, 256 / iconAtlas.height] : [1, 1];
        }
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        if (symbol.polygonPatternFile) {
            mesh.setDefines({
                'HAS_PATTERN': 1
            });
        }
        mesh.setLocalTransform(transform);
        return mesh;
    }

    init() {
        const regl = this.regl;
        const canvas = this.canvas;

        this.renderer = new reshader.Renderer(regl);

        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return canvas ? canvas.width : 1;
            },
            height: () => {
                return canvas ? canvas.height : 1;
            }
        };

        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms: [
                'polygonFill', 'polygonOpacity',
                'polygonPatternFile', 'uvScale',
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                        mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                        return projViewModelMatrix;
                    }
                },
                {
                    name: 'uvOffset',
                    type: 'function',
                    fn: (context, props) => {
                        if (!props['tileCenter']) {
                            return EMPTY_UV_OFFSET;
                        }
                        const scale =  props['tileResolution'] / props['resolution'];
                        const [width, height] = props['patternSize'];
                        const tileSize = this.layer.options['tileSize'];
                        //瓦片左边沿的坐标 = 瓦片中心点.x - 瓦片宽度 / 2
                        //瓦片左边沿的屏幕坐标 = 瓦片左边沿的坐标 * tileResolution / resolution
                        //瓦片左边沿的uv偏移量 = （瓦片左边沿的屏幕坐标 / 模式图片的宽） % 1
                        const offset = [(props['tileCenter'][0] - tileSize[0] / 2) * scale / width % 1, (props['tileCenter'][1] - tileSize[1] / 2) * scale / height % 1];
                        return offset;
                    }
                },
                'tileResolution', 'resolution', 'tileRatio'
            ],
            extraCommandProps: {
                viewport,
                stencil: {
                    enable: true,
                    mask: 0xFF,
                    func: {
                        cmp: '<',
                        ref: (context, props) => {
                            return props.level;
                        },
                        mask: 0xFF
                    },
                    opFront: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    },
                    opBack: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    }
                },
                depth: {
                    enable: true,
                    func: this.sceneConfig.depthFunc || 'always'
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                },
            }
        });
        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: pickingVert,
                    uniforms: [
                        {
                            name: 'projViewModelMatrix',
                            type: 'function',
                            fn: function (context, props) {
                                const projViewModelMatrix = [];
                                mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                                mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                                return projViewModelMatrix;
                            }
                        }
                    ]
                },
                this.pickingFBO
            );
        }
    }

    getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix;
        const resolution = map.getResolution();
        return {
            viewMatrix, projMatrix,
            resolution
        };
    }
}

export default FillPainter;
