# maptalksgl

The WebGL infrastructure for maptalks.

## 初始化

安装lerna
```shell
npm i lerna -g
```
### 安装依赖
```shell
lerna bootstrap --hoist
```
### build打包
```shell
lerna run build
```
### 版本发布
```shell
lerna version
```
### 发布到npm
```shell
lerna publish from-package
```
### 测试
#### 全部测试
```shell
lerna run test
```
#### 单独测试
仍在每个工程下运行 ```npm test```
