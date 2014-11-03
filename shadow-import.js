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

    var component;

    this.ShadowComponent = function ShadowComponent(fn) {
        if (component) {
            throw new Error("ShadowComponent() called outside of <shadow-import> lifecycle");
        }

        if (typeof fn != 'function') {
            throw new Error("ShadowComponent() called without a function as the first argument");
        }

        component = function ShadowComponent () {
            this.init && this.init.apply(this, arguments);
        };

        fn(component, component.prototype);
    };

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
            if (!(elem.href in shadowImport.linkImports)) {
                /**
                 * Call this function at any time with a custom element node,
                 * and when the template is available, the shadow DOM will
                 * have the template cloned onto it.
                 */
                shadowImport.linkImports[elem.href] = function (elem) {

                    /**
                     * If the template function is ready, just call it now
                     * with the custom element node.
                     */
                    if (elem.href in shadowImport.renderTemplate) {
                        shadowImport.renderTemplate[elem.href](elem);
                    }

                    /**
                     * Otherwise, put it in the queue to be processed when the template
                     * is finally loaded.
                     */
                    else {
                        if (!shadowImport.renderQueue[elem.href]) {
                            shadowImport.renderQueue[elem.href] = [];
                        }
                        shadowImport.renderQueue[elem.href].push(elem);
                    }
                };

                /**
                 * Load the template content from the elem.href and instantiate the component class
                 */
                loadTemplateContent(elem.href, function (templateContent) {
                    /**
                     * Ensure that the component was registered
                     */
                    if (!component) {
                        throw new Error("ShadowComponent() not called during <shadow-import> tag initialization, should have been included in " + elem.href);
                    }

                    /**
                     * Retain a reference to the imported component
                     */
                    var CustomClass = component;

                    /**
                     * Reset the component after use
                     */
                    component = null;

                    /**
                     * Function to call when the template is loaded
                     */
                    var templateLoaded = shadowImport.renderTemplate[elem.href] = function (elem) {
                        /**
                         * Clone the template, and append it to the custom element node
                         */
                        elem.shadowRoot.appendChild(templateContent.cloneNode(true));

                        /**
                         * Finally, instantiate the new component class with the custom element node
                         * and the attribute manager
                         */
                        elem.component = new CustomClass(elem.shadowRoot, elem.shadowAttributes);
                    };

                    /**
                     * Process all queued shadow DOM nodes that require this template
                     */
                    if (Array.isArray(shadowImport.renderQueue[elem.href])) {
                        shadowImport.renderQueue[elem.href].forEach(templateLoaded);
                    }
                });
            }

            /**
             * Initiate the link import process with a template URL and a custom element node
             */
            elem.shadowAttributes = new ShadowAttributes(elem);
            shadowImport.linkImports[elem.href](elem);
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
        var href = this.attributes.getNamedItem('href');

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
        customElement.href = href ? href.value : 'components/' + tag.value + '/component.html';
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
