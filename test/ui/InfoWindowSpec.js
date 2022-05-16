describe('UI.InfoWindow', function () {
    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);
    var layer;
    var canvasContainer;

    beforeEach(function () {
        var setups = COMMON_CREATE_MAP(center, null, { width: 800, height: 600 });
        container = setups.container;
        map = setups.map;
        layer = new maptalks.VectorLayer('v').addTo(map);
        layer.config('drawImmediate', true);
        canvasContainer = map._panels.canvasContainer;
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('infowindow open', function (done) {
        var marker = new maptalks.Marker(map.getCenter());
        marker.addTo(layer);
        marker.setInfoWindow({
            animationDuration: 0,
            title: 'hello maptalks',
            content: 'hello maptalks'
        });
        marker.openInfoWindow();
        setTimeout(function () {
            expect(marker.getInfoWindow().__uiDOM.style.display).not.to.be.eql('none');
            done();
        }, 100);

    });
    it('set infowindow before add to map, fix #1548', function (done) {
        var marker = new maptalks.Marker(map.getCenter());
        marker.setInfoWindow({
            animationDuration: 0,
            title: 'hello maptalks',
            content: 'hello maptalks'
        });
        marker.addTo(layer);
        marker._fireEvent('click');
        setTimeout(function () {

            expect(marker.getInfoWindow().__uiDOM.style.display).not.to.be.eql('none');
            done();
        }, 100);

    });

    it('infowindow template', function (done) {
        var msg = 'A light and plugable JavaScript library for integrated 2D/3D maps';
        var marker = new maptalks.Marker(map.getCenter(), {
            properties: {
                title: 'maptalks',
                message: msg
            }
        });
        marker.addTo(layer);
        marker.setInfoWindow({
            animationDuration: 0,
            title: 'hello {title}',
            content: '{message}',
            enableTemplate: true
        });
        marker.openInfoWindow();
        setTimeout(function () {
            var uiDom = marker.getInfoWindow().__uiDOM;
            var title = uiDom.querySelector('h2').innerText;
            var content = uiDom.querySelector('.maptalks-msgContent').innerText;
            expect(uiDom.style.display).not.to.be.eql('none');
            expect(title).to.eql('hello maptalks');
            expect(content).to.eql(msg);
            done();
        }, 100);
    });

    it('infowindow not repeat fire show event when geometry symbol change', function (done) {
        var marker1 = new maptalks.Marker(map.getCenter(),{
            symbol:{
                'markerType': 'ellipse',
                'markerWidth': 40,
                'markerHeight': 40,
            }
        });
        marker1.addTo(layer);
        marker1.setInfoWindow({
            animationDuration: 0,
            title: 'hello maptalks',
            content: 'hello maptalks'
        });

        var marker2 = new maptalks.Marker(map.getCenter().add(0.001,0),{
            symbol:{
                'markerType': 'ellipse',
                'markerWidth': 40,
                'markerHeight': 40,
            }
        });
        marker2.addTo(layer);
        marker2.setInfoWindow({
            animationDuration: 0,
            title: 'hello maptalks',
            content: 'hello maptalks'
        });
        [marker1, marker2].forEach(function(marker) {
            marker.getInfoWindow().on('showstart', function(e) {
                var ownver = e.target.getOwner();
                if (!ownver._orignalSymbol) {
                    ownver._orignalSymbol = ownver.getSymbol();
                }
                 //The show event should not be triggered,otherwise error:Maximum call stack size exceeded
                e.target.getOwner().setSymbol();
            })
            marker.getInfoWindow().on('hide',function(e) {
                var ownver = e.target.getOwner();
                  //The show event should not be triggered,otherwise error:Maximum call stack size exceeded
                ownver.setSymbol(ownver._orignalSymbol);
            })
        });
        //fire show events
        marker1.openInfoWindow();
        setTimeout(function(){
           marker2.openInfoWindow();
           setTimeout(function(){
               done();
           },100)
        },100)

    });
});
