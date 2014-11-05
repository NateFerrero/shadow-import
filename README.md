`<shadow-import>`
=================

HTML5 Web Components Automated

## Introduction

[Web Components](http://webcomponents.org/) are here to stay. However, there is currently some level of complication [needed](http://webcomponents.org/resources/) when setting up a boilerplate element. `<shadow-import>` has the following features to make life simple again:

- conflicting element names are now supported, with `<shadow-import>` it is possible to rename a tag on import
- attribute change watching built in
- easy to use with Angular.js
- custom templating, works with all frameworks

## The Syntax

Using `<shadow-import>` is incredibly simple.

For example, importing and using an existing component:

```html
<!doctype html>
<html>
<head>
    <script src="../../shadow-import.js"></script>
    <shadow-import tag="hero-section" href="components/hero-element/view.html"></shadow-import>
</head>
<body>
    <hero-section background-color="#ace">
        <h1>Shadow Import</h1>
        <p>Flexible, simple, and powerful.</p>
    </hero-section>
</body>
</html>
```

To view the result of this example, [click here](http://nateferrero.github.io/shadow-import/examples/hero/).

For more examples, and for documentation on writing a ShadowComponent, visit the [ShadowComponent Documentation](http://nateferrero.github.io/shadow-import/).
