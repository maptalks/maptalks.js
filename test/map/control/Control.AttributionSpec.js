import {
    removeContainer,
} from '../SpecCommon';
import Coordinate from 'geo/Coordinate';
import * as controls from 'control';

describe('Control.Attribution', function () {

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

    it('contains specified content', function () {
        var control = new controls.Attribution({
            content: 'content'
        });
        map.addControl(control);

        expect(control._attributionContainer.innerHTML).to.eql('content');
    });

    it('setContent correctly', function () {
        var control = new controls.Attribution({
            content: 'content'
        });
        map.addControl(control);
        control.setContent('new content');

        expect(control._attributionContainer.innerHTML).to.eql('new content');
    });

});
