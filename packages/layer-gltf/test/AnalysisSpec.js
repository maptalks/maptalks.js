describe('add analysis', () => {
    const modelUrl = 'models/terrain/terrain.glb';
    let map;
    beforeEach(function() {
        map = createMap();
    });

    afterEach(function() {
        removeMap(map);
    });
    it('add ViewShedAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
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
            viewshedAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 2, 2);
                expect(pixelMatch([224, 45, 45, 255, 224, 45, 45, 255, 224, 45, 45, 255, 224, 45, 45, 255], pixel1)).to.be.eql(true);//不可视区域颜色
                const pixel2 = pickPixel(map, 260, 115, 2, 2);
                expect(pixelMatch([45, 223, 45, 255, 45, 223, 45, 255, 45, 223, 45, 255, 45, 223, 45, 255], pixel2)).to.be.eql(true);//可视区域颜色
                const vertexCoordinates = viewshedAnalysis.getVertexCoordinates();
                expect(vertexCoordinates[0].x).to.be.eql(0);
                expect(vertexCoordinates[0].y).to.be.eql(-0.001763269806815515);
                expect(vertexCoordinates[0].z).to.be.eql(228.49549);
                expect(vertexCoordinates[1].x).to.be.eql(0);
                expect(vertexCoordinates[1].y).to.be.eql(0.001763269806815515);
                expect(vertexCoordinates[1].z).to.be.eql(228.49549);
                expect(vertexCoordinates[2].x).to.be.eql(0);
                expect(vertexCoordinates[2].y).to.be.eql(0.001763269806815515);
                expect(vertexCoordinates[2].z).to.be.eql(228.49549);
                expect(vertexCoordinates[3].x).to.be.eql(0);
                expect(vertexCoordinates[3].y).to.be.eql(-0.001763269806815515);
                expect(vertexCoordinates[3].z).to.be.eql(228.49549);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('add FloodAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl, //TODO,模型改成小一点的模型
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const floodAnalysis = new maptalks.FloodAnalysis({
                waterHeight: 10,
                waterColor: [0.1, 0.5, 0.6]
            });
            floodAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 2, 2);
                expect(pixelMatch([101, 142, 152, 255, 101, 142, 152, 255, 101, 142, 152, 255, 101, 142, 152, 255], pixel1)).to.be.eql(true);//水淹区颜色
                const pixel2 = pickPixel(map, map.width / 2, map.height / 2 - 80, 2, 2);
                expect(pixelMatch([158, 158, 158, 255, 157, 157, 157, 255, 157, 157, 157, 255, 157, 157, 157, 255], pixel2)).to.be.eql(true);//非水淹区颜色
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });


    it('add SkylineAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            map.setCenter([0.00007795844737756852, -0.002186416483624498]);
            map.setPitch(77.6);
            map.setZoom(18.9778);
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, 145, 36, 1, 1);
                expect(pixelMatch([143, 29, 0, 255], pixel1)).to.be.eql(true);//天际线颜色
                const pixel2 = pickPixel(map, 200, 80, 1, 1);
                expect(pixelMatch([153, 153, 153, 255], pixel2)).to.be.eql(true);//无天际线颜色
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('add InSightAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const inSightAnalysis = new maptalks.InSightAnalysis({
                lines: [{
                    from: [center.x, center.y, 0],
                    to: [center.x + 0.05, center.y + 0.05, 20]
                }],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            });
            inSightAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, 302, 47, 1, 1);
                expect(pixelMatch([255, 0, 0, 255], pixel1)).to.be.eql(true);//非通视区颜色
                const pixel2 = pickPixel(map, 249, 100, 1, 1);
                expect(pixelMatch([0, 255, 0, 255], pixel2)).to.be.eql(true);//通视区颜色
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('add CutAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const cutAnalysis = new maptalks.CutAnalysis({
                position: [center.x, center.y, 0],
                rotation: [45, 90, 45],
                scale: [1, 1, 1]
            });
            cutAnalysis.addTo(gllayer);
            setTimeout(function() {
                const renderer = gltflayer.getRenderer();
                const meshes = renderer.getAnalysisMeshes();
                const tempMap = cutAnalysis.exportAnalysisMap(meshes);
                const index = (map.height / 2) * map.width * 4 + (map.width / 2) * 4;
                const arr = tempMap.slice(index, index + 16);
                expect(pixelMatch([0, 0, 0, 25, 0, 0, 0, 25, 0, 0, 0, 25, 0, 0, 0, 25], arr)).to.be.eql(true);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('add ExcavateAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const boundary = [[ -0.0008475780487060547, 0.000815391540498922],
                [-0.0013518333435058594, 0.00009655952453613281],
                [-0.0004184246063232422, -0.0005686283111288049],
                [0.0005471706390380859, 0.00006437301638584358],
                [0.0005042552947998047, 0.0006651878356649377]];
            const excavateAnalysis = new maptalks.ExcavateAnalysis({
                boundary,
                textureUrl: './resources/ground.jpg'
            });
            excavateAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);
                const pixel2 = pickPixel(map, 270, 100, 1, 1);
                expect(pixelMatch([120, 98, 85, 255], pixel1)).to.be.eql(true);//挖方区颜色
                expect(pixelMatch([255, 255, 255, 255], pixel2)).to.be.eql(true);//非挖方区颜色
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('add HeightLimitAnalysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const heightLimitAnalysis = new maptalks.HeightLimitAnalysis({
                limitHeight: 15,
                limitColor: [0.9, 0.2, 0.2]
            });
            heightLimitAnalysis.addTo(gllayer);
            setTimeout(function() {
                const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);//未超过高度阈值的颜色
                const pixel2 = pickPixel(map, 160, 150, 1, 1);//超过高度阈值颜色
                expect(pixelMatch([151, 151, 151, 255], pixel1)).to.be.eql(true);
                expect(pixelMatch([179, 107, 107, 255], pixel2)).to.be.eql(true);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('update', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
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
        viewshedAnalysis.addTo(gllayer);
        setTimeout(() => {
            viewshedAnalysis.update('eyePos', [center.x - 0.01, center.y + 0.01, 10]);
            viewshedAnalysis.update('lookPoint', [center.x + 0.01, center.y - 0.01, 0]);
            viewshedAnalysis.update('verticalAngle', 45);
            viewshedAnalysis.update('horizontalAngle', 30);
            setTimeout(function() {
                testColor();
            }, 100);
        }, 100);

        function testColor() {
            const pixel1 = pickPixel(map, map.width / 2, map.height / 2, 1, 1);//不可视区域的颜色
            const pixel2 = pickPixel(map, 120, 80, 1, 1);//可视区域颜色
            expect(pixelMatch([224, 45, 45, 255], pixel1)).to.be.eql(true);
            expect(pixelMatch([44, 222, 44, 255], pixel2)).to.be.eql(true);
            done();
        }
        gllayer.addTo(map);
    });

    it('export result image by skylineAanalysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            map.setCenter([0.00007795844737756852, -0.002186416483624498]);
            map.setPitch(77.6);
            map.setZoom(18.9778);
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            setTimeout(function() {
                const base64 = skylineAnalysis.exportSkylineMap({
                    save: false
                });
                const expectedBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAEsCAYAAADtt+XCAAAAAXNSR0IArs4c6QAAE1ZJREFUeF7t3cuuI1cVBuDdIY24hEkESkDJAAZIZEC4PAJIDGEKvAY8BELKWyBeAqbMCJcBSBGXAQgSCWVCCFE6F7R1ukRhfOzyrtW2y/93Rul01Tpe3yrXXze7HzQ/BAgQIEBgQOBBa+3DgfWsQoAAAQLhAgIkfAPQPgECBEYFBMionPUIECAQLiBAwjcA7RMgQGBUQICMylmPAAEC4QICJHwD0D4BAgRGBQTIqJz1CBAgEC4gQMI3AO0TIEBgVECAjMpZjwABAuECAiR8A9A+AQIERgUEyKic9QgQIBAuIEDCNwDtEyBAYFRAgIzKWY8AAQLhAgIkfAPQPgECBEYFBMionPUIECAQLiBAwjcA7RMgQGBUQICMylmPAAEC4QICJHwD0D4BAgRGBQTIqJz1CBAgEC4gQMI3AO0TIEBgVECAjMpZjwABAuECAiR8A9A+AQIERgUEyKic9QgQIBAuIEDCNwDtEyBAYFRAgIzKPV7v1Zda+9rvVhaxOgECBDYoIEBWDu31l1v72yMhspLR6gQIbFBAgAwOrZ95/PAvrf3kC6099WFrf31PiAxSWo0AgY0KCJDBwfUA+dzD1t54t7UfvdHaKy86ExmktBoBAhsVECCDg5sC5Pt/au25hwJkkNFqBAhsWECADA5vuoT183+29r1nW/vB8y5hDVJajQCBjQoIkBMHNz11dV+AeCrrRFCLEyCwWQEBcuLopqeuvvjR1j72kda+9VprP/18a88+bO2d91v79h9b62clfggQIHDrAgJk4YSnM46++HTP47mnW/vma6298kJrn33Y2i/ebu07f2jtG59q7ccvuqS1kNZiBAhsVECALBzcdNN8emS3P8Lbf6azjd98qbXnPpr5SK/Ldgs3IosRuDEBAXLiQN/7emtvPrpb6e+PWnv59631HegLT9/9v0881dozvz6x6IYXn4LVhyk3PEQvncCggAA5Ea7vMPvPlz9+FyTf/fPdn3/2xdb+9X5WeLz1ldbe/qC1Dx7cnXn18HztXZfuTtykLE5gswICZHB0085zCpD+ifSko/De/yc/cof3q3+39tWP3/33+6213/5biAxuVlYjsCkBATIwrn4W0s9A+v7zwS9b609m9RvqfUea8MWK8/CYzrrmJp007WxsYDOyCoHNCwiQgRH2nWU/4p6OtnuJ/uc33rv9s5B94TERdpf+ePN0ZiJEBjYuqxDYkIAAOXFY003j+RnHdPT9jxsPkEPhMWdcutyJ9BYnQODKBATIiQOZAqSv9syDu5vm8/93q/dBTg2FU5c/cQwWJ0DgCgQEyIlDmJ+B9EtYT//y9gNkumR36r2N3RvtCfeHTtycLE5g0wICZHB8/fMg/SZ6v+/x/G/ubqT3n1s7A5kH5sg9jSlEEu4PDW5KViOwWQEBMji6vmPs34XV73tMAfLpp+++D6t/FmL3Z6tH31OA9N5GHs9NuT80uBlZjcCmBQTI4PjmO8YpQPqN9X5Zq4fK7k8/M+k/WwuStfd31q4/OB6rESBwBgEBMoA8f1x1fmlmuow1L9mP3B9/3u5/HvvdSpCsDYC16w+MxyoECJxJQICcAD3/GpMpFOYfHpz+fl/J6YOH/e+29GnttQGwdv0TxmNRAgTOLCBAFoDvC45TQ2BfjZGb0gtebukiawNg7fqlzShGgECpgAA5wHkoOEbvZ2zt09prA2Dt+qVbu2KbEzh0Vj81s5XLwZvDX/CCBcg9SLvf7TT/2pKKDXYrH7RbGwBr11+wDVvkxgTmofG5h8ebu7VH5493fD1LCJA9s5jv3KuDY/7rthAiawNg7fpL3yrznU5FwC/9vZarE5hm2ENj9+GTfU82zpfZwuXgOqnrqSRAZrPYd3npSf/7FtceImsDYO36971Vdi9tzI9Up0emRy8zXs/b8/ZfyXyOuw+aTN8td0jBl3dedhsRII/9dy9ZnfOI5ppDZG0ArF1/9+0xP0rtfzc/Cu2PVPfP4vSf6fM4Lm9cdgdz7ABg39lG/8Dq9LPkbPKa3z/XqV/3quIDZPes49Snq6pGca1vgrUBsHb97nvsKLUvMz/r2N0pnfNgoGp7uNU69z2YMj/bWBIauz6+d+0yW0x0gOw763jSl6wOjfka3gS7l4b6JYLpK1tGjuanABn5KpRD18TnR6m7l6qm9XYvb1xytpd5e1/Pbz32RGPF5Ubfu3b+eccGyL4b5SNHPtUjm17XOc6E9j0iufvUy3SJaPTLEKcA6ZeWlp4JVB6lXuucq7eba613LDgq33PTAeGt/7s81zTryADZvVx0TUem87OipTvcpRvUoRvPx5566d/3NfrTf+/0b6Yf6unYzmb0KPXazjRHHbey3qFLjtOZY2VwTC5rzna3YnttrzMuQK71XsN8w5jvcNf8O+v3BcahsJjfS5i/prVv+PtC+1w7m/vudY2G0jnfyPvOFPf9/rUzWtvTkkuOT/I1zs9217xv1jokrR8TILs7kOqj++qNZvRS1nxnM12Oui8w9oXFk3yD77ucdOgpnCfxWnbPRuaf8zlnmCwNhf6alnyYri93X/jvbpuVrscecDj3t1BPB1+jl1yr38e3Xi8iQPZdwuj/FO01/8xf87Gjqd3QWBoYlTuSpZZTX28+au2DB6099WFrzz68+wr8c+1sltxjWbPTXRIOS0Lh2GXF6TUuXW5a/lDQHNom7rtndt83Tp8zkOeXsfrnSdwHWfqOXLfczQfIlm+iTkdT991QP3TJYN+HsC4RGPs2z/nrvuSH/o75zV/70qP7Y2cMp+7sTzmzOBZKS373oT7n9ffVOtcBwKFd3nQZa3K7lm1+3W76ete+6QC55pvlSzaJfTfUl14yuMTR35Ke5sv0Xq7hDb7vst/I0f2SHfSSs4DRs58lZz73Bdyh1770ntm1zHIKupHHzk/dhtOXv9kA2cLN8iUb3/yGer9v89aH//89Qad+cnfJ701d5r6d8LGj+1PPVi65sz0UNIf6PPc9s5Ft8NgZyLUctIz0do3r3GSA3Ep4TBtM7+ftDy53z+AaN9xzv6alR/dbOPM7dgnovr+/ZOgtnfdugOyu1wPykpdNl/axleVuLkBuLTymDWl6Y9j4t/LW8jovITC9T/plt3cen7H319H/fN+DG1sIxktYLvmdNxUgtxoe8xCxsS/ZrC2TKjAFSH+6r/985uF/v1iz/7kfgPmutLqt4yYCpG80vta5bqNQicDWBV5/+a6D3fs2/QBsuhxpn7F+yg9efak9zur1xS5VYf7vCFz7BwQvZeT3EkgSmELi2Bn7vic1k5zW9vrg9Ze3GyD7PsB0bINZC2Z9AgRuS2D3s2L7/vXD2+q4rptNB8jEcA0fYKobiUoECJxbYP701rl/95Z/301cwnLWseVN0GsncB0CpzyqfR2v+PKv4iZuol+e0SsgQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAiIEBKGBUhQIBAnoAAyZu5jgkQIFAi8B92m+tcTwamDgAAAABJRU5ErkJggg==';
                expect(base64).to.be.eql(expectedBase64);
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('remove skylineAnalysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            map.setCenter([0.00007795844737756852, -0.002186416483624498]);
            map.setPitch(77.6);
            map.setZoom(18.9778);
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            setTimeout(function() {
                skylineAnalysis.remove();
                const pixel = pickPixel(map, 145, 36, 1, 1);
                expect(pixelMatch([143, 29, 0, 255], pixel)).to.be.eql(false);//无天际线颜色
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('enable and disable analysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
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
            viewshedAnalysis.addTo(gllayer);
            viewshedAnalysis.enable();
            setTimeout(() => {
                const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);//enable后的颜色
                expect(pixelMatch([224, 45, 45, 255], pixel)).to.be.eql(true);
                viewshedAnalysis.disable();
                setTimeout(function() {
                    const pixel = pickPixel(map, map.width / 2, map.height / 2, 1, 1);//disable后的颜色
                    expect(pixelMatch([151, 151, 151, 255], pixel)).to.be.eql(true);
                    done();
                }, 100);
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('calculate volume for excavate analysis', (done) => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig }).addTo(map);
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        map.on('click', e => {
            console.log([e.coordinate.x, e.coordinate.y]);
        });
        marker.on('load', () => {
            const boundary = [[-0.00021457672119140625, 0.00019311904907226562], [-0.0000858306884765625, 0.000171661376953125], [-0.00007510185241699219, 0.00007510185241699219], [-0.00021457672119140625, 0.00008583068850498421]];
            const excavateAnalysis = new maptalks.ExcavateAnalysis({
                boundary,
                textureUrl: './resources/ground.jpg',
                height: -10
            });
            excavateAnalysis.addTo(gllayer);
            setTimeout(function() {
                const volume = excavateAnalysis.getVolume();
                expect(volume).to.be.eql(137.16457420476468);
                done();
            }, 500);
        });
    });

    it('update boundary for crosscut analysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const crosscutAnalysis = new maptalks.CrossCutAnalysis({
                cutLine: [[ -0.000847, 0.000815],
                    [-0.001351, 0.0000965],
                    [-0.000418, -0.000568]],
                cutLineColor: [0.0, 1.0, 0.0, 1.0]
            }).addTo(gllayer);
            crosscutAnalysis.addTo(gllayer);
            setTimeout(function() {
                crosscutAnalysis.update('cutLine', [[ -0.00084, 0.00082],
                    [-0.001355, 0.0000960],
                    [-0.00042, -0.00057]]);
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('add more than one analysis task, and then disable one of this', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            //skyline analysis
            const skylineAnalysis = new maptalks.SkylineAnalysis({
                lineColor: [1.0, 0.2, 0.0],
                lineWidth: 1.8
            });
            skylineAnalysis.addTo(gllayer);
            //viewshed analysis
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
            viewshedAnalysis.addTo(gllayer);
            skylineAnalysis.disable();
            done();
        });
        gllayer.addTo(map);
    });

    it('exclude layers', done => {
        const gltflayer1 = new maptalks.GLTFLayer('gltf1');
        const gltflayer2 = new maptalks.GLTFLayer('gltf2');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer1, gltflayer2], { sceneConfig });
        const marker1 = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer1);
        new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scale: [1, 1, 1]
            }
        }).addTo(gltflayer1);
        marker1.on('load', () => {
            const boundary = [[ -0.00084, 0.00081],
                [-0.00135, 0.00009],
                [-0.00041, -0.00056],
                [0.00054, 0.00006],
                [0.0005, 0.00066]];
            const excavateAnalysis = new maptalks.ExcavateAnalysis({
                boundary,
                textureUrl: './resources/ground.jpg',
                excludeLayers: ['gltf2'] //不参与被开挖图层的id
            });
            excavateAnalysis.addTo(gllayer);
            setTimeout(function() {
                const renderer = gltflayer1.getRenderer();
                const meshes = renderer.getAnalysisMeshes();
                const tempMap = excavateAnalysis.exportAnalysisMap(meshes);
                const index = (map.height / 2) * map.width * 4 + (map.width / 2) * 4;
                const arr = tempMap.slice(index, index + 16);
                expect(pixelMatch([122, 99, 83, 255, 157, 131, 114, 255, 134, 117, 101, 255, 122, 92, 81, 255], arr));
                done();
            }, 500);
        });
        gllayer.addTo(map);
    });

    it('add more than one insight lines', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const inSightAnalysis = new maptalks.InSightAnalysis({
                lines: [{
                    from: [center.x, center.y, 0],
                    to: [center.x + 0.05, center.y + 0.05, 20]
                }],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            });
            inSightAnalysis.addTo(gllayer);
            inSightAnalysis.addLine({
                from: [center.x, center.y, 10],
                to: [center.x - 0.03, center.y - 0.05, 20],
            });
            setTimeout(function() {
                const pixel1 = pickPixel(map, 302, 47, 1, 1);
                expect(pixelMatch([255, 0, 0, 255], pixel1)).to.be.eql(true);//非通视区颜色
                const pixel2 = pickPixel(map, 249, 100, 1, 1);
                expect(pixelMatch([0, 255, 0, 255], pixel2)).to.be.eql(true);//通视区颜色
                //另一条通视线的颜色比对
                const pixel3 = pickPixel(map, 140, 246, 4, 4);
                expect(pixelMatch([255, 0, 0, 255], pixel3.slice(8, 12))).to.be.eql(true);//非通视区颜色
                const pixel4 = pickPixel(map, 167, 201, 4, 4);
                expect(pixelMatch([0, 255, 0, 255], pixel4.slice(8, 12))).to.be.eql(true);//通视区颜色
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('clear insight lines', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        const marker = new maptalks.GLTFMarker(center, {
            symbol : {
                url : modelUrl,
                scaleX: 2,
                scaleY: 2,
                scaleZ: 2
            }
        }).addTo(gltflayer);
        marker.on('load', () => {
            const inSightAnalysis = new maptalks.InSightAnalysis({
                lines: [{
                    from: [center.x, center.y, 0],
                    to: [center.x + 0.05, center.y + 0.05, 20],
                }],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            });
            inSightAnalysis.addTo(gllayer);
            inSightAnalysis.addLine({
                from: [center.x, center.y, 10],
                to: [center.x - 0.03, center.y - 0.05, 20]
            });
            inSightAnalysis.clearLines();
            setTimeout(function() {
                //清空后没有通视线了
                const pixel1 = pickPixel(map, 302, 47, 1, 1);
                expect(pixelMatch([0, 0, 0, 0], pixel1)).to.be.eql(true);
                const pixel2 = pickPixel(map, 249, 100, 1, 1);
                expect(pixelMatch([146, 146, 146, 255], pixel2)).to.be.eql(true);
                const pixel3 = pickPixel(map, 140, 246, 4, 4);
                expect(pixelMatch([138, 138, 138, 255], pixel3.slice(8, 12))).to.be.eql(true);
                const pixel4 = pickPixel(map, 167, 201, 4, 4);
                expect(pixelMatch([152, 152, 152, 255], pixel4.slice(8, 12))).to.be.eql(true);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('get intersect data', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        gltflayer.on('modelload', () => {
            const insightAnalysis = new maptalks.InSightAnalysis({
                lines: [{
                    from: [center.x + 0.002, center.y - 0.001, 50],
                    to: [center.x - 0.001, center.y + 0.0015, 50]
                }],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            }).addTo(gllayer);
            setTimeout(function() {
                const { inSightLine, intersects } = insightAnalysis.getIntersetction()[0];
                expect(inSightLine).to.be.ok();
                expect(intersects.length).to.be.eql(2);
                expect(intersects[0][0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                expect(intersects[1][0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                expect(intersects[0][0].coordinates[0].coordinate.x).to.be.eql(0.0007622108088298774);
                expect(intersects[0][0].coordinates[0].coordinate.y).to.be.eql(0.00003149099268284772);
                expect(intersects[0][0].coordinates[0].coordinate.z).to.be.eql(50.00033);
                expect(intersects[1][0].coordinates[0].coordinate.x).to.be.eql(-0.0002377891911464758);
                expect(intersects[1][0].coordinates[0].coordinate.y).to.be.eql(0.0008648243260438448);
                expect(intersects[1][0].coordinates[0].coordinate.z).to.be.eql(50.00033);
                done();
            }, 100);
        });
        gllayer.addTo(map);
        new maptalks.GLTFMarker(center).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0.001, 0)).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0, 0.001)).addTo(gltflayer);
    });

    it('raycaster\'s test method', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        new maptalks.GLTFMarker(center).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0.001, 0)).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0, 0.001)).addTo(gltflayer);
        function getAllMeshes() {
            let meshes = [];
            const markers = gltflayer.getGeometries();
            for (let i = 0; i < markers.length; i++) {
                meshes = meshes.concat(markers[i].getMeshes());
            }
            return meshes;
        }
        gltflayer.on('modelload', () => {
            setTimeout(function() {
                const from = new maptalks.Coordinate(center.x + 0.002, center.y - 0.001, 50);
                const to = new maptalks.Coordinate(center.x - 0.001, center.y + 0.0015, 50);
                const raycaster = new maptalks.RayCaster(from, to);
                const meshes = getAllMeshes();
                const results = raycaster.test(meshes, map);
                expect(results.length).to.be.eql(2);
                expect(results[0].mesh).to.be.ok();
                expect(results[0].coordinates[0].indices).to.be.eql([0, 1, 2]);
                expect(results[0].coordinates[0].coordinate.x).to.be.eql(0.0007622108088298774);
                expect(results[0].coordinates[0].coordinate.y).to.be.eql(0.00003149099268284772);
                expect(results[0].coordinates[0].coordinate.z).to.be.eql(50.00033);
                done();
            }, 100);
        });
        gllayer.addTo(map);
    });

    it('set lines for insightAnalysis', done => {
        const gltflayer = new maptalks.GLTFLayer('gltf');
        const gllayer = new maptalks.GroupGLLayer('gl', [gltflayer], { sceneConfig });
        gltflayer.on('modelload', () => {
            const insightAnalysis = new maptalks.InSightAnalysis({
                lines: [],
                visibleColor: [0, 1, 0, 1],
                invisibleColor: [1, 0, 0, 1]
            }).addTo(gllayer);
            insightAnalysis.setLines([{
                from: [center.x + 0.002, center.y - 0.001, 50],
                to: [center.x - 0.001, center.y + 0.0015, 50]
            }
            ]);
            setTimeout(function() {
                const { inSightLine, intersects } = insightAnalysis.getIntersetction()[0];
                expect(inSightLine).to.be.ok();
                expect(intersects.length).to.be.eql(2);
                expect(intersects[0][0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                expect(intersects[1][0].data instanceof maptalks.GLTFMarker).to.be.eql(true);
                expect(intersects[0][0].coordinates[0].coordinate.x).to.be.eql(0.0007622108088298774);
                expect(intersects[0][0].coordinates[0].coordinate.y).to.be.eql(0.00003149099268284772);
                expect(intersects[0][0].coordinates[0].coordinate.z).to.be.eql(50.00033);
                expect(intersects[1][0].coordinates[0].coordinate.x).to.be.eql(-0.0002377891911464758);
                expect(intersects[1][0].coordinates[0].coordinate.y).to.be.eql(0.0008648243260438448);
                expect(intersects[1][0].coordinates[0].coordinate.z).to.be.eql(50.00033);
                done();
            }, 100);
        });
        gllayer.addTo(map);
        new maptalks.GLTFMarker(center).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0.001, 0)).addTo(gltflayer);
        new maptalks.GLTFMarker(center.add(0, 0.001)).addTo(gltflayer);
    });
});
