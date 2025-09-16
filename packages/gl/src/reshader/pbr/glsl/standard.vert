#include <gl2_vert>
#define SHADER_NAME PBR

attribute vec3 aPosition;

#if defined(HAS_MAP) || defined(HAS_TERRAIN_FLAT_MASK)
    attribute vec2 aTexCoord;
    #include <common_pack_float>
#endif

#if defined(HAS_MAP)

    uniform vec2 uvOrigin;
    uniform vec2 uvScale;
    uniform vec2 uvOffset;
    uniform float uvRotation;

    #ifdef HAS_I3S_UVREGION
        attribute vec4 uvRegion;
        varying vec4 vUvRegion;
    #endif
    #if defined(HAS_AO_MAP)
      attribute vec2 aTexCoord1;
      varying vec2 vTexCoord1;
    #endif
#endif

vec3 Vertex;
vec3 Normal;
vec4 Tangent;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 positionMatrix;
uniform mat4 projMatrix;

// uniform vec2 outSize;
// uniform vec2 halton;
uniform mediump vec3 cameraPosition;

uniform mat3 modelNormalMatrix;

#ifdef HAS_SSR
    uniform mat3 modelViewNormalMatrix;
    varying vec3 vViewNormal;
    #ifdef HAS_TANGENT
        varying vec4 vViewTangent;
    #endif
#endif
varying vec3 vModelNormal;
varying vec4 vViewVertex;

#if defined(HAS_TANGENT)
    varying vec4 vModelTangent;
    varying vec3 vModelBiTangent;
#endif

varying vec3 vModelVertex;
#if defined(HAS_MAP)
    varying vec2 vTexCoord;
#endif

#if defined(HAS_COLOR)
    attribute vec4 aColor;
    varying vec4 vColor;
#endif

#ifdef HAS_OPACITY
    attribute float aOpacity;
#endif
varying float vOpacity;

#include <highlight_vert>

#if defined(HAS_COLOR0)
    #if COLOR0_SIZE == 3
        attribute vec3 aColor0;
        varying vec3 vColor0;
    #else
        attribute vec4 aColor0;
        varying vec4 vColor0;
    #endif
#endif

#include <line_extrusion_vert>
#include <get_output>
#if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
    #include <vsm_shadow_vert>
#endif
#include <heatmap_render_vert>

#include <vertex_color_vert>

#if defined(HAS_BUMP_MAP) && defined(HAS_TANGENT)
    varying vec3 vTangentViewPos;
    varying vec3 vTangentFragPos;
    #if __VERSION__ == 100
        mat3 transposeMat3(in mat3 inMat) {
            vec3 i0 = inMat[0];
            vec3 i1 = inMat[1];
            vec3 i2 = inMat[2];

            return mat3(
                vec3(i0.x, i1.x, i2.x),
                vec3(i0.y, i1.y, i2.y),
                vec3(i0.z, i1.z, i2.z)
            );
        }
    #else
        mat3 transposeMat3(in mat3 inMat) {
            return transpose(inMat);
        }
    #endif
#endif

/**
 * Extracts the normal vector of the tangent frame encoded in the specified quaternion.
 */
void toTangentFrame(const highp vec4 q, out highp vec3 n) {
    n = vec3( 0.0,  0.0,  1.0) +
        vec3( 2.0, -2.0, -2.0) * q.x * q.zwx +
        vec3( 2.0,  2.0, -2.0) * q.y * q.wzy;
}

/**
 * Extracts the normal and tangent vectors of the tangent frame encoded in the
 * specified quaternion.
 */
void toTangentFrame(const highp vec4 q, out highp vec3 n, out highp vec3 t) {
    toTangentFrame(q, n);
    t = vec3( 1.0,  0.0,  0.0) +
        vec3(-2.0,  2.0, -2.0) * q.y * q.yxw +
        vec3(-2.0,  2.0,  2.0) * q.z * q.zwx;
}

const float mid = 0.5;
//https://gist.github.com/ayamflow/c06bc0c8a64f985dd431bd0ac5b557cd
vec2 rotateUV(vec2 uv, float rotation) {
    return vec2(
        cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
        cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
    );
}
#if defined(HAS_MAP)
  vec2 transformTexcoord(vec2 uv) {
    vec2 decodedTexCoord = decode_getTexcoord(uv);
    // vec2 texCoord = decodedTexCoord * uvScale + uvOffset;
    #ifdef HAS_RANDOM_TEX
        vec2 origin = uvOrigin;
        vec2 texCoord = decodedTexCoord * uvScale + uvOffset;
        return mod(origin, 1.0) + texCoord;
    #else
        vec2 origin = uvOrigin;
        vec2 texCoord = decodedTexCoord * uvScale;
        if (uvRotation != 0.0) {
            origin = rotateUV(origin, uvRotation);
            texCoord = rotateUV(texCoord, uvRotation);
        }
        return mod(origin, 1.0) + texCoord + uvOffset;
    #endif
  }
