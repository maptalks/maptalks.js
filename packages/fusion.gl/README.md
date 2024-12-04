# fusion.gl
[![Build Status](https://travis-ci.com/axmand/fusion.gl.svg?token=N2z4DqiFgBjde7FHSBe3&branch=master)](https://travis-ci.com/axmand/fusion.gl)
[![npm version](https://badge.fury.io/js/fusion.gl.svg)](https://badge.fury.io/js/fusion.gl)
<!--[![codecov](https://codecov.io/gh/axmand/fusion.gl/branch/master/graph/badge.svg)](https://codecov.io/gh/axmand/fusion.gl)-->

一个WebGL沙盒库，它能基于同一个WebGL Context，扩展出多个沙盒WebGL环境，方便不同WebGL框架共享同一个WebGL Context。

它的主要特性：
* 模拟了全部WebGL1和部分WebGL2接口
* 每个沙盒WebGLContext的状态管理
* 切换沙盒时，自动设置WebGL Context上的状态值，例如stencil，depth，blend的相关状态
* 性能提升，如果检测到某个WebGL语句设置的状态已经被设置过，则不去运行该指令

## 示例程序
```js
import { GLContext } from '@maptalks/fusiongl';

const options = { alpha: true, depth: true };
const gl = canvas.getContext('webgl', options);
gl.wrap = () => {
  return new GLContext(this.gl);
};

// 在fusion.gl中的沙盒Context上创建Three的renderer
const renderer = new THREE.WebGLRenderer({ 'context': gl.wrap(), alpha: true });
```
