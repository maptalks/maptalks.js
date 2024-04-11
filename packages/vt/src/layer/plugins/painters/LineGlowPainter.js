import LinePainter from './LinePainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/line.glow.vert';
import frag from './glsl/line.glow.frag';

class LineGlowPainter extends LinePainter {
    needToRedraw() {
        if (super.needToRedraw()) {
            return true;
        }
        return this.sceneConfig.animation;
    }

    createShader() {
        const canvas = this.canvas;
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
                'lineOpacity',
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                        return projViewModelMatrix;
                    }
                }
            ],
            extraCommandProps: {
                viewport,
                stencil: {
                    enable: true,
                    mask: 0xFF,
                    func: {
                        cmp: '<=',
                        ref: (context, props) => {
                            return props.level;
                        },
                        mask: 0xFF
                    },
                    op: {
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
                    func: this.getBlendFunc(),
                    equation: 'add'
                },
            }
        });
    }

    getUniformValues(map) {
        const uniforms = super.getUniformValues(map);
        let t = this.layer.getRenderer().getFrameTimestamp();
        if (!this._startTime) {
            this._startTime = t;
        }
        const loopTime = this.sceneConfig['loopTime'] || 1800 * 1000,
            speed = this.sceneConfig['speed'] || 1;
        uniforms.trailLength = this.sceneConfig['trailLength'] || 300;
        uniforms.currentTime = ((t - this._startTime) % loopTime) * speed;
        uniforms.animation = this.sceneConfig['animation'] === true ? 1.0 : 0.0;
        return uniforms;
    }

}

export default LineGlowPainter;
