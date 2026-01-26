# maptalks.gltf
[![NPM Version](https://img.shields.io/npm/v/@maptalks/gltf-layer.svg)](https://www.npmjs.com/package/@maptalks/gltf-layer)
[![Circle CI](https://circleci.com/gh/fuzhenn/maptalks.gltf.svg?style=shield&circle-token=ceb1fa0d07ea46c8d3f148693988bd12c835df06)](https://circleci.com/gh/fuzhenn/maptalks.gltf)
## Usage

```maptalks.gltf``` is a maptalks layer used to rendering gltf models on map.

## Install
  
* Install with npm: ```npm install @maptalks/gltf-layer```.
* Use unpkg CDN: ```https://unpkg.com/@maptalks/gltf-layer@0.2.0/dist/maptalks.gltf.js```

## Vanilla Javascript
```html
<script type="text/javascript" src="../maptalks.gltf.js"></script>
<script>
var map = new maptalks.Map("map",{
    center : [0, 0],
    zoom   :  15
});
var gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
var gltfMarker = new maptalks.GLTFMarker(coordinate, {
    outline: true,
    symbol : {
        rotation: [90, 0, 0]
    }
}).addTo(gltflayer);
</script>
```

## ES6

```javascript
import { GLTFLayer } from 'maptalks.gltf';
import { GLTFMarker } from 'maptalks.gltf';

const map = new maptalks.Map("map",{
    center : [0, 0],
    zoom   :  15
});
const gltflayer = new GLTFLayer('gltf').addTo(map);
const gltfMarker = new GLTFMarker(coordinate, {
    outline: true,
    symbol : {
        rotation: [90, 0, 0]
    }
}).addTo(gltflayer);

```

## API
  * ### Class : GLTFLayer`(inherited from maptalks.OverlayLayer)`
    > a layer used to renderering gltf model on map, it manages gltf markers.
    
    #### Method : new GLTFLayer(id, options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `id`      | String |  | gltflayer's id |
    | `options`   | Object | null |construct options     |

    #### Method : `(static)`registerShader(name, type, config, uniforms)
    _register a custom shader to gltf layer_
     | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `name`      | String |  | shader's name |
    | `type`   | String |  | shader's type     |
    | `config`      | Object |  | a regl shader structure |
    | `uniforms`   | Object | null | uniforms transform to webgl shader     |

    #### Method : `(static)`removeShader(name)
    _remove a shader from  gltf layer's shader list_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `name`      | String |  | shader's name |

    #### Method : `(static)`getShaders()
    _get all shaders registed to gltf layer_
    > returns : <br>
    Object: gltf layer's  shader list

    #### Method : `(static)`fromJSON(json)
    _create a GLTFLayer from s JSON object_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `json`      | Objec |  | JSON object |
    > returns : <br>
    GLTFLayer: a new gltf layer

    #### Method : addGeometry(markers)
    _add one or more gltf marker in gltf layer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `markers`      | GLTFMarker \| Array.<GLTFMarker> |  | one or more GLTFMarkers |
    > returns : <br>
    GLTFLayer: this

    #### Method : removeGeometry(markers)
    _remove one or more gltf marker from gltf layer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `markers`      | GLTFMarker \| Array.<GLTFMarker> |  | one or more GLTFMarkers |

    #### Method : getModels()
    _get gltf layer's models_
    > returns : <br>
    Object: gltf model list

    #### Method : toJSON(options)
    _convert gltflayer to a JSON object_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `options`      | Object | null | 	export options |
    > returns : <br>
    Object: gltflayer's JSON

    #### Method : setStyle(layerStyle)
    _set styles for gltf layer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `layerStyle`      | Object |  | style object to set for gltflayer |
    > returns : <br>
    GLTFLayer: this

    #### Method : getStyle()
    _get gltf layer's style objects if it has set_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `layerStyle`      | Object |  | style object to set for gltflayer |
    > returns : <br>
    Object: layer's style object

    #### Method : updateSymbol(idx, symbolProperties)
    _update a style's symbol for gltf layer by index_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `idx`      | Number |  | the index of gltflayer's style |
    | `symbolProperties`   | Object | null | a style object    |

    #### Method : getGLTFUrls()
    _get all modle's url added to gltf layer_
    > returns : <br>
    Array: gltf model list

    #### Method : clear()
    _clear all gltf markers_
    > returns : <br>
    GLTFLayer: this

    #### Method : remove()
    _remove itself from map_

    #### Method : identify(coordinate, options)
    _identify the gltf markers on the given coordinate
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `coordinate`      | maptalks.Coordinate |  | coordinate to identify |
    | `options`   | Object | null | some conditions    |


  * ### Class : GLTFMarker`(inherited from maptalks.Marker)`
    > a gltf marker object to render gltf models

    #### Method : new GLTFMarker(coordinates, options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `coordinates` | maptalks.Coordinates |  | coordinates of the gltf marker |
    | `options`   | Object | null |construct options defined in GLTFMarker |

    #### Method : `(static)`fromJSON(json)
    _create a new GLTFMarker from a JSON object_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `json`      | Object |  |  a JSON objec |
    > returns : <br>
    GLTFMarker: a new GLTFMarker

    #### Method : setUrl(url)
    _set a gltf model path for gltf marker_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `url`      | String |  | gltf model's path |
    > returns : <br>
    GLTFMarker: this

    #### Method : setCoordinates(coordinates)
    _set coordinates for gltf marker_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `coordinates`      | Coordinate \| Array.<Coordinate> |  | the gltf marker's location |
    > returns : <br>
    GLTFMarker: this

    #### Method : addTo(layer)
    _add a gltf marker to gltf layer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `layer`      | GLTFLayer |  | the layer to add to |
    > returns : <br>
    GLTFMarker: this

    #### Method : remove()
    _remove itselt from gltf layer_

    #### Method : show()
    _show the marker_
    > returns : <br>
    GLTFMarker: this

    #### Method : hide()
    hide the marker_
    > returns : <br>
    GLTFMarker: this

    #### Method : setBloom(bloom)
    _add a gltf marker to gltf layer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `bloom`      | Boolean |  | whether has bloom effect |
    > returns : <br>
    GLTFMarker: this

    #### Method : isBloom()
    _if the gltf marker has bloom effect_
    > returns : <br>
    Boolean : if has bloom effect
    
    #### Method : setCastShadow(shadow)
    _set shadow effect for gltf marker_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `shadow`      | Boolean |  | whether has shadow effect |
    > returns : <br>
    GLTFMarker: this

    #### Method : isCastShadow()
    _if the gltf marker has shadow effect_
    > returns : <br>
    Boolean : if has shadow effect

    #### Method : setOutline(outline)
    _set outline effect for gltf marker_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `outline`      | Boolean |  | whether has outline effect |
    > returns : <br>
    GLTFMarker: this

    #### Method : isOutline()
    _if the gltf marker has outline effect_
    > returns : <br>
    Boolean : if has outline effect

    #### Method : isVisible()
    _if the gltf marker has outline effect_
    > returns : <br>
    Boolean : if has outline effect

    #### Method : copy()
    _clone a marker by itself
    > returns : <br>
    GLTFMarker : a new gltf marker

    #### Method : setId(id)
    _set id for gltf marker_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `id`      | String |  | gltf marker's id |

     #### Method : setId(id)
    _get gltf marker's id_

    #### Method : setShader(shader)
    _set a shader for gltf marker_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `shader`      | Object |  |shader's config |
    > returns : <br>
    GLTFMarker : a new gltf marker
