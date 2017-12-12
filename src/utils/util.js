/**
 * 全局HTMLCanvasElement
 */
const CANVASES={
    /**
     * 取出canvas htmldoucment
     */
    getCanvasById:function(){

    }
};
/**
 * 全局GLCONTEXT
 */
const GLCONTEXTS={};
/**
 * 全局WEBGLCONTEXT
 */
const WEBGLCONTEXTS={};
/**
 * 全局limit存储
 */
const GLLIMITS={};
/**
 * 全局扩展存储
 */
const GLEXTENSIONS={};
/**
 * 全局扩展，glShader存储
 */
const GLSHADERS={};
/**
 * 全局扩展，glTexture纹理存储
 */
const GLTEXTURES={};
/**
 * 全局扩展，GLPrograms存储
 */
const GLPROGRAMS = {};

module.exports = {
    CANVASES,
    GLCONTEXTS,
    WEBGLCONTEXTS,
    GLEXTENSIONS,
    GLLIMITS,
    GLPROGRAMS,
    GLSHADERS,
    GLTEXTURES
}