import * as maptalks from 'maptalks';
import { LayerImageType, PointExtent } from 'maptalks';
import * as reshader from '@maptalks/reshader.gl';
import TexturePoolable from './TexturePoolable';
import { createImageMesh, updateFilter } from './util/imageMesh';
import { isNil } from './util/util';
import CanvasCompatible from './CanvasCompatible';

const { LayerAbstractRenderer, ImageLayerRenderable } = maptalks.renderer;

const positionData = new Int16Array([
    0, 0, 0, -1, 1, 0, 1, -1
]);

const texCoords = new Uint16Array([
    0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0
]);


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
        let mesh: reshader.Mesh = (image as any).mesh;
        if (!mesh) {
            mesh = this._createImageMesh(image, extent);
            (image as any).mesh = mesh;
        }
        const map = this.getMap();
        updateFilter(mesh, map, map.getGLRes());
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

    _createImageMesh(image: LayerImageType, extent: PointExtent) {
        const scale = 1;
        const mesh = createImageMesh.call(this, this._imageGeometry, image, extent, null, scale);
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
