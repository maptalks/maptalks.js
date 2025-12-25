import * as maptalks from 'maptalks';
import * as reshader from '../../reshader';
import { WebGLConstants } from '../../reshader';
import { mat4 } from 'gl-matrix';
import { extend } from './util';

const TILE_POINT = new maptalks.Point(0, 0);
const DEFAULT_BASE_COLOR = [1, 1, 1, 1];

export function createImageMesh(geometry, image, extent2d, offset, scale, uniforms) {
    const width = extent2d.xmax - extent2d.xmin;
    const height = extent2d.ymax - extent2d.ymin;

    offset = offset || [0, 0];
    const point = TILE_POINT.set(extent2d.xmin - offset[0], extent2d.ymax - offset[1]);
    const x = point.x * scale,
        y = point.y * scale;

    const config = {
        data: image,
        mag: 'nearest',
        mipmap: true,
        premultiplyAlpha: true
    } as any;
    if (!image || image.width === 0 || image.height === 0) {
        image = new Uint8Array([0, 0, 0, 0]);
        config.width = 1;
        config.height = 1;
        config.data = image;
    }
    let texture = this.getTexture();
    if (!texture) {
        texture = new reshader.Texture2D(config);
    } else {
        texture.setConfig(config);
    }
    // image.texture = texture;

    uniforms = extend(uniforms || {}, {
        opacity: 1,
        debugLine: 0,
        alphaTest: 0,
        baseColor: DEFAULT_BASE_COLOR,
        baseColorTexture: texture
    });
    const material = new reshader.Material(uniforms);
    const mesh = new reshader.Mesh(geometry, material);
    mesh.properties.minFilter = WebGLConstants.GL_NEAREST;
    const localTransform = mat4.identity([] as any);
    mat4.translate(localTransform, localTransform, [x || 0, y || 0, 0]);
    mat4.scale(localTransform, localTransform, [scale * width, scale * height, 1]);
    mesh.localTransform = localTransform;
    return mesh;
}

export function updateFilter(mesh: reshader.Mesh, map: maptalks.Map, res: number) {
    const cache = maptalks.MapStateCache[map.id];
    const zoom = cache ? cache.zoom : map.getZoom();
    const dpr = cache ? cache.devicePixelRatio : map.getDevicePixelRatio();
    const minFilter = getTexMinFilter(map, zoom);

    if (mesh.properties.minFilter !== minFilter) {
        const baseColorTexture = (mesh.material.get('baseColorTexture') as any);
        baseColorTexture.setMinFilter(minFilter);
        mesh.properties.minFilter = minFilter;
    }
    const resized = map.getResolution() !== res;

    let magFilter: number = WebGLConstants.GL_NEAREST;
    if (dpr !== 1 || resized) {
        magFilter = WebGLConstants.GL_LINEAR;
    }
    if (mesh.properties.magFilter !== magFilter) {
        const baseColorTexture = (mesh.material.get('baseColorTexture') as any);
        baseColorTexture.setMagFilter(magFilter);
        mesh.properties.magFilter = magFilter;
    }
}

function getTexMinFilter(map: maptalks.Map, zoom: number) {
    const blurTexture = map.isMoving() && map.getRenderer().isViewChanged();
    let minFilter;
    if (blurTexture) {
        minFilter = WebGLConstants.GL_LINEAR_MIPMAP_LINEAR;
    } else if (!map.getBearing() && !map.getPitch() && Number.isInteger(zoom)) {
        minFilter = WebGLConstants.GL_NEAREST;
    } else {
        minFilter = WebGLConstants.GL_LINEAR;
    }
    return minFilter;
}
