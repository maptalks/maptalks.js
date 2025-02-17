
describe('WorkerSpec', function () {

    var fun = function (exports) {
        exports.initialize = function () {
            console.log('worker init');
        }
        exports.onmessage = function (msg, postResponse) {
            var num = msg.data.num;
            postResponse(null, { num: num * num, key: 'worer1' });

        };
    };

    function getWorkerKey() {
        return 'worker' + maptalks.Util.GUID();
    }

    class Actor extends maptalks.worker.Actor {
        constructor(key) {
            super(key)
        }
    }

    var container;
    var map;
    var layer;

    beforeEach(function () {
    });

    afterEach(function () {
        if (map) {
            map.remove();
            REMOVE_CONTAINER(container);
        }
    });



    // it('simple', function (done) {
    //     //第一次创建worker,启动workerpoool
    //     var key = getWorkerKey();
    //     maptalks.registerWorkerAdapter(key, fun);
    //     var actor = new Actor(key);
    //     expect(actor.initializing).to.be.eql(false);
    //     var result = [];
    //     for (let i = 0; i < 5; i++) {
    //         actor.send({ num: i }, [], (err, data) => {
    //             result.push(data);
    //         })
    //     }
    //     setTimeout(() => {
    //         expect(actor.initializing).to.be.eql(false);
    //         expect(result.length).to.be.eql(5);
    //         done();
    //     }, 1000);
    // });

    it('multi instance', function (done) {
        //workerpool 已经存在
        var key = getWorkerKey();
        maptalks.registerWorkerAdapter(key, fun);
        var actor1 = new Actor(key);
        expect(actor1.initializing).to.be.eql(true);
        var actor2 = new Actor(key);
        expect(actor2.initializing).to.be.eql(false);
        var result = [];
        for (let i = 0; i < 5; i++) {
            actor1.send({ num: i }, [], (err, data) => {
                result.push(data);
            })
            actor2.send({ num: i }, [], (err, data) => {
                result.push(data);
            })
        }
        setTimeout(() => {
            expect(actor1.initializing).to.be.eql(false);
            expect(actor2.initializing).to.be.eql(false);
            expect(result.length).to.be.eql(10);
            done();
        }, 1000);
    });
    it('multi actor and multi instance', function (done) {
        //workerpool 已经存在
        var key1 = getWorkerKey();
        var key2 = getWorkerKey();
        var result = [];
        var actors = [];
        [key1, key2].forEach(key => {
            maptalks.registerWorkerAdapter(key, fun);
            var actor1 = new Actor(key);
            expect(actor1.initializing).to.be.eql(true);
            var actor2 = new Actor(key);
            expect(actor2.initializing).to.be.eql(false);
            actors.push(actor1, actor2);
            for (let i = 0; i < 5; i++) {
                actor1.send({ num: i }, [], (err, data) => {
                    result.push(data);
                })
                actor2.send({ num: i }, [], (err, data) => {
                    result.push(data);
                })
            }
        });

        setTimeout(() => {
            actors.forEach(actor => {
                expect(actor.initializing).to.be.eql(false);
            });
            expect(result.length).to.be.eql(20);
            done();
        }, 1000);
    });

    it('core-fetch-image', function (done) {
        //workerpool 已经存在
        //core-fetch-image worker will Asynchronous injection
        var center = new maptalks.Coordinate(118.846825, 32.046534);
        var setups = COMMON_CREATE_MAP(center, null, {
            width: 800,
            height: 600
        });
        container = setups.container;
        map = setups.map;
        layer = new maptalks.VectorLayer('v').addTo(map);
        setTimeout(() => {
            expect(layer).to.be.painted(0, -10);
            done();
        }, 1000);
        // layer.once('layerload', function () {
        //     expect(layer).to.be.painted(0, 0);
        //     done();
        // });
        var marker = new maptalks.Marker(center, {
            symbol: {
                markerFile: 'resources/2.png'
            }
        });
        marker.addTo(layer);
    });


});
