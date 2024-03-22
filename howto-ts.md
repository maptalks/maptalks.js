# Typescript 改写指南
## 目的
* 增加代码可读性和可维护性
* 更现代的build flow以及更美观的api文档
* 同步生成d.ts
* 我们不追求完美的ts类型定义，避免难以理解的type定义
* 适当用any解决复杂的类型问题

## 步骤

准备：
fork [maptalks工程](https://github.com/maptalks/maptalks.js)
```shell
git clone https://github.com/[your github 账户名]/maptalks.js.git
git checkout ts-dev
git checkout -b [你的工作分支名]
npm i
```

先重命名，再改写并提交
* 用 git mv 命令将 js 重命名为 ts 文件```git mv Foo.js Foo.ts```
* (重要！)马上提交改动，```git commit```，这里务必马上提交，否则可能会丢失文件的历史记录
* (重要！)检查文件的git历史是否能正常读取
* 改写程序
  * 补充类的成员变量和类型说明，但只在 include mixin 中用到的成员变量无需声明
  * 补充函数的参数和返回值类型，如果类型不存在则定义新的类型
* 改写注释（API文档内容）
  * 遵从[typedoc](https://www.typedoc.cn/guides/overview/)的注释规则
  * 类的中文说明，原英文说明上增加 ```@english```，[示例](https://github.com/maptalks/maptalks.js/blob/ts-dev/src/handler/Handler.ts#L6)
  * 函数中文说明，原英文说明上增加 ```@english``` 标签，[示例](https://github.com/maptalks/maptalks.js/blob/ts-dev/src/core/Eventable.ts#L34)
    * 如果函数在include mixin里，注释里需要增加 @memberOf 标签，[示例](https://github.com/maptalks/maptalks.js/blob/ts-dev/src/map/Map.Collision.ts#L21)，用于告诉typedoc该方法的归属
  * 补充参数说明，英文，如果已有jsdoc @param注释，删去原来{}中的类型定义，[示例](https://github.com/maptalks/maptalks.js/blob/ts-dev/src/core/Eventable.ts#L39)
  * 类的注释中补充事件(event) 说明，英文，事件定义用 [@event 标签](https://typedoc.org/tags/event/)，[示例](https://github.com/maplibre/maplibre-gl-js/blob/e32f16056dcc42a05bd3b2b451afa06dbbd59357/src/source/source.ts)
    * 事件在程序中是用[fire方法抛出的](https://github.com/maptalks/maptalks.js/blob/ts-dev/src/map/Map.js#L1547)，大部分有jsdoc的@event注释，事件名以下划线开头的为内部事件，不需要说明
* 运行 ```npm run lint```，修改可能的错误
* 运行 ```npm run build```，修改可能的错误
* (重要！)提交修改，再次检查文件的git历史是否能正常读取
* push到远程分支，创建pr（提交到ts-dev分支）
* 等待ci测试结果，如果测试失败则修改错误
* 通知其他成员，对该文件的改写进行简单的代码评审
* 重复上述步骤，继续下一个文件的重命名与改写
* 全部文件改写完成后，合并到ts-dev分支

## 改写原则
* 所有函数参数应明确指明类型
* 除非能明确自动推导，函数返回值应明确指明类型
```ts
config(conf?: string | ClassOptions, value?: any): ClassOptions | this
```
* 如果函数参数或返回值没有现成的类型，则定义新的type，[示例](https://github.com/maptalks/maptalks.js/blob/ts-dev/src/renderer/layer/ImageGLRenderable.ts#L16)
* 函数内部如果有类型错误，如果变量类型不是现有类型，[默认用 (foo as any) 解决](https://github.com/maptalks/maptalks.js/blob/ts-dev/src/renderer/layer/ImageGLRenderable.ts#L140)

## type定义原则
* 应该简单易理解，除了 &，避免使用其他type运算符
* type定义如果很长（例如某些类的options），写到ts文件末尾

## 如何改写include mixin

### 作用

include mixin的作用是将逻辑过长的类（以Map为例）拆分为若干文件，增加可读性。

例如 [Map.Collision.ts](https://github.com/maptalks/maptalks.js/blob/ts-dev/src/map/Map.Collision.ts)，利用了[include静态方法](https://github.com/maptalks/maptalks.js/blob/ts-dev/src/core/Class.ts#L240)将对象中定义的函数注入到Map的prototype上，定义为成员函数。

### mixin方法如何与主类关联？以Map.js为例

参考资料： https://github.com/basarat/typescript-book/issues/167

步骤：

* 在```class Map``` 前面增加export声明
* 在Map.js末尾增加 ```export default Map```
* 在mixin代码中，用declare module 结合 interface 的同名合并来注入方法声明，具体可以参考 [Map.Collision.ts](https://github.com/maptalks/maptalks.js/blob/ts-dev/src/map/Map.Collision.ts) 中的写法。
* 只声明函数，只在mixin中用到的成员变量无需声明，类型定义为any即可
