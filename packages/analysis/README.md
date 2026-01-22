# maptalks.analysis
[![NPM Version](https://img.shields.io/npm/v/@maptalks/analysis.svg)](https://www.npmjs.com/package/@maptalks/analysis)
## Usage

```maptalks.analysis``` a plugin to excute analysis task in maptalks.

## Install
  
* Install with npm: ```npm install @maptalks/analysis```.
* Use unpkg CDN: ```https://unpkg.com/@maptalks/analysis/dist/maptalks.analysis.js```

## Vanilla Javascript
```html
<script type="text/javascript" src="../maptalks.analysis.js"></script>
<script>
var map = new maptalks.Map("map",{
    center : [0, 0],
    zoom   :  15
});
var groupLayer = new maptalks.GroupGLLayer('g', [], { sceneConfig }).addTo(map);
var center = map.getCenter();
var eyePos = [center.x + 0.01, center.y, 0];
var lookPoint = [center.x, center.y, 0];
var verticalAngle = 30;
var horizontalAngle = 20;
var viewshedAnalysis = new maptalks.ViewshedAnalysis({
    eyePos,
    lookPoint,
    verticalAngle,
    horizontalAngle
});
viewshedAnalysis.addTo(groupLayer);
</script>
```

## ES6

```javascript
import { ViewshedAnalysis } from '@maptalks/analysis';

const map = new maptalks.Map("map",{
    center : [0, 0],
    zoom   :  15
});
const groupLayer = new maptalks.GroupGLLayer('g', [], { sceneConfig }).addTo(map);
const center = map.getCenter();
const eyePos = [center.x + 0.01, center.y, 0];
const lookPoint = [center.x, center.y, 0];
const verticalAngle = 30;
const horizontalAngle = 20;
const viewshedAnalysis = new maptalks.ViewshedAnalysis({
    eyePos,
    lookPoint,
    verticalAngle,
    horizontalAngle
});
viewshedAnalysis.addTo(groupLayer);
```

## API
  * ### Class : ViewshedAnalysis`(inherited from maptalks.Eventable)`
    > ViewshedAnalysis's constructor.
    
    #### Method : new ViewshedAnalysis(options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `eyePos`      | Array | null | position of eye, include longitude、latitude、altitude |
    | `lookPoint`   | Array | null | position of look point |
    | `verticalAngle`  | Number | 90 | vertical angle of viewer |
    | `horizontalAngle`   | Number | 90 | horizontal angle of viewer |

    #### Method : addTo(groupgllayer)
    _add viewshed analysis to groupgllayer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `groupgllayer`      | maptalks.GroupGLLayer |  | a groupgllayer to add |
    > returns : <br>
    ViewshedAnalysis: this

    #### Method : remove()
    _remove the viewshed analysis from groupgllayer_

    #### Method : update(name, value)
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `name`      | String |  | name of property |
    | `value`      | Any |  | value of property |

    #### Method : enable()
    _enable the analysis task_
    > returns : <br>
    ViewshedAnalysis: return this

    #### Method : disable()
    _disable the analysis task, when disable the analysis task, it will be not available_
    ViewshedAnalysis: return this

    #### Method : isEnbale()
    _whether the analysis task is enable_
    > returns : <br>
    Boolean: true or false

  * ### Class : FloodAnalysis`(inherited from maptalks.Eventable)`
    > FloodAnalysis's constructor.
    
    #### Method : new FloodAnalysis(options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `boundary`      | Array<Array> |  | the coordinate rings of flood boundary |
    | `waterColor`      | Array | [0.1451, 0.2588, 0.4863] | the color of water |
    | `waterHeight`   | Array | null | the depth of water|

    #### Method : addTo(groupgllayer)
    _add flood analysis to groupgllayer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `groupgllayer`      | maptalks.GroupGLLayer |  | a groupgllayer to add |
    > returns : <br>
    FloodAnalysis: this

    #### Method : remove()
    _remove the flood analysis from groupgllayer_

    #### Method : update(name, value)
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `name`      | String |  | name of property |
    | `value`      | Any |  | value of property |

    #### Method : enable()
    _enable the analysis task_
    > returns : <br>
    FloodAnalysis: return this

    #### Method : disable()
    _disable the analysis task, when disable the analysis task, it will be not available_
    FloodAnalysis: return this

    #### Method : isEnbale()
    _whether the analysis task is enable_
    > returns : <br>
    Boolean: true or false

  * ### Class : SkylineAnalysis`(inherited from maptalks.Eventable)`
    > SkylineAnalysis's constructor.
    
    #### Method : new SkylineAnalysis(options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `lineColor`      | Array | [1, 0, 0] | the color of skyline |
    | `lineWidth`   | Array | 1.0 | the width of skyline|

    #### Method : addTo(groupgllayer)
    _add skyline analysis to groupgllayer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `groupgllayer`      | maptalks.GroupGLLayer |  | a groupgllayer to add |
    > returns : <br>
    SkylineAnalysis: this

    #### Method : remove()
    _remove the skyline analysis from groupgllayer_

    #### Method : exportSkylineMap(options)
    _remove the skyline analysis from groupgllayer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `save`      | Boolean | true | whether pop a file save dialog to save the export image |
    | `filename`      | String | export | specify the file name, if options.save is true |

    #### Method : update(name, value)
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `name`      | String |  | name of property |
    | `value`      | Any |  | value of property |

    #### Method : enable()
    _enable the analysis task_
    > returns : <br>
    SkylineAnalysis: return this

    #### Method : disable()
    _disable the analysis task, when disable the analysis task, it will be not available_
    SkylineAnalysis: return this

    #### Method : isEnbale()
    _whether the analysis task is enable_
    > returns : <br>
    Boolean: true or false

  * ### Class : InsightAnalysis`(inherited from maptalks.Eventable)`
    > InsightAnalysis's constructor.
    
    #### Method : new InsightAnalysis(options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `lineColor`      | Array | [1, 0, 0] | the color of Insight |
    | `lineWidth`   | Array | 1.0 | the width of Insight|

    #### Method : addTo(groupgllayer)
    _add insight analysis to groupgllayer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `groupgllayer`      | maptalks.GroupGLLayer |  | a groupgllayer to add |
    > returns : <br>
    InsightAnalysis: this

    #### Method : remove()
    _remove the insight analysis from groupgllayer_

    #### Method : update(name, value)
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `name`      | String |  | name of property |
    | `value`      | Any |  | value of property |

    #### Method : enable()
    _enable the analysis task_
    > returns : <br>
    InsightAnalysis: return this

    #### Method : disable()
    _disable the analysis task, when disable the analysis task, it will be not available_
    InsightAnalysis: return this

    #### Method : isEnbale()
    _whether the analysis task is enable_
    > returns : <br>
    Boolean: true or false

  * ### Class : CutAnalysis`(inherited from maptalks.Eventable)`
    > CutAnalysis's constructor.
    
    #### Method : new CutAnalysis(options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `position`      | Array |  | the position of helper parts |
    | `rotation`   | Array | | the Euler angle of helper parts|
    | `scale`   | Array |  | the scale of helper parts|

    #### Method : addTo(groupgllayer)
    _add cut analysis to groupgllayer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `groupgllayer`      | maptalks.GroupGLLayer |  | a groupgllayer to add |
    > returns : <br>
    CutAnalysis: this

    #### Method : remove()
    _remove the cut analysis from groupgllayer_

    #### Method : update(name, value)
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `name`      | String |  | name of property |
    | `value`      | Any |  | value of property |

    #### Method : enable()
    _enable the analysis task_
    > returns : <br>
    CutAnalysis: return this

    #### Method : disable()
    _disable the analysis task, when disable the analysis task, it will be not available_
    > returns : <br>
    CutAnalysis: return this

    #### Method : isEnbale()
    _whether the analysis task is enable_
    > returns : <br>
    Boolean: true or false

    ### Method : reset()
    _reset cutanalysis's initial state_
    > returns : <br>
    CutAnalysis: return this

  * ### Class : ExcavateAnalysis`(inherited from maptalks.Eventable)`
    > ExcavateAnalysis's constructor.
    
    #### Method : new ExcavateAnalysis(options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `boundary`      | Array<Array> |  | the coordinate rings of excavate boundary |
    | `textureUrl`   | String | | the excavate texture's url |
    | `height`   | Number |  | excavate height |

    #### Method : addTo(groupgllayer)
    _add excavate analysis to groupgllayer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `groupgllayer`      | maptalks.GroupGLLayer |  | a groupgllayer to add |
    > returns : <br>
    ExcavateAnalysis: this

    #### Method : remove()
    _remove the excavate analysis from groupgllayer_

    #### Method : update(name, value)
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `name`      | String |  | name of property |
    | `value`      | Any |  | value of property |

    #### Method : enable()
    _enable the analysis task_
    > returns : <br>
    ExcavateAnalysis: return this

    #### Method : disable()
    _disable the analysis task, when disable the analysis task, it will be not available_
    > returns : <br>
    ExcavateAnalysis: return this

    #### Method : isEnbale()
    _whether the analysis task is enable_
    > returns : <br>
    Boolean: true or false

  * ### Class : CrossCutAnalysis`(inherited from maptalks.Eventable)`
    > CrossCutAnalysis's constructor.
    
    #### Method : new CrossCutAnalysis(options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `cutLine`      | Array<Array> |  | the coordinate rings of cross cut line |
    | `textureUrl`   | String | | the excavate texture's url |
    | `cutLineColor`   | Array | [0, 1, 0, 1] | color array |

    #### Method : addTo(groupgllayer)
    _add crosscut analysis to groupgllayer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `groupgllayer`      | maptalks.GroupGLLayer |  | a groupgllayer to add |
    > returns : <br>
    CrossCutAnalysis: this

    #### Method : remove()
    _remove the crosscut analysis from groupgllayer_

    #### Method : update(name, value)
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `name`      | String |  | name of property |
    | `value`      | Any |  | value of property |

    #### Method : getAltitudes(count)
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `count`      | Number |  | the count of cut times |
    > returns : <br>
    Array<Object>: [{distance: [], point: [longitude, latitude, altitude] }

    #### Method : enable()
    _enable the analysis task_
    > returns : <br>
    CrossCutAnalysis: return this

    #### Method : disable()
    _disable the analysis task, when disable the analysis task, it will be not available_
    > returns : <br>
    CrossCutAnalysis: return this

    #### Method : isEnbale()
    _whether the analysis task is enable_
    > returns : <br>
    Boolean: true or false

    * ### Class : HeightLimitAnalysis`(inherited from maptalks.Eventable)`
    > HeightLimitAnalysis's constructor.
    
    #### Method : new HeightLimitAnalysis(options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `limitHeight`      | Number |  | the limited height of analysis |
    | `limitColor`   | Array | | limited meshes will be rendered by limitedColor |

    #### Method : addTo(groupgllayer)
    _add limit analysis to groupgllayer_
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `groupgllayer`      | maptalks.GroupGLLayer |  | a groupgllayer to add |
    > returns : <br>
    HeightLimitAnalysis: this

    #### Method : remove()
    _remove the limit analysis from groupgllayer_

    #### Method : update(name, value)
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
    | `name`      | String |  | name of property |
    | `value`      | Any |  | value of property |

    #### Method : enable()
    _enable the analysis task_
    > returns : <br>
    CrossCutAnalysis: return this

    #### Method : disable()
    _disable the analysis task, when disable the analysis task, it will be not available_
    > returns : <br>
    CrossCutAnalysis: return this

    #### Method : isEnbale()
    _whether the analysis task is enable_
    > returns : <br>
    Boolean: true or false
