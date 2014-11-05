ShadowComponent(function (cls, proto) {

    /**
     * Constructor
     */
    proto.init = function () {
        var input = this.el.querySelector('input');
        input.value = Math.ceil(Math.random() * 1000);
        this.iStyle = input.style;
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
        this.iStyle.background = '#333';
        this.iStyle.color = '#fff';
    };
});
