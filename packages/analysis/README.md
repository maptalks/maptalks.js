# maptalks.analysis
[![NPM Version](https://img.shields.io/npm/v/@maptalks/analysis.svg)](https://github.com/fuzhenn/analysis.git)
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
    Boolean: true or false

  * ### Class : FloodAnalysis`(inherited from maptalks.Eventable)`
    > FloodAnalysis's constructor.
    
    #### Method : new FloodAnalysis(options) 
    | Parameter | Type | Default | Description|
    | ------------- |---------- |-------------|--------- |
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
    CutAnalysis: return this

    #### Method : isEnbale()
    _whether the analysis task is enable_
    Boolean: true or false
