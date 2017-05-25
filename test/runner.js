

import Container from './../src/core/Container';

import WebGLRenderer from './../src/renderer/WebGLRenderer';

let container =new Container();

let webglRenderer = new WebGLRenderer();

webglRenderer.on('event.fire',function(data){
    var s="";
});

container.addEventPopNode(webglRenderer);

//webglRenderer.addEventParent();

container.run();