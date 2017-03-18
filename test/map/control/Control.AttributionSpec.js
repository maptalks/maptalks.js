describe('Control.Attribution', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        var option = {
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('contains specified content', function () {
        var control = new maptalks.control.Attribution({
            content: 'content'
        });
        map.addControl(control);

        expect(control._attributionContainer.innerHTML).to.eql('<span style="padding:0px 4px">content</span>');
    });

    it('setContent in HTML', function () {
        var control = new maptalks.control.Attribution({
            content: 'content'
        });
        map.addControl(control);
        control.setContent('<div>new content</div>');

        expect(control._attributionContainer.innerHTML).to.eql('<div>new content</div>');
    });

    it('setContent correctly', function () {
        var control = new maptalks.control.Attribution({
            content: 'content'
        });
        map.addControl(control);
        control.setContent('new content');

        expect(control._attributionContainer.innerHTML).to.eql('<span style="padding:0px 4px">new content</span>');
    });

});
