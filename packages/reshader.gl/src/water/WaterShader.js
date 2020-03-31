import waterVert from './water.vert';
import waterFrag from './water.frag';
import MeshShader from '../shader/MeshShader.js';
class WaterShader extends MeshShader {
    constructor(config = {}) {
        super({
            vert: waterVert,
            frag: waterFrag,
            uniforms: [
                'projMatrix',
                'viewMatrix',
                'camPos',
                'timeElapsed',
                'waveParams', //waveParams是一个长度为4的数组，分别代表[波动强度, 法线贴图的repeat次数, 水流的强度, 水流动的偏移量]
                'waveDirection',
                'waterColor',
                'lightingDirection',
                'lightingIntensity',
                'texWaveNormal',
                'texWavePerturbation'
            ],
            defines: config.defines || {},
            extraCommandProps: config.extraCommandProps || {}
        });
    }
}
export default WaterShader;
