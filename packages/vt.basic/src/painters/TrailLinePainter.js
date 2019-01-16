import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import NativeLinePainter from './NativelinePainter';
import Color from 'color';
import vert from './glsl/native-trail.vert';
import frag from './glsl/native-trail.frag';

export default class TrailLinePainter extends NativeLinePainter {

    needToRedraw() {
        return true;
    }

    getMeshUniforms(geometry, symbol) {
        const uniforms = {
            tileResolution : geometry.properties.tileResolution,
            tileRatio : geometry.properties.tileRatio
        };
        if (symbol['lineColor']) {
            const color = Color(symbol['lineColor']);
            uniforms.lineColor = color.unitArray();
            if (uniforms.lineColor.length === 3) {
                uniforms.lineColor.push(1);
            }
        }
        if (symbol['lineOpacity'] || symbol['lineOpacity'] === 0) {
            uniforms.lineOpacity = symbol['lineOpacity'];
        }
        return uniforms;
    }

    init() {
        const map = this.layer.getMap();
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return this.canvas ? this.canvas.width : 1;
            },
            height : () => {
                return this.canvas ? this.canvas.height : 1;
            }
        };

        const config = {
            vert,
            frag,
            uniforms : [
                {
                    name : 'projViewModelMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                        return projViewModelMatrix;
                    }
                },
                {
                    name : 'tileScale',
                    type : 'function',
                    fn : function (context, props) {
                        const { tileResolution, tileRatio } = props;
                        const zoomScale = tileResolution / map.getResolution();
                        return tileRatio / zoomScale;
                    }
                },
                'currentTime',
                'trailLength',
            ],
            defines : null,
            extraCommandProps : {
                viewport,
                stencil: {
                    enable: true,
                    func: {
                        cmp: '<=',
                        ref: (context, props) => {
                            return props.level;
                        }
                    },
                    op: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    }
                },
                depth : {
                    enable : true,
                    func : this.sceneConfig.depthFunc || 'less'
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one'
                    },
                    equation: 'add'
                }
            }
        };

        this.shader = new reshader.MeshShader(config);
    }

    getUniformValues(map) {
        let t = performance.now();
        if (!this._startTime) {
            this._startTime = t;
        }
        const projViewMatrix = map.projViewMatrix,
            loopTime = this.sceneConfig['loopTime'] || 1800 * 1000,
            speed = this.sceneConfig['speed'] || 1;
        return {
            trailLength : this.sceneConfig['trailLength'] || 300,
            currentTime : ((t - this._startTime) % loopTime) * speed,
            projViewMatrix
        };
    }
}
