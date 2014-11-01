/**
 * <shadow-import> HTML tag to create custom HTML elements.
 * @author Nate Ferrero
 * @author Trey Cordova
 * @muse Jarrod Perez
 * @energy Jeremy Bernstein
 */
(function () {
    var shadowImport = Object.create(HTMLElement.prototype);

    shadowImport.linkImports = {};
    shadowImport.renderTemplate = {};
    shadowImport.renderQueue = {};

    /**
     * Attributes on the custom element
     */
    var ShadowAttributes = function (elem) {
        this.elem = elem;
        this.watchers = {};
    };

    ShadowAttributes.prototype.get = function (attrName, def) {
        var attr = this.elem.attributes.getNamedItem(attrName);
        return attr ? attr.value : def;
    };

    ShadowAttributes.prototype.changed = function (attrName, oldVal, newVal) {
        if (Array.isArray(this.watchers[attrName])) {
            this.watchers[attrName].forEach(function (watcher) {
                watcher.call(this.elem.component, oldVal, newVal);
            }, this);
        }
    };

    ShadowAttributes.prototype.watch = function (attrName, fn) {
        if (!Array.isArray(this.watchers[attrName])) {
            this.watchers[attrName] = [];
        }

        this.watchers[attrName].push(fn);
        setTimeout(function () {
            fn.call(this.elem.component, undefined, this.get(attrName))
        }.bind(this));
    };

    /**
     * A function to create a <link rel="import"> tag to load a template
     * and render when complete.
     */
    var loadTemplateContent = function (templateUrl, callback) {
        /**
         * Load the template asynchronously and process any waiting queue 
         * of custom element nodes when ready.
         */
        var link = document.createElement('link');
        link.rel = 'import';
        link.href = templateUrl;

        /**
         * The template is now available, proceed with rendering
         */
        link.onload = function (e) {
            var templateNode = e.target.import.querySelector('template');

            /**
             * Component HTML files must contain a <template> tag
             * or else we throw this error.
             */
            if (!templateNode) {
                throw new Error('ShadowImport: <template> tag not found in: ' + templateUrl);
            }

            callback(templateNode.content);
        };

        /**
         * The template failed to load for some reason
         */
        link.onerror = function(e) {
            throw new Error('ShadowImport: Unable to load component template: ' + templateUrl)
        };

        /**
         * Append the link import to the document <head> tag
         */
        document.head.appendChild(link);
    };

    /**
     * Create a custom element
     */
    shadowImport.createCustomElement = function () {
        /**
         * Prototype for the custom element
         */
        var customElement = Object.create(HTMLElement.prototype);

        /**
         * Callback for any attribute changes
         */
        customElement.attributeChangedCallback = function (attrName, oldVal, newVal) {
            this.shadowAttributes.changed(attrName, oldVal, newVal);
        };
        
        /**
         * Callback for any time the custom tag is created
         */
        customElement.createdCallback = function () {
            /**
             * Create a shadow root on the custom element
             */
            this.createShadowRoot();

            /**
             * Cache the content
             */
            this.content = document.createDocumentFragment();
            while(this.childNodes.length) {
                this.content.appendChild(this.childNodes.item(0));
            }
            
            var elem = this;

            /**
             * If the template loader has not been initialized for the URL in this.template,
             * create a new asychronous template loader function and put it under
             * shadowImport.linkImports[this.template]
             */
            if (!(elem.template in shadowImport.linkImports)) {
                /**
                 * Call this function at any time with a custom element node,
                 * and when the template is available, the shadow DOM will
                 * have the template cloned onto it.
                 */
                shadowImport.linkImports[elem.template] = function (elem) {

                    /**
                     * If the template function is ready, just call it now
                     * with the custom element node.
                     */
                    if (elem.template in shadowImport.renderTemplate) {
                        shadowImport.renderTemplate[elem.template](elem);
                    }

                    /**
                     * Otherwise, put it in the queue to be processed when the template
                     * is finally loaded.
                     */
                    else {
                        if (!shadowImport.renderQueue[elem.template]) {
                            shadowImport.renderQueue[elem.template] = [];
                        }
                        shadowImport.renderQueue[elem.template].push(elem);
                    }
                };

                /**
                 * Load the template content from the elem.template and instantiate the component class
                 */
                loadTemplateContent(elem.template, function (templateContent) {
                    var templateLoaded = shadowImport.renderTemplate[elem.template] = function (elem) {
                        /**
                         * Clone the template, and append it to the custom element node
                         */
                        elem.shadowRoot.appendChild(templateContent.cloneNode(true));

                        /**
                         * The corresponding shadowClass for the custom element must exist in JavaScript.
                         */
                        if (!window[elem.shadowClass]) {
                            throw new Error('ShadowImport: Shadow class ' + elem.shadowClass +
                                ' not found in: ' + elem.template);
                        }

                        /**
                         * Finally, instantiate the new component class on the custom element node
                         */
                        var CustomClass = window[elem.shadowClass];
                        elem.component = new CustomClass(elem.shadowRoot, elem.shadowAttributes);
                    };

                    /**
                     * Process all queued shadow DOM nodes that require this template
                     */
                    if (Array.isArray(shadowImport.renderQueue[elem.template])) {
                        shadowImport.renderQueue[elem.template].forEach(templateLoaded);
                    }
                });
            }

            /**
             * Initiate the link import process with a template URL and a custom element node
             */
            elem.shadowAttributes = new ShadowAttributes(elem);
            shadowImport.linkImports[elem.template](elem);
        };

        return customElement;
    };

    /**
     * Callback for any time the <shadow-import> element is created
     */
    shadowImport.createdCallback = function () {

        /**
         * Load the custom tag name for the new custom element
         */
        var tag = this.attributes.getNamedItem('tag');

        /**
         * All <shadow-import> tags must contain a tag attribute
         * This is what the new custom element will be created as
         */
        if (!tag) {
            throw new Error('<shadow-import> found without tag="" attribute');
        }

        /**
         * Custom element tag names require a dash in the name, and cannot start with a dash
         */
        else if (tag.value.indexOf('-') < 1) {
            throw new Error('<shadow-import> tag="" attribute must contain a dash');
        }

        /**
         * <shadow-import> tags may define a template attribute, otherwise the default
         * will be used
         */
        var template = this.attributes.getNamedItem('template');

        /**
         * <shadow-import> tags may define a shadow-class attribute, otherwise the default
         * will be used
         */
        var shadowClass = this.attributes.getNamedItem('shadow-class');

        var defaultClass = tag.value.replace(/^.|-./g, function (x) {
            return x.toUpperCase().replace('-', '');
        }) + 'Element';

        /**
         * Create the custom element
         */
        var customElement = this.createCustomElement();
        customElement.template = template ? template.value : 'components/' + tag.value + '/component.html';
        customElement.shadowClass = shadowClass ? shadowClass.value : defaultClass;

        /**
         * Register the custom element as <tag.value>
         */
        document.registerElement(tag.value, {
            prototype: customElement
        });
    };

    /**
     * Register the <shadow-import> tag on the document
     */
    var ShadowImport = document.registerElement('shadow-import', {
        prototype: shadowImport
    });
})();
