import {
    removeContainer
} from '../../SpecCommon';
import Coordinate from 'geo/Coordinate';
import * as controls from 'control';
import Map from 'map';

describe('Control.Scale', function () {

    var container;
    var map;
    var center = new Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new Map(container, option);
    });

    afterEach(function () {
        removeContainer(container);
    });

    it('widgets contain correct value after initialized', function () {
        var control = new controls.Scale({
            metric: true,
            imperial: true
        });
        map.addControl(control);

        expect(control._mScale.innerHTML).to.not.be.empty();
        expect(control._iScale.innerHTML).to.not.be.empty();
        expect(control._mScale.innerHTML).to.contain('100');
    });

});
