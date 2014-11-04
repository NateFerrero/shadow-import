angular.module('ngShadow', [])

.directive('ngShadow', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, el, attrs) {
            var shadowAttrs = el[0].shadowAttributes;
            if (!shadowAttrs) {
                console.error('The following error applies to', el[0]);
                throw new Error('The directive ng-shadow can only be used on elements created with <shadow-import>');
            }
            Object.keys(attrs.$attr).forEach(function (key) {
                /**
                 * +some-attribute="foobar" binds the `some-attribute` attr to scope.foobar with regular watch
                 * ++some-attribute="foobar" binds the `some-attribute` attr to scope.foobar with deep watch
                 */
                if (key && key[0] === '+') {
                    var attr = attrs.$attr[key];
                    var attrName = attr.replace(/^\++/, '');

                    /**
                     * Sync from scope --> shadowAttrs
                     */
                    var firstRun = true;
                    var getter = $parse(attrs[attr]);
                    var setter = getter.assign;

                    Object.defineProperty(shadowAttrs, attr, {
                        enumerable: false,
                        get: function () { }
                    });

                    Object.defineProperty(shadowAttrs, attrName, {
                        enumerable: true,
                        get: function () {
                            return getter(scope);
                        },
                        set: function (val) {
                            setter(scope, val);
                            scope.$$phase || scope.$apply();
                        }
                    });

                    scope.$watch(attrs[attr], function (newVal, oldVal) {
                        if (firstRun || newVal !== oldVal || !angular.equals(newVal, oldVal)) {
                            firstRun = false;
                            shadowAttrs.$changed(attrName, newVal, oldVal);
                        }
                    }, key[1] === '+' /* deep watch on ++attr */);
                }
            });
        }
    };
});
