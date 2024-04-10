import { Texture } from "@maptalks/regl";
import AbstractTexture from "src/AbstractTexture";

export type UrlModifierFunction = (url: string) => string

/* eslint-disable @typescript-eslint/ban-types */
export type MixinConstructor = new (...args: any[]) => {};
/* eslint-enable @typescript-eslint/ban-types */

export type TypedArray = Uint8Array | Uint16Array  | Uint32Array | Int8Array | Int16Array | Float32Array;

export type NumberArray = TypedArray | number[]

export type AttributeData = NumberArray | any;

// TODO regl中有定义
type PrimitiveType =
/** gl.POINTS */
"points" |
/** gl.LINES */
"lines" |
/** gl.LINE_STRIP */
"line strip" |
/** gl.LINE_LOOP */
"line loop" |
/** gl.TRIANGLES */
"triangles" |
/** gl.TRIANGLE_STRIP */
"triangle strip" |
/** gl.TRIANGLE_FAN */
"triangle fan";

export type REGLBufferLike = {
    destroy: () => void
}

export type GeometryDesc = {
    'positionSize'?: number,
    'primitive'?: PrimitiveType,
    //name of position attribute
    'positionAttribute'?: string,
    'normalAttribute'?: string,
    'uv0Attribute'?: string,
    'uv1Attribute'?: string,
    'color0Attribute'?: string,
    'colorAttribute'?: string,
    'tangentAttribute'?: string,
    'pickingIdAttribute'?: string,
    'textureCoordMatrixAttribute'?: string,
    'altitudeAttribute'?: string,
    'fillEmptyDataInMissingAttribute'?: boolean,
    'static'?: boolean
}

export type GeometryElements = { array: NumberArray }

type AttributeKey = { key: string }
export type ActiveAttributes = { name: string, type: number }[] & AttributeKey

export type MaterialUniformValue = number | boolean | NumberArray | null | AbstractTexture | Texture

export type MaterialUniforms = {
    [_: string]: MaterialUniformValue
}

export type ShaderDefines = {
    [_: string]: number | string
}
