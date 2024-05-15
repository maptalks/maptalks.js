
describe('Map View History', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, new maptalks.VectorLayer('id'));
        container = setups.container;
        map = setups.map;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    describe('view history', function () {
        it('get previous view', function (done) {
            var zoom = map.getZoom();
            var renderer = map._getRenderer();
            renderer.callInNextFrame(function () {
                map.setCenterAndZoom([0, 0], map.getZoom() - 1);
                renderer.callInNextFrame(function () {
                    var view = map.zoomToPreviousView();
                    expect(view.center).to.be.eql(center.toArray());
                    expect(view.zoom).to.be.eql(zoom);

                    expect(map.zoomToPreviousView()).not.to.be.ok();
                    done();
                });
            });
        });

        it('zoom to previous view', function (done) {
            var zoom = map.getZoom();
            var renderer = map._getRenderer();
            renderer.callInNextFrame(function () {
                map.setCenterAndZoom([0, 0], map.getZoom() - 1);
                renderer.callInNextFrame(function () {
                    var view = map.zoomToPreviousView();
                    expect(view.center).to.be.eql(center.toArray());
                    expect(view.zoom).to.be.eql(zoom);

                    expect(map.hasPreviousView()).not.to.be.ok();
                    expect(map.zoomToPreviousView()).not.to.be.ok();
                    done();
                });
            });
        });

        it('zoom to next view', function (done) {
            var zoom = map.getZoom();
            var renderer = map._getRenderer();
            renderer.callInNextFrame(function () {
                map.setCenterAndZoom([0, 0], map.getZoom() - 1);
                renderer.callInNextFrame(function () {
                    map.zoomToPreviousView();
                    var next = map.zoomToNextView();
                    expect(next.center).to.be.eql([0, 0]);
                    expect(next.zoom).to.be.eql(zoom - 1);

                    expect(map.hasNextView()).not.to.be.ok();
                    expect(map.zoomToNextView()).not.to.be.ok();
                    done();
                });
            });

        });

        it('set previous view', function (done) {
            var zoom = map.getZoom();
            var renderer = map._getRenderer();
            renderer.callInNextFrame(function () {
                map.setCenterAndZoom([0, 0], zoom - 1);
                renderer.callInNextFrame(function () {
                    map.setCenterAndZoom([1, 1], zoom - 2);
                    renderer.callInNextFrame(function () {
                        map.setCenterAndZoom([2, 2], zoom - 2);
                        renderer.callInNextFrame(function () {
                            map.zoomToPreviousView();
                            map.zoomToPreviousView();
                            map.zoomToPreviousView();
                            renderer.callInNextFrame(function () {
                                expect(map.getViewHistory().length).to.be.eql(4);
                            });
                            done();
                        });
                    });
                });
            });
        });

        it('set a new view', function (done) {
            var zoom = map.getZoom();
            var renderer = map._getRenderer();
            renderer.callInNextFrame(function () {
                map.setCenterAndZoom([0, 0], zoom - 1);
                renderer.callInNextFrame(function () {
                    map.setCenterAndZoom([1, 1], zoom - 2);
                    renderer.callInNextFrame(function () {
                        map.zoomToPreviousView();
                        map.zoomToPreviousView();
                        map.setCenterAndZoom([2, 2], zoom - 3);
                        renderer.callInNextFrame(function () {
                            expect(map.getViewHistory().length).to.be.eql(2);
                            done();
                        });
                    });
                });
            });
        });

        it('zoom to previous view with animation', function (done) {
            var zoom = map.getZoom();
            var renderer = map._getRenderer();
            renderer.callInNextFrame(function () {
                map.setCenterAndZoom([0, 0], zoom - 1);
                renderer.callInNextFrame(function () {
                    map.setCenterAndZoom([1, 1], zoom - 2);
                    renderer.callInNextFrame(function () {

                        map.zoomToPreviousView({ animation: true, duration: 120 });
                        map.on('animateend', function () {
                            expect(map.getViewHistory().length).to.be.eql(3);
                            done();
                        });
                    });
                });
            });
        });

        it('only record view after interacting', function (done) {
            var renderer = map._getRenderer();
            renderer.callInNextFrame(function () {
                map.animateTo({
                    center: center.add(0.3, 0.3).toArray()
                }, {
                    duration: 100
                }, function (frame) {
                    renderer.callInNextFrame(function () {
                        if (frame.state.playState === 'finished') {
                            var view = map.zoomToPreviousView();
                            expect(view.center).to.be.eql(center.toArray());
                            done();
                        }
                    });
                });
            });
        });

        it('ignore same view', function () {
            for (var i = 0; i < 100; i++) {
                var view = map.getView();
                map._onViewChange(view);
            }

            expect(map.getViewHistory().length).to.be.eql(1);
        });

        it('view history\'s length is limited', function () {
            for (var i = 0; i < 100; i++) {
                var view = map.getView();
                view.center[0] += i * 0.1;
                view.center[1] += i * 0.1;
                map._onViewChange(view);
            }

            expect(map.getViewHistory().length).to.be.eql(map.options['viewHistoryCount']);
        });
    });
});