#endif

#ifdef PICKING_MODE
    #include <fbo_picking_vert>
#endif
#include <excavate_vert>
void main() {
    mat4 localPositionMatrix = getPositionMatrix();

    #ifdef IS_LINE_EXTRUSION
        vec3 linePosition = getLineExtrudePosition(aPosition);
        //linePixelScale = tileRatio * resolution / tileResolution
        vec4 localVertex = getPosition(linePosition);
    #else
        vec4 localVertex = getPosition(aPosition);
    #endif
    vModelVertex = (modelMatrix * localVertex).xyz;

    vec4 position = localPositionMatrix * localVertex;
    vec4 viewVertex = modelViewMatrix * position;
    vViewVertex = viewVertex;
    // gl_Position = projMatrix * modelViewMatrix * localVertex;
    // mat4 jitteredProjection = projMatrix;
    // jitteredProjection[2].xy += halton.xy / outSize.xy;
    #ifdef HAS_MASK_EXTENT
        gl_Position = projMatrix * getMaskPosition(position, modelMatrix);
    #else
        gl_Position = projMatrix * viewVertex;
    #endif
    // gl_PointSize = min(64.0, max(1.0, -uPointSize / vViewVertex.z));

    #ifdef PICKING_MODE
        float alpha = 1.0;
        #if defined(HAS_COLOR)
            alpha *= aColor.a;
        #endif
        #if defined(HAS_COLOR0) && COLOR0_SIZE == 4
            alpha *= aColor0.a;
        #endif

        fbo_picking_setData(gl_Position.w, alpha != 0.0);
    #else

        #if defined(HAS_MAP)
            vTexCoord = transformTexcoord(aTexCoord);
            #ifdef HAS_AO_MAP
              vTexCoord1 = transformTexcoord(aTexCoord1);
            #endif
            #ifdef HAS_I3S_UVREGION
                vUvRegion = uvRegion / 65535.0;
            #endif

        #endif


        #if defined(HAS_TANGENT) || defined(HAS_NORMAL)
            mat3 positionNormalMatrix = mat3(localPositionMatrix);
            mat3 normalMatrix = modelNormalMatrix * positionNormalMatrix;
            #if defined(HAS_TANGENT)
                vec3 t;
                toTangentFrame(aTangent, Normal, t);
                // Tangent = vec4(t, aTangent.w);
                // vec4 localTangent = Tangent;
                // vViewTangent = vec4(modelViewNormalMatrix * localTangent.xyz, localTangent.w);
                vModelTangent = vec4(normalMatrix * t, aTangent.w);
            #else
                Normal = decode_getNormal(aNormal);
            #endif
            vec3 localNormal = Normal;
            vModelNormal = normalMatrix * localNormal;
        #else
            Normal = vec3(0.0);
            vModelNormal = vec3(0.0);
        #endif

        #if defined(HAS_TANGENT)
            vModelBiTangent = cross(vModelNormal, vModelTangent.xyz) * sign(aTangent.w);
        #endif

        #ifdef HAS_SSR
            mat3 ssrNormalMatrix = modelViewNormalMatrix * positionNormalMatrix;
            vViewNormal = ssrNormalMatrix * Normal;
             #if defined(HAS_TANGENT)
                // Tangent = vec4(t, aTangent.w);
                vec4 localTangent = vec4(t, aTangent.w);;
                vViewTangent = vec4(ssrNormalMatrix * localTangent.xyz, localTangent.w);
            #endif
        #endif

        #if defined(HAS_COLOR)
            vColor = aColor / 255.0;
        #endif

        #ifdef HAS_OPACITY
            vOpacity = aOpacity / 255.0;
        #else
            vOpacity = 1.0;
        #endif

        highlight_setVarying();

        #if defined(HAS_COLOR0)
            vColor0 = aColor0 / 255.0;
        #endif

        #if defined(HAS_SHADOWING) && !defined(HAS_BLOOM)
            shadow_computeShadowPars(position);
        #endif

        #ifdef HAS_HEATMAP
            heatmap_compute(projMatrix * modelViewMatrix * localPositionMatrix,localVertex);
        #endif

        #if defined(HAS_BUMP_MAP) && defined(HAS_TANGENT)
            mat3 TBN = transposeMat3(mat3(vModelTangent.xyz, vModelBiTangent, vModelNormal));
            vTangentViewPos = TBN * cameraPosition;
            vTangentFragPos = TBN * vModelVertex;
        #endif

        #ifdef HAS_VERTEX_COLOR
            vertexColor_update();
        #endif

        #ifdef HAS_EXCAVATE_ANALYSIS
          vCoordinateTexcoord = getCoordinateTexcoord(position);
          vExcavateHeight = getWorldHeight(position);
        #endif
    //#ifdef PICKING_MODE的endif
    #endif

}
