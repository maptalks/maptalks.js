import * as maptalks from 'maptalks';
import { LayerImageType, PointExtent } from 'maptalks';
import * as reshader from '../reshader';
import TexturePoolable from './TexturePoolable';
import { createImageMesh, updateFilter, updateImageMeshLocalTransform } from './util/imageMesh';
import { isNil } from './util/util';
import CanvasCompatible from './CanvasCompatible';

const { LayerAbstractRenderer, ImageLayerRenderable, testNeedUpdateAltitude } = maptalks.renderer;

const positionData = new Int16Array([
    0, 0, 0, -1, 1, 0, 1, -1
]);

const texCoords = new Uint16Array([
    0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0
]);

const IMAGE_SCALE = 1;

/**
 * ImageLayer has no tiles, but createImageMesh/updateImageMeshLocalTransform need a tileInfo
 * to carry layerAlt (layer.options.altitude), so keep a lightweight tileInfo on each image,
 * the same way as the core ImageLayerGLRenderer does.
 */
function getImageTileInfo(image: LayerImageType) {
    if (!(image as any).tileInfo) {
        (image as any).tileInfo = {};
    }
    return (image as any).tileInfo;
}


class ImageLayerGLRenderer2 extends TexturePoolable(CanvasCompatible(ImageLayerRenderable(LayerAbstractRenderer))) {
    //@internal
    _shader: reshader.ImageShader;
    //@internal
    _imageGeometry: reshader.Geometry;
    //@internal
    _imageScene: reshader.Scene;
    //@internal
    _imageMeshes: reshader.Mesh[] = [];
    //@internal
    _renderer: reshader.Renderer;

    isDrawable() {
        return true;
    }

    drawImage(image: LayerImageType, extent: PointExtent, opacity: number) {
        const tileInfo = getImageTileInfo(image);
        const needUpdateAltitude = testNeedUpdateAltitude(this.layer, tileInfo);
        let mesh: reshader.Mesh = (image as any).mesh;
        if (!mesh) {
            mesh = this._createImageMesh(image, extent, tileInfo);
            (image as any).mesh = mesh;
        } else if (needUpdateAltitude) {
            // layer.options.altitude changed, recompute mesh's z
            updateImageMeshLocalTransform(mesh, extent, null, IMAGE_SCALE, tileInfo);
        }
        const map = this.getMap();
        updateFilter(mesh, map, map.getGLRes(), !!this.layer.options['mipmapTexture']);
        if (map.getRenderer().canvas === this.canvas) {
            let layerOpacity = this.layer.options['opacity'];
            if (isNil(layerOpacity)) {
                layerOpacity = 1;
            }
            opacity *= layerOpacity;
        }

        mesh.material.set('opacity', opacity);
        this._imageMeshes.push(mesh);
    }

    _createImageMesh(image: LayerImageType, extent: PointExtent, tileInfo?: any) {
        const mesh = createImageMesh.call(this, this._imageGeometry, image, extent, null, IMAGE_SCALE, null, tileInfo);
        const texture = mesh.material.get('baseColorTexture') as reshader.Texture2D;
        (image as any).texture = texture;
        return mesh;
    }

    drawImages(timestamp?: number, context?: any) {
        this._imageMeshes.length = 0;
        super.drawImages(timestamp, context);
        const uniformValues = this._getUniformValues();
        let fbo;
        if (context && context.renderTarget) {
            fbo = context.renderTarget.fbo;
        }
        this._imageScene.setMeshes(this._imageMeshes);
        this._renderer.render(this._shader, uniformValues, this._imageScene, fbo);
    }

    _getUniformValues() {
        const map = this.getMap();
        return {
            'projViewMatrix': map.projViewMatrix
        };
    }

    retireImage(image: any) {
        const texture = image.texture;
        if (texture) {
            this.saveTexture(texture);
            delete image.texture;
        }
        if (image.mesh) {
            const mesh = image.mesh;
            mesh.material.set('baseColorTexture', null, false);
            mesh.material.dispose();
            image.mesh.dispose();
        }
        delete image.mesh;
        return super.retireImage(image);
    }

    initContext(): void {
        this._shader = new reshader.ImageShader({
            extraCommandProps: this._getCommandProps()
        });
        this._imageGeometry = new reshader.Geometry(
            {
                aPosition: positionData,
                aTexCoord: texCoords
            },
            4,
            0,
            {
                positionSize: 2,
                primitive: 'triangle strip'
            }
        );
        const { regl, device } = this.context as any;
        this._imageGeometry.generateBuffers(regl || device);
        this._imageMeshes = [];
        this._imageScene = new reshader.Scene(this._imageMeshes);
        this._renderer = new reshader.Renderer(regl || device);
    }

    _getCommandProps() {
        const canvas = this.getMap().getRenderer().canvas;
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
        return {
            viewport,
            depth: {
                enable: true,
                func: this.layer.options['depthFunc'],
                mask: !!this.layer.options['depthMask']
            },
            blend: {
                enable: true,
                func: {
                    src: 1,
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
        }
    }

    onRemove() {
        this.disposeTexturePool();
        return super.onRemove();
    }
}

export default ImageLayerGLRenderer2;

maptalks.ImageLayer.registerRenderer('gl', ImageLayerGLRenderer2);
maptalks.ImageLayer.registerRenderer('gpu', ImageLayerGLRenderer2);
