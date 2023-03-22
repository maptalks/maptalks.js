# maptalks.TransformControl
[![NPM Version](https://img.shields.io/npm/v/@maptalks/transform-control.svg)](https://github.com/fuzhenn/transform-control.git)
## Usage

```transform-control``` a plugin to control model's translate、rotation and scale.

## Install
  
* Install with npm: ```npm install @maptalks/transform-control```.
* Use unpkg CDN: ```https://unpkg.com/@maptalks/transform-control/dist/transform-control.js```

## Vanilla Javascript
```html
<script type="text/javascript" src="../maptalks.transform-control.js"></script>
<script>
var map = new maptalks.Map("map",{
    center : [0, 0],
    zoom   :  15
});
var transformControl = new maptalks.TransformControl();
transformControl.addTo(map);
transformControl.on('transforming', e => {
    //get translate、rotation、scale
    const translate = e.translate;
    const rotation = e.rotation;
    const scale = e.scale;
});
</script>
```

## ES6

```javascript
import TransfromControl from '@maptalks/transform-control';

const map = new maptalks.Map("map",{
    center : [0, 0],
    zoom   :  15
});
const transformControl = new maptalks.TransformControl();
transformControl.addTo(map);
transformControl.on('transforming', e => {
    const target = e.target;
    target.setTRS(e.translate, e.rotation, e.scale);
});
transformControl.on('positionchange', e => {
    const target = e.target;
    target.setCoordinates(e.coordinate);
});
```

## API
  * ### Class : TransformControl`(inherited from maptalks.Eventable)`
    > transform control's constructor.
    
    #### Method : new TransformControl(options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `id`      | String |  | transform control's id |
    | `options`   | Object | null | construct options     |

    #### Method : addTo(map)
    _add the control to a map_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `map`      | maptalks.Map |  | a map to add |
    > returns : <br>
    TransformControl: this

    #### Method : remove()
    _remove the control from map_

    #### Method : transform(target)
    _specify a target to transform_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `target`      | GLTFMarker \| Mesh | null | the target to transform |

    #### Method : getTransformTarget()
    _get the current tranforming target_
    > returns : <br>
    Object: the transforming target object

    #### Method : enable()
    _enable the control_
    > returns : <br>
    TransformControl: return this

    #### Method : disable()
    _disable the control, when disable the control, it will be not available_
    TransformControl: return this

    #### Method : isEnbale()
    _whether the control is enable_
    Boolean: true or false

    #### Event : transforming
    _when transforming the target, it will trigger transforming event_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `target`      | GLTFMarker |  | the target to transform |
    | `action`      | String |  | transforming action, includes `xy-translate`、`x-translate`、`y-translate`、`z-translate`、`z-rotate`、`scale` |
    | `type`      | GLTFMarker |  | event type name |
    | `translate`      | Array |  | current translate when transforming |
    | `scale`      | Array |  | current scale when transforming |
    | `rotation`      | Array |  | current rotation when transforming |

    #### Event : positionchange
    _when changing target's position, it will trigger positionchange event_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `target`      | GLTFMarker |  | the target to transform |
    | `action`      | String |  | transforming action, includes `xy-translate`、`x-translate`、`y-translate`、`z-translate`、`z-rotate`、`scale` |
    | `type`      | GLTFMarker |  | event type name |
    | `coordinate`      | Array |  | current coordinate when changing target's position |

    #### Event : transformend
    _when endding the transform task, it will trigger transformend event_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `target`      | GLTFMarker |  | the target to be transformed |
    | `action`      | String |  | current action |
    | `type`      | GLTFMarker |  | event type name |
