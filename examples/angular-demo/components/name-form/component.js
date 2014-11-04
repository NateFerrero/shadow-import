ShadowComponent(function (cls, proto) {
    proto.init = function (el, attrs) {

        var nameLabel = el.getElementById('name');
        var nameInput = el.getElementById('name-input');

        attrs.$watch('name', function (name) {
            nameLabel.innerText = name || '';
            nameInput.value = name;
        });

        nameInput.addEventListener('change', function (event) {
            attrs.name = nameInput.value;
        });
    };
});
