ShadowComponent(function (cls, proto) {
    proto.init = function () {
        var nameLabel = this.el.getElementById('name');
        var nameInput = this.el.getElementById('name-input');

        this.attrs.watch('name', function (name) {
            nameLabel.innerText = name || '';
            nameInput.value = name;
        });

        nameInput.addEventListener('change', function (event) {
            this.attrs.set('name', nameInput.value);
        }.bind(this));
    };
});
