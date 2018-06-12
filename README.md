<h1 align="center"><img src="https://user-images.githubusercontent.com/13678919/31573203-99ae6894-b0e9-11e7-8a7e-2b26eaff58c6.png"/></h1>

[![NPM Version](https://img.shields.io/npm/v/maptalks.svg)](https://github.com/maptalks/maptalks.js) [![Circle CI](https://circleci.com/gh/maptalks/maptalks.js.svg?style=shield)](https://circleci.com/gh/maptalks/maptalks.js) [![Build status](https://ci.appveyor.com/api/projects/status/r9pb0dhqqq3cdppy/branch/master?svg=true)](https://ci.appveyor.com/project/fuzhenn/maptalks-js) [![Build Status](https://travis-ci.org/maptalks/maptalks.js.svg?branch=master)](https://travis-ci.org/maptalks/maptalks.js) [![codecov](https://codecov.io/gh/maptalks/maptalks.js/branch/master/graph/badge.svg)](https://codecov.io/gh/maptalks/maptalks.js) [![devDependency Status](https://david-dm.org/maptalks/maptalks.js/dev-status.svg)](https://david-dm.org/maptalks/maptalks.js#info=devDependencies)

A light JavaScript library to create integrated 2D/3D maps. 

* **2D/3D**: Integrated 2D/3D maps.
* **Open and pluggable**: Easy to extend with techs you may love as [plugins](https://maptalks.org/plugins.html).
* **Performant**: Can smoothly render tens of thousands of geometries.
* **Simple**: Extremely easy to learn and use.
* **Feature Packed**: Essential features for most mapping needs.
* **SSR**: [Server-Side Rendering](https://github.com/maptalks/maptalks.js/wiki/Server-Side-Rendering)

## The Story

**maptalks.js** was born for a map-centric project to help [YUM! China](http://www.yumchina.com/en/) (the most successful food chain in China) manage and analyze spatial data all over the country for choosing locations of new KFC and PizzaHut restaurants. After verified in many projects of government depts and enterprises, we are glad to open source it, and hoping it can help you deliver better mapping projects.

<a href="http://maptalks.org/maptalks.three/demo/buildings.html" title="maptalks.THREE Demo" target="_blank"><img width="820" src = "https://user-images.githubusercontent.com/13678919/31883619-01963fa6-b81d-11e7-9429-b29641049523.gif" hspace="20"/></a>

## Resources

* [Web Site](http://maptalks.org)
* [A Quick Start](http://maptalks.org/getting-started.html)
* [Examples](https://maptalks.github.io/examples/en/map/load/)
* [API Reference](https://maptalks.github.io/maptalks.js/api/0.x/Map.html)
* [Docs](https://github.com/maptalks/maptalks.js/wiki)
* [Style Reference](https://github.com/maptalks/maptalks.js/wiki/Symbol-Reference)
* [Plugins](http://maptalks.org/plugins.html)
   * [markercluster](https://github.com/maptalks/maptalks.markercluster)
   * [heatmap](https://github.com/maptalks/maptalks.heatmap)
   * [mapbox-gl-js](https://github.com/maptalks/maptalks.mapboxgl)
   * [THREE.js](https://github.com/maptalks/maptalks.three)
   * [echarts](https://github.com/maptalks/maptalks.e3)

## Supported Enviroments

* Modern browsers and IE9+ (only IE11 for 3D features)
* Mobile browsers
* Node >= 4.x (for [Server-Side Rendering](https://github.com/maptalks/maptalks.js/wiki/Server-Side-Rendering))
* Electron

**maptalks** is well tested against IE9, IE10, IE11, Firefox and Chrome by more than 1.6K test cases running on CI services. 

## Install

* Standalone file

Download the [lastest release](https://github.com/maptalks/maptalks.js/releases) and load it in your HTML page like:
```html
<link href="path/to/maptalks.css" rel="stylesheet" type="text/css" />
<script src="path/to/maptalks.min.js" type="text/javascript"></script>
```

* CDN
Just include this in your html:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maptalks/dist/maptalks.min.css">
<script src="https://cdn.jsdelivr.net/npm/maptalks/dist/maptalks.min.js"></script>
```

* NPM

```shell
npm install maptalks --save
```

## Plugin Development

It's easy and joyful to write plugins for maptalks, please check out [the tutorials](https://github.com/maptalks/maptalks.js/wiki) and begin to develop your own. And you are welcome to [share your work](https://github.com/maptalks/maptalks.github.io/issues/new) with us.

## Contributing

We warmly welcome any kind of contributions including issue reportings, pull requests, documentation corrections, feature requests and any other helps.

### Contributing Guide
Please read our [contributing guide](CONTRIBUTING.md) to learn about our development process, how to propose fixes and improvements, and how to test your changes to maptalks.

## Acknowledgments

Maptalks is built on the shoulders of giants. Please refer to [ACKNOWLEDGEMENT](ACKNOWLEDGEMENT) for details.
