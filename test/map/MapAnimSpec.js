describe('Map.Anim', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '2px';
        container.style.height = '2px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation: false,
            zoom: 17,
            center: center,
            baseLayer: new maptalks.TileLayer('tile', {
                urlTemplate: TILE_IMAGE,
                subdomains: [1, 2, 3],
                renderer: 'canvas'
            })
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('animateTo', function (done) {
        var center = map.getCenter().add(0.1, 0.1);
        var zoom = map.getZoom() - 1;
        var pitch = map.getPitch() + 10;
        var bearing = map.getBearing() + 60;
        map.on('animateend', function () {
            expect(map.getCenter().toArray()).to.be.closeTo(center.toArray());
            expect(map.getZoom()).to.be.eql(zoom);
            expect(map.getPitch()).to.be.eql(pitch);
            expect(map.getBearing()).to.be.approx(bearing);
            done();
        });
        map.animateTo({
            center: center,
            zoom: zoom,
            pitch: pitch,
            bearing: bearing
        }, {
            'duration': 300
        });
    });

    it('flyTo', function (done) {
        var center = map.getCenter().add(0.1, 0.1);
        var zoom = map.getZoom() - 1;
        var pitch = map.getPitch() + 10;
        var bearing = map.getBearing() + 60;
        map.on('animateend', function () {
            expect(map.getCenter().toArray()).to.be.closeTo(center.toArray());
            expect(map.getZoom()).to.be.eql(zoom);
            expect(map.getPitch()).to.be.eql(pitch);
            expect(map.getBearing()).to.be.approx(bearing);
            done();
        });
        map.flyTo({
            center: center,
            zoom: zoom,
            pitch: pitch,
            bearing: bearing
        }, {
            'duration': 300
        });
    });

    it('rotate', function (done) {
        var pitch = map.getPitch() + 10;
        var bearing = map.getBearing() + 60;
        map.on('animateend', function () {
            expect(map.getPitch()).to.be.eql(pitch);
            expect(map.getBearing()).to.be.approx(bearing);
            done();
        });
        map.animateTo({
            pitch: pitch,
            bearing: bearing
        }, {
            'duration': 300
        });
    });

    it('zoomOut', function (done) {
        var zoom = map.getZoom() - 5;
        map.on('animateend', function () {
            expect(map.getZoom()).to.be.eql(zoom);
            done();
        });
        map.animateTo({
            zoom: zoom
        }, {
            'duration': 300
        });
    });

    it('disable zoom by zoomable', function (done) {
        map.config('zoomable', false);
        var cur = map.getZoom();
        var zoom = map.getZoom() - 5;
        map.on('animateend', function () {
            expect(map.getZoom()).to.be.eql(cur);
            done();
        });
        map.animateTo({
            zoom: zoom
        }, {
            'duration': 300
        });
    });

    // it('interrupt animateTo by _stopAnim', function (done) {
    //     var center = map.getCenter().add(0.1, 0.1);
    //     var zoom = map.getZoom() - 4;
    //     // var pitch = map.getPitch() + 10;
    //     var bearing = map.getBearing() + 60;
    //     map.on('animateinterrupted', function () {
    //         expect(map.getCenter().toArray()).not.to.be.closeTo(center.toArray());
    //         expect(map.getZoom()).not.to.be.eql(zoom);
    //         expect(map.getPitch()).not.to.be.eql(pitch);
    //         expect(map.getBearing()).not.to.be.eql(bearing);
    //         done();
    //     });
    //     var player = map.animateTo({
    //         center : center,
    //         zoom : zoom,
    //         // pitch : pitch,
    //         bearing : bearing
    //     }, {
    //         'duration' : 200
    //     });
    //     setTimeout(function () {
    //         map._stopAnim(player);
    //     }, 100);
    // });

    it('interupt animateTo by scrollZoom', function (done) {
        map.config('zoomAnimationDuration', 100);
        map.config('seamlessZoom', false);
        var cur = map.getZoom();
        var zoom = map.getZoom() - 4;
        map.on('animateinterrupted', function () {
            expect(map.getZoom()).not.to.be.eql(zoom);
        });
        var zoomendCount = 0;
        map.on('zoomend', function () {
            zoomendCount++;
            if (zoomendCount === 2) {
                expect(map.getZoom()).to.be.eql(zoom);
                //zoomend fired by animation
                done();
            }
        });
        map.animateTo({
            zoom: zoom
        }, {
            'duration': 300
        });
        setTimeout(function () {
            happen.once(container, {
                type: 'wheel',
                detail: 100
            });
        }, 100);
    });


    it('bearing>180', function (done) {
        const bearing = 180 + Math.floor(Math.random() * 180);
        map.setView({
            bearing
        });
        setTimeout(() => {
            expect(map.getBearing().toFixed(0)).to.be.eql(-180 + (Math.abs(bearing) - 180));
            done();
        }, 100);
    });

    it('bearing<-180', function (done) {
        const bearing = -180 - Math.floor(Math.random() * 180);
        map.setView({
            bearing
        });
        setTimeout(() => {
            expect(map.getBearing().toFixed(0)).to.be.eql(180 - (Math.abs(bearing) - 180));
            done();
        }, 100);
    });

    it('#1888 animateTo repeat', function (done) {

        function animateTo(callback) {
            map.animateTo(
                {
                    bearing: 269,
                    duration: 400,
                    callName: "setAzimuthalAngle",
                }, {

            }, frame => {
                if (frame.state.playState === 'finished') {
                    callback();
                }
            }
            )
        }
        var spy = sinon.spy();
        map.on('rotate', spy);
        animateTo(() => {
            expect(spy.called).to.be.ok();
            var spy1 = sinon.spy();
            map.on('rotate', spy1);
            animateTo(() => {
                expect(spy1.called).not.to.be.ok();
                done();
            });
        });
    });


    it('bearing > 180 and current bearing>0', function (done) {
        map.setView({
            bearing: 175
        })
        const bearing = 180 + Math.floor(Math.random() * 180);
        map.animateTo(
            {
                bearing,

                // callName: "setAzimuthalAngle",
            },
            {
                duration: 1000,
            },
            frame => {
                if (frame.state.playState === 'finished') {
                    expect(frame.styles.bearing.toFixed(0)).to.be.eql(bearing);
                    done();
                }
            }
        )
    });

    it('bearing <180 and current bearing<0', function (done) {
        map.setView({
            bearing: -175
        })
        const bearing = -180 - Math.floor(Math.random() * 180);
        map.animateTo(
            {
                bearing,

                // callName: "setAzimuthalAngle",
            },
            {
                duration: 1000,
            },
            frame => {
                if (frame.state.playState === 'finished') {
                    expect(frame.styles.bearing.toFixed(0)).to.be.eql(bearing);
                    done();
                }
            }
        )
    });

    it('#851 bearing counterclockwise', function (done) {
        map.setView({
            bearing: -178
        })
        map.animateTo(
            {
                bearing: 177,

                // callName: "setAzimuthalAngle",
            }, {
            duration: 1000,
            counterclockwise: true
        },
            frame => {
                if (frame.state.playState === 'finished') {
                    expect(frame.styles.bearing.toFixed(0)).to.be.eql(-183);
                    done();
                }
            }
        )
    });

    it('bearing counterclockwise current bearing>0 and bearing>0', function (done) {
        map.setView({
            bearing: 0
        })
        const bearing = Math.floor(Math.random() * 180);
        map.animateTo(
            {
                bearing,

                // callName: "setAzimuthalAngle",
            }, {
            duration: 1000,
            counterclockwise: true
        },
            frame => {
                if (frame.state.playState === 'finished') {
                    expect(frame.styles.bearing.toFixed(0)).to.be.eql(-(360 - bearing));
                    done();
                }
            }
        )
    });

    it('bearing counterclockwise current bearing<0 and bearing<0', function (done) {
        map.setView({
            bearing: 0
        })
        const bearing = -Math.floor(Math.random() * 180);
        map.animateTo(
            {
                bearing,

                // callName: "setAzimuthalAngle",
            }, {
            duration: 1000,
            counterclockwise: true
        },
            frame => {
                if (frame.state.playState === 'finished') {
                    expect(frame.styles.bearing.toFixed(0)).to.be.eql(360 + bearing);
                    done();
                }
            }
        )
    });
});
