ShadowComponent(function (cls, proto) {

    /**
     * Constructor
     */
    proto.init = function (el, attrs) {
        this.el = el;
        this.attrs = attrs;

        this.iStyle = this.el.querySelector('input').style;
        this.iStyle.padding = '6px';

        this.attrs.watch('border-color', this.updateBorder);

        setTimeout(function () {
            this.darkMode();
        }.bind(this), Math.random() * 2000);

        return this;
    };

    proto.updateBorder = function () {
        this.iStyle.border = '2px solid ' + this.attrs.get('border-color', '#000');
    };

    proto.darkMode = function () {
        this.iStyle.background = '#ccc';
        this.iStyle.color = '#fff';
    };

    return cls;
});
