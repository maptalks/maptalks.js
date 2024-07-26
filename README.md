# gl-layers

WebGL layers for maptalks.

## packages说明

### 基础库
* `gltf-loader` gltf 格式解析库
* `reshader.gl` 基于regl实现的三维渲染接口，包括renderer，scene，Mesh，Material等常用的渲染基础类以及预先定义的各类渲染材质，例如PBR

### 图层
* `gl` WebGL基础图层功能，包括 GroupGLLayer，地形，后处理以及各种三维Mask的实现
* `layer-3dtiles` 3dtiles图层(Geo3DTilesLayer)的实现
* `layer-gltf` gltf图层(GLTFLayer/GLTFMarker)的实现
* `layer-video` video图层(VideoLayer/VideoSurface)的实现

### 矢量瓦片
* `vector-packer` 矢量瓦片格式的解析以及数据结构的组织
* `vt-plugin` 矢量瓦片渲染插件的接口定义
* `vt` 矢量瓦片图层(VectorTileLayer/GeoJSONVectorTileLayer)的实现

### 三维分析
* `analysis` 包含各类三维分析功能的实现
* `traffic` 交通模拟的实现

### transcoders
* `transcoders.crn` crn格式解析库
* `transcoders.draco` draco格式解析库
* `transcoders.ktx` ktx2压缩纹理格式解析库

## 安装与编译

### node 环境

node 环境目前最低要求为 18.16.1，如果不符合最低 node 版本要求，可以使用 [nvm](https://github.com/nvm-sh/nvm) / [fnm](https://fnm.vercel.app/) 管理 node 版本

### pnpm 版本

目前本项目使用的 pnpm@9.x，目前推荐使用 pnpm@9.6.0，如果不符合最低 pnpm 版本要求可以升级一下版本。

### 安装依赖

```shell
pnpm i
```

### 编译

因为packages间存在依赖关系（具体可以参考各个package中package.json中的定义），可以先用下面的指令做一次整体编译：

```shell
pnpm run build
```

### 调试编译

如果需要调试编译，即用watch模式编译，每次修改后都能自动编译，且编译目标包含源代码，方便在浏览器或测试中查看调试代码，在需要调试编译的工程下运行下面的指令即可：

```shell
pnpm run dev
```

## 测试

工程采用[karma](https://karma-runner.github.io/latest/index.html)或[electron-mocha](https://github.com/jprichardson/electron-mocha)(vt与layer-3dtiles)作为测试框架，测试用例都是基于mocha的语法编写。

### 运行工程的完整测试

在每个工程下运行 ```npm test```

### 运行指定用例的测试

* 如果工程基于 [electron-mocha](https://github.com/jprichardson/electron-mocha)，运行

```shell
pnpm run tdd -- -g "spec keywords"
```

* 如果工程基于 [karma](https://karma-runner.github.io/latest/index.html)，则需要修改测试源代码，通过mocha中的only方法来指定运行的用例，例如:

```js
it('spec name', () => {});
```

改为：

```js
it.only('spec name', () => {});
```
