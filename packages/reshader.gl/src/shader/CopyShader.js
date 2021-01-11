import QuadShader from './QuadShader.js';
import vert from './glsl/quad.vert';

class CopyShader extends QuadShader {
    constructor() {
        super({
            vert,
            frag: `
            precision highp float;

            uniform sampler2D texture;
            uniform vec2 size;
            void main() {
                vec2 uv = gl_FragCoord.xy / size;
                gl_FragColor = texture2D(texture, uv);
            }
            `,
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['size'][0];
                    },
                    height: (context, props) => {
                        return props['size'][1];
                    }
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['copy']) {
            this.commands['copy'] = this.createREGLCommand(
                regl,
                null,
                mesh.getElements()
            );
        }
        return this.commands['copy'];
    }
}

export default CopyShader;
