describe('gltflayer set style', function () {
    let map;
    beforeEach(function() {
        map = createMap();
    });

    afterEach(function() {
        removeMap(map);
    });
    it('setUrl', () => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        const marker = new maptalks.GLTFGeometry(center, { symbol: { url: url1 }}).addTo(gltflayer);
        marker.once('load', () => {
            const renderer = gltflayer.getRenderer();
            const gltfManager = renderer.regl.gltfManager;
            marker.setUrl(url2);
            marker.once('load', () => {
                const resource1 = gltfManager.getGLTF(url1);
                expect(resource1).not.to.be.ok();
                const resource2 = gltfManager.getGLTF(url2);
                expect(resource2.refCount).to.be.eql(1);
                done();
            });
        });
    });

    it('update url for marker when setting style for gltflayer', () => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        const marker1 = new maptalks.GLTFGeometry(center, { properties: { count: 100 }}).addTo(gltflayer);
        const marker2 = new maptalks.GLTFGeometry(center, { properties: { count: 200 }}).addTo(gltflayer);
        gltflayer.setStyle([
            {
                'filter': ['==', 'count', 100],
                'symbol': {
                    scaleX: 0.5,
                    scaleY: 0.5,
                    scaleZ: 0.5,
                    url: url1
                }
            },
            {
                'filter': ['==', 'count', 200],
                'symbol': {
                    scaleX: 2,
                    scaleY: 2,
                    scaleZ: 2,
                    url: url2
                }
            }
        ]);
        expect(marker1.getUrl()).to.be.eql(url1);
        expect(marker2.getUrl()).to.be.eql(url2);
        expect(marker1.getScale()).to.be.eql([0.5, 0.5, 0.5]);
        expect(marker2.getScale()).to.be.eql([2, 2, 2]);
    });

    it('setStyle and getStyle', () => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        const style = [
            {
                'filter': ['==', 'count', 100],
                'symbol': {
                }
            },
            {
                'filter': ['==', 'count', 200],
                'symbol': {
                }
            }
        ];
        gltflayer.setStyle(style);
        const layerStyle = gltflayer.getStyle();
        expect(JSON.stringify(style)).to.be.eql(JSON.stringify(layerStyle));
    });

    it('process root url when setting style for gltflayer', () => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        const style = {
            $root: 'basePath',
            studio: {
                info: 'info'
            },
            style: [
                {
                    'filter': ['==', 'count', 100],
                    'symbol': {
                        url: '{$root}/a.gltf'
                    }
                },
                {
                    'filter': ['==', 'count', 200],
                    'symbol': {
                        url: '{$root}/b.gltf'
                    }
                }
            ]
        };
        gltflayer.setStyle(style);
        const layerStyle = gltflayer.getStyle();
        expect(JSON.stringify(style)).to.be.eql(JSON.stringify(layerStyle));
        const url1 = layerStyle.style[0].symbol.url;
        expect(url1).to.be.eql('{$root}/a.gltf');
        const url2 = layerStyle.style[1].symbol.url;
        expect(url2).to.be.eql('{$root}/b.gltf');
    });

    it('style with $root', () => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        const style = {
            $root: '',
            style: [
                {
                    'filter': ['==', 'count', 100],
                    'symbol': {
                        url: '{$root}/a.gltf'
                    }
                },
                {
                    'filter': ['==', 'count', 200],
                    'symbol': {
                        url: '{$root}/b.gltf'
                    }
                }
            ]
        };
        gltflayer.setStyle(style);
        const layerStyle = gltflayer.getStyle();
        expect(JSON.stringify(style)).to.be.eql(JSON.stringify(layerStyle));
    });

    it('support both root structure and none root structure for setStyle method', () => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        //{$root, style}
        const style1 = {
            $root: 'basePath',
            style: [
                {
                    'filter': ['==', 'count', 100],
                    'symbol': {
                        url: '{$root}/a.gltf'
                    }
                },
                {
                    'filter': ['==', 'count', 200],
                    'symbol': {
                        url: '{$root}/b.gltf'
                    }
                }
            ]
        };
        //[{filter, symbol}]
        const style2 = [
            {
                'filter': ['==', 'count', 100],
                'symbol': {
                    url: 'a.gltf'
                }
            },
            {
                'filter': ['==', 'count', 200],
                'symbol': {
                    url: 'b.gltf'
                }
            }
        ];
        gltflayer.setStyle(style1);
        gltflayer.setStyle(style2);
    });

    it('setStyle without parameters will reset the layer\'s style to default', () => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        new maptalks.GLTFGeometry(center).addTo(gltflayer);
        const style = [
            {
                'filter': ['==', 'count', 100],
                'symbol': {
                    url: url1
                }
            },
            {
                'filter': ['==', 'count', 200],
                'symbol': {
                    url: url2
                }
            }
        ];
        gltflayer.setStyle(style);
        let layerStyle = gltflayer.getStyle();
        expect(JSON.stringify(layerStyle)).to.be.eql(JSON.stringify(style));
        gltflayer.setStyle();
        layerStyle = gltflayer.getStyle();
        expect(layerStyle).not.to.be.ok();
    });

    it('setStyle and setSymbol', () => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        const marker1 = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url1
            },
            properties: {
                count: 100
            }
        }).addTo(gltflayer);
        const marker2 = new maptalks.GLTFGeometry(center, {
            properties: {
                count: 200
            }
        }).addTo(gltflayer);
        const marker3 = new maptalks.GLTFGeometry(center, {
            properties: {
                count: 300
            }
        }).addTo(gltflayer);
        const marker4 = marker2.copy().addTo(gltflayer);
        marker4.setProperties({
            count: 300
        });
        gltflayer.setStyle([
            {
                'filter': ['==', 'count', 100],
                'symbol': {
                    uniforms:{
                        'lightAmbient': [0.8, 0.5, 0.2]
                    },
                    'scale':[1.5, 1.5, 1.5]
                }
            },
            {
                'filter': ['==', 'count', 200],
                'symbol': {
                    uniforms:{
                        'lightAmbient': [0.2, 0.8, 0.5]
                    },
                    'scale':[2, 2, 2]
                }
            },
            {
                'filter': ['==', 'count', 300],
                'symbol': {
                    uniforms:{
                        'lightAmbient': [0.2, 0.5, 0.8]
                    },
                    'scale':[3, 3, 3]
                }
            }
        ]);
        expect(marker2.getUniform('lightAmbient')).to.be.eql([0.2, 0.8, 0.5]);
        expect(marker3.getUniform('lightAmbient')).to.be.eql([0.2, 0.5, 0.8]);
        expect(marker4.getUniform('lightAmbient')).to.be.eql([0.2, 0.5, 0.8]);
        marker1.setSymbol({
            url: url1,
            uniforms: {
                'lightAmbient': [0.8, 0.5, 0.2]
            }
        });
        expect(marker1.getUniform('lightAmbient')).to.be.eql([0.8, 0.5, 0.2]);
        //When setting style for gltflayer, add test for toJSON
        const json = gltflayer.toJSON();
        expect(json.style).to.be.ok();
    });

    it('updateSymbol', () => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url1
            }
        }).addTo(gltflayer);
        marker.updateSymbol({
            animation: true,
            loop: true,
            speed: 2.0,
            translationX: 10,
            translationY: 10,
            translationZ: 10,
            rotationY: 60,
            scaleX: 2,
            scaleY: 2,
            scaleZ: 2,
            shader: 'wireframe',
            uniforms: {
                'lightAmbient': [0.8, 0.5, 0.2]
            }
        });
        expect(marker.isAnimationLooped()).to.be.ok();
        expect(marker.getAnimationSpeed()).to.be.eql(2.0);
        expect(marker.getShader()).to.be.eql('wireframe');
        expect(marker.getUniform('lightAmbient')).to.be.eql([0.8, 0.5, 0.2]);
    });

    it('setStyle before layer addding to map', () => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const marker = new maptalks.GLTFGeometry(center, {
            properties:{
                count: 200
            }
        }).addTo(gltflayer);
        gltflayer.setStyle([{
            'filter': ['==', 'count', 100],
            'symbol': {
                shader: 'phong'
            }
        },
        {
            'filter': ['==', 'count', 200],
            'symbol': {
                shader: 'pbr'
            }
        }
        ]);
        gltflayer.addTo(map);
        //TODO marker的symbol是否正确
        const symbol = marker.getSymbol();
        expect(symbol.shader).to.be.eql('pbr');
    });

    it('gltflayer\'s modelload event', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        const marker1 = new maptalks.GLTFGeometry(center, { symbol: { url: url1 }});
        const marker2 = new maptalks.GLTFGeometry(center, { symbol: { url: url2 }});
        gltflayer.on('modelload', (e) => {
            const models = gltflayer.getGLTFUrls();
            expect(e.models).to.be.ok();
            expect(models['pyramid']).not.to.be.ok();
            expect(models.length).to.be.eql(2);
            done();
        });
        gltflayer.addGeometry(marker1);
        gltflayer.addGeometry(marker2);
    });

    it('load glb model', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
        const marker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url3
            }
        });
        marker.on('load', e => {
            expect(e.data).to.be.ok();
            done();
        });
        gltflayer.addGeometry(marker);
    });

    it('function types for symbol', (done) => {
        const layer = new maptalks.GLTFLayer('layer').addTo(map);
        const gltfMarker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url1,
                scaleX: {
                    stops: [
                        [5, 20],
                        [10, 10],
                        [15, 1]
                    ]
                },
                uniforms: {
                    opacity: {
                        stops: [
                            [5, 0.1],
                            [10, 0.5],
                            [15, 1.0]
                        ]
                    }
                }
            }
        });
        layer.addGeometry(gltfMarker);
        const handler = () => {
            const scale = gltfMarker.getScale();
            const opacity = gltfMarker.getUniforms().opacity;
            expect(scale).to.be.eql([6.4, 1, 1]);
            expect(opacity).to.be.eql(0.7);
            map.off('zoomend', handler);
            done();
        };
        map.on('zoomend', handler);
        map.setZoom(12);
    });

    it('hasFunctionDefinition', (done) => {
        const layer = new maptalks.GLTFLayer('layer').addTo(map);
        const gltfMarker = new maptalks.GLTFGeometry(center, {
            symbol: {
                url: url1,
                scaleX: 1,
                scaleY: 1,
                scaleZ: 1
            }
        });
        layer.addGeometry(gltfMarker);
        const hasFuncDefinition = gltfMarker.hasFunctionDefinition();
        expect(hasFuncDefinition).not.to.be.ok();
        gltfMarker.updateSymbol({
            scaleX: {
                stops: [
                    [5, 20],
                    [10, 10],
                    [15, 5]
                ]
            }
        });
        //TODO 判断scaleX是否正确
        expect(gltfMarker.getSymbol().scaleX).to.be.eql(5);
        map.setZoom(8);
        map.on('zoomend', () => {
            expect(gltfMarker.getSymbol().scaleX).to.be.eql(14);
            done();
        });
    });

    it('save properties when toJSON', () => {
        const layer = new maptalks.GLTFLayer('layer').addTo(map);
        const gltfmarker = new maptalks.GLTFGeometry(center, {
            properties: {
                'num':0.2
            }
        }).addTo(layer);
        const json = gltfmarker.toJSON();
        const newMarker = maptalks.GLTFMarker.fromJSON(json);
        const prop = newMarker.getProperties();
        expect(prop).to.be.ok();
        expect(prop.num).to.be.eql(0.2);
    });

    it('setUrl with simple model', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        const marker = new maptalks.GLTFGeometry(center, { symbol: { url: url1 }}).addTo(gltflayer);
        setTimeout(() => {
            marker.setUrl('pyramid');
            done();
        }, 100);
    });

    it('getGLTFUrls', done => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        new maptalks.GLTFGeometry(center, { symbol: { url: url1 }}).addTo(gltflayer);
        new maptalks.GLTFGeometry(center, { symbol: { url: url2 }}).addTo(gltflayer);
        new maptalks.GLTFGeometry(center, { symbol: { url: url2 }}).addTo(gltflayer);
        gltflayer.on('modelload', () => {
            const gltfUrls = gltflayer.getGLTFUrls();
            expect(gltfUrls.length).to.be.eql(2);
            done();
        });
    });


    it('set style for gltflayer many times', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltflayer').addTo(map);
        const marker1 = new maptalks.GLTFGeometry(center, { properties: { count: 100 }}).addTo(gltflayer);
        const marker2 = new maptalks.GLTFGeometry(center, { properties: { count: 200 }}).addTo(gltflayer);
        gltflayer.setStyle([
            {
                'filter': ['==', 'count', 100],
                'symbol': {
                    scaleX: 0.5,
                    scaleY: 0.5,
                    scaleZ: 0.5,
                    url: url1
                }
            },
            {
                'filter': ['==', 'count', 200],
                'symbol': {
                    scaleX: 2,
                    scaleY: 2,
                    scaleZ: 2,
                    url: url2
                }
            }
        ]);
        expect(marker1.getUrl()).to.be.eql(url1);
        expect(marker2.getUrl()).to.be.eql(url2);
        expect(marker1.getScale()).to.be.eql([0.5, 0.5, 0.5]);
        expect(marker2.getScale()).to.be.eql([2, 2, 2]);
        setTimeout(() => {
            gltflayer.setStyle([
                {
                    'filter': ['==', 'count', 200],
                    'symbol': {
                        scaleX: 0.5,
                        scaleY: 0.5,
                        scaleZ: 0.5,
                        url: url1
                    }
                },
                {
                    'filter': ['==', 'count', 100],
                    'symbol': {
                        scaleX: 2,
                        scaleY: 2,
                        scaleZ: 2,
                        url: url2
                    }
                }
            ]);
            expect(marker1.getUrl()).to.be.eql(url2);
            expect(marker2.getUrl()).to.be.eql(url1);
            done();
        }, 100);
    });

    it('updateSymbol for layer', (done) => {
        const layer = new maptalks.GLTFLayer('layer').addTo(map);
        const gltfMarker = new maptalks.GLTFGeometry(center, {
            properties: {
                num: 1.5
            }
        }).addTo(layer);
        const style = [{
            'filter': ['<', 'num', 1],
            'symbol': {
                'url':url2,
                'scale': [1, 1, 1],
                'uniforms': {
                    'lightAmbient': [1, 1, 1],
                    'opacity': 1
                }
            },
        },
        {
            'filter': ['>', 'num', 1],
            'symbol': {
                'url':url3,
                'scale': [1, 1, 1],
                'uniforms': {
                    'lightPosition': [1, 1, 1],
                    'lightAmbient': [1, 1, 1],
                    'lightDiffuse': [0.5, 0.5, 0.5],
                    'lightSpecular': [0.1, 0.7, 0.3],
                    'ambientStrength': 0.5,
                    'specularStrength': 0.8,
                    'materialShininess': 32,
                    'opacity': 1
                }
            }
        }];
        layer.setStyle(style);
        let url = gltfMarker.getUrl();
        const scale = gltfMarker.getScale();
        expect(url).to.be.eql(url3);
        expect(scale).to.be.eql([1, 1, 1]);
        setTimeout(() => {
            layer.updateSymbol(1, {
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2,
                url: url1
            });
            url = gltfMarker.getUrl();
            expect(url).to.be.eql(url1);
            done();
        }, 1 * 1000);
    });
});
