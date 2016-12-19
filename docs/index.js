Polymer = {
                dom: "shadow"
            };
(function() {

    // TODO(sorvell): There is an implicit depency on `Polymer.Class` here
    // that would be good to resolve. It's because (elements/class.html)
    // because this file specially handles `Polymer`.

    // Polymer is a Function, but of course this is also an Object, so we
    // hang various other objects off of Polymer.*

    var userPolymer = window.Polymer;

    window.Polymer = function(info) {
      // if input is a `class` (aka a function with a prototype), use the prototype
      // remember that the `constructor` will never be called
      var klass;
      if (typeof info === 'function') {
        klass = info;
      } else {
        klass = Polymer.Class(info);
      }
      var options = {};
      if (klass.extends) {
        options.extends = klass.extends;
      }
      customElements.define(klass.is, klass, options);
      return klass;
    };

    if (userPolymer) {
      for (var i in userPolymer) {
        Polymer[i] = userPolymer[i];
      }
    }

  })();
window.Polymer = window.Polymer || {};
  window.Polymer.version = '2.0-preview';
(function() {

  var modules = {};
  var lcModules = {};
  var findModule = function(id) {
    return modules[id] || lcModules[id.toLowerCase()];
  };

  /**
   * The `dom-module` element registers the dom it contains to the name given
   * by the module's id attribute. It provides a unified database of dom
   * accessible via any dom-module element. Use the `import(id, selector)`
   * method to locate dom within this database. For example,
   *
   * <dom-module id="foo">
   *   <img src="stuff.png">
   * </dom-module>
   *
   * Then in code in some other location that cannot access the dom-module above
   *
   * var img = document.createElement('dom-module').import('foo', 'img');
   *
   */
  class DomModule extends HTMLElement {

    static get observedAttributes() { return ['id'] }

    attributeChangedCallback() {
      this.register();
    }

    _styleOutsideTemplateCheck() {
      if (this.querySelector('style')) {
        console.warn('dom-module %s has style outside template', this.id);
      }
    }

    /**
     * Registers the dom-module at a given id. This method should only be called
     * when a dom-module is imperatively created. For
     * example, `document.createElement('dom-module').register('foo')`.
     * @method register
     * @param {String} id The id at which to register the dom-module.
     */
    register(id) {
      id = id || this.id;
      if (id) {
        this.id = id;
        // store id separate from lowercased id so that
        // in all cases mixedCase id will stored distinctly
        // and lowercase version is a fallback
        modules[id] = this;
        lcModules[id.toLowerCase()] = this;
        this._styleOutsideTemplateCheck();
      }
    }

    /**
     * Retrieves the dom specified by `selector` in the module specified by
     * `id`. For example, this.import('foo', 'img');
     * @method register
     * @param {String} id
     * @param {String} selector
     * @return {Object} Returns the dom which matches `selector` in the module
     * at the specified `id`.
     */
    import(id, selector) {
      if (id) {
        var m = findModule(id);
        if (m && selector) {
          return m.querySelector(selector);
        }
        return m;
      }
    }

  }

  customElements.define('dom-module', DomModule);

  // export
  Polymer.DomModule = new DomModule();

  Polymer.DomModule.modules = modules;

})();
Polymer.CaseMap = {

    _caseMap: {},
    _rx: {
      dashToCamel: /-[a-z]/g,
      camelToDash: /([A-Z])/g
    },

    dashToCamelCase: function(dash) {
      return this._caseMap[dash] || (
        this._caseMap[dash] = dash.indexOf('-') < 0 ? dash : dash.replace(this._rx.dashToCamel,
          function(m) {
            return m[1].toUpperCase();
          }
        )
      );
    },

    camelToDashCase: function(camel) {
      return this._caseMap[camel] || (
        this._caseMap[camel] = camel.replace(this._rx.camelToDash, '-$1').toLowerCase()
      );
    }

  };
(function() {

  'use strict';

  var p = Element.prototype;
   var matchesSelector = p.matches || p.matchesSelector ||
     p.mozMatchesSelector || p.msMatchesSelector ||
     p.oMatchesSelector || p.webkitMatchesSelector;

  Polymer.Utils = {

    /**
     * Copies props from a source object to a target object.
     *
     * Note, this method uses a simple `for...in` strategy for enumerating
     * properties.  To ensure only `ownProperties` are copied from source
     * to target and that accessor implementations are copied, use `extend`.
     *
     * @method mixin
     * @param {Object} target Target object to copy properties to.
     * @param {Object} source Source object to copy properties from.
     * @return {Object} Target object that was passed as first argument.
     */
    mixin(target, source) {
      for (var i in source) {
        target[i] = source[i];
      }
      return target;
    },

    /**
     * Copies own properties (including accessor descriptors) from a source
     * object to a target object.
     *
     * @method extend
     * @param {Object} prototype Target object to copy properties to.
     * @param {Object} api Source object to copy properties from.
     * @return {Object} prototype object that was passed as first argument.
     */
    extend(prototype, api) {
      if (prototype && api) {
        var n$ = Object.getOwnPropertyNames(api);
        for (var i=0, n; (i<n$.length) && (n=n$[i]); i++) {
          this.copyOwnProperty(n, api, prototype);
        }
      }
      return prototype || api;
    },

    copyOwnProperty(name, source, target) {
      var pd = Object.getOwnPropertyDescriptor(source, name);
      if (pd) {
        Object.defineProperty(target, name, pd);
      }
    },

    // only needed for v0 native ShadowDOM support
    getRootNode(node) {
      if (node.getRootNode) {
        return node.getRootNode();
      }
      if (!node) {
        return null;
      }
      while(node && node.parentNode) {
        node = node.parentNode;
      }
      return node;
    },

    matchesSelector(node, selector) {
      return matchesSelector.call(node, selector);
    },

    cachingMixin(mixin) {
      return function(base) {
        if (!mixin.__mixinApplications) {
          mixin.__mixinApplications = new WeakMap();
        }
        let application = mixin.__mixinApplications.get(base);
        if (!application) {
          application = mixin(base);
          mixin.__mixinApplications.set(base, application);
        }
        return application;
      }
    },

    dedupingMixin(mixin) {
      mixin = this.cachingMixin(mixin);
      return function(base) {
        let baseMap = base.__mixinMap;
        if (baseMap && baseMap.get(mixin)) {
          return base;
        } else {
          let extended = mixin(base);
          extended.__mixinMap = new Map(baseMap);
          extended.__mixinMap.set(mixin, true);
          return extended;
        }
      }
    },

    /**
     * Convenience method for importing an HTML document imperatively.
     *
     * This method creates a new `<link rel="import">` element with
     * the provided URL and appends it to the document to start loading.
     * In the `onload` callback, the `import` property of the `link`
     * element will contain the imported document contents.
     *
     * @method importHref
     * @param {string} href URL to document to load.
     * @param {Function} onload Callback to notify when an import successfully
     *   loaded.
     * @param {Function} onerror Callback to notify when an import
     *   unsuccessfully loaded.
     * @param {boolean} optAsync True if the import should be loaded `async`.
     *   Defaults to `false`.
     * @return {HTMLLinkElement} The link element for the URL to be loaded.
     */
    importHref(href, onload, onerror, optAsync) {
      var l = document.createElement('link');
      l.rel = 'import';
      l.href = href;

      optAsync = Boolean(optAsync);
      if (optAsync) {
        l.setAttribute('async', '');
      }

      var self = this;
      if (onload) {
        l.onload = function(e) {
          // NOTE: Push load handler until after `HTMLImports.whenReady`,
          // if available, to better coordinate with use of customElements
          // polyfill's document upgrade ordering guarantees (ensures,
          // for example, a dom-module for an element in an async import
          // customizes before any elements matching a define call).
          if (window.HTMLImports) {
            // wait until any other pending imports are ready
            HTMLImports.whenReady(function() {
              // wait until the CustomElements polyfill has upgraded elements.
              // (needed because CE's whenReady is installed afer this one)
              setTimeout(function() {
                onload.call(self, e);
              });
            });
          } else {
            onload.call(self, e);
          }
        }
      }
      if (onerror) {
        l.onerror = function(e) {
          onerror.call(self, e);
        }
      }
      document.head.appendChild(l);
      return l;
    }

  };

})();
(function() {

  'use strict';

  function createNodeEventHandler(context, eventName, methodName) {
    context = context._rootDataHost || context;
    var handler = function(e) {
      if (context[methodName]) {
        context[methodName](e, e.detail);
      } else {
        console.warn('listener method `' + methodName + '` not defined');
      }
    };
    return handler;
  }

  Polymer.EventListeners = Polymer.Utils.dedupingMixin(function(superClass) {

    return class EventListeners extends superClass {

      _addMethodEventListenerToNode(node, eventName, methodName, context) {
        context = context || node;
        var handler = createNodeEventHandler(context, eventName, methodName);
        this._addEventListenerToNode(node, eventName, handler);
        return handler;
      }

      _addEventListenerToNode(node, eventName, handler) {
        node.addEventListener(eventName, handler);
      }

      _removeEventListenerFromNode(node, eventName, handler) {
        node.removeEventListener(eventName, handler);
      }

    }

  });

})();
(function() {

    // path fixup for urls in cssText that's expected to
    // come from a given ownerDocument
    function resolveCss(cssText, ownerDocument) {
      return cssText.replace(CSS_URL_RX, function(m, pre, url, post) {
        return pre + '\'' +
          resolve(url.replace(/["']/g, ''), ownerDocument) +
          '\'' + post;
      });
    }

    // url fixup for urls in an element's attributes made relative to
    // ownerDoc's base url
    function resolveAttrs(element, ownerDocument) {
      for (var name in URL_ATTRS) {
        var a$ = URL_ATTRS[name];
        for (var i=0, l=a$.length, a, at, v; (i<l) && (a=a$[i]); i++) {
          if (name === '*' || element.localName === name) {
            at = element.attributes[a];
            v = at && at.value;
            if (v && (v.search(BINDING_RX) < 0)) {
              at.value = (a === 'style') ?
                resolveCss(v, ownerDocument) :
                resolve(v, ownerDocument);
            }
          }
        }
      }
    }

    function resolve(url, ownerDocument) {
      // do not resolve '#' links, they are used for routing
      if (url && ABS_URL.test(url)) {
        return url;
      }
      var resolver = getUrlResolver(ownerDocument);
      resolver.href = url;
      return resolver.href || url;
    }

    var tempDoc;
    var tempDocBase;
    function resolveUrl(url, baseUri) {
      if (!tempDoc) {
        tempDoc = document.implementation.createHTMLDocument('temp');
        tempDocBase = tempDoc.createElement('base');
        tempDoc.head.appendChild(tempDocBase);
      }
      tempDocBase.href = baseUri;
      return resolve(url, tempDoc);
    }

    function getUrlResolver(ownerDocument) {
      return ownerDocument.__urlResolver ||
        (ownerDocument.__urlResolver = ownerDocument.createElement('a'));
    }

    var CSS_URL_RX = /(url\()([^)]*)(\))/g;
    var URL_ATTRS = {
      '*': ['href', 'src', 'style', 'url'],
      form: ['action']
    };
    var ABS_URL = /(^\/)|(^#)|(^[\w-\d]*:)/;
    var BINDING_RX = /\{\{|\[\[/;

    // exports
    Polymer.ResolveUrl = {
      resolveCss: resolveCss,
      resolveAttrs: resolveAttrs,
      resolveUrl: resolveUrl
    };

  })();
/**
 * Scans a template to produce an annotation list that that associates
 * metadata culled from markup with tree locations
 * metadata and information to associate the metadata with nodes in an instance.
 *
 * Supported expressions include:
 *
 * Double-mustache annotations in text content. The annotation must be the only
 * content in the tag, compound expressions are not supported.
 *
 *     <[tag]>{{annotation}}<[tag]>
 *
 * Double-escaped annotations in an attribute, either {{}} or [[]].
 *
 *     <[tag] someAttribute="{{annotation}}" another="[[annotation]]"><[tag]>
 *
 * `on-` style event declarations.
 *
 *     <[tag] on-<event-name>="annotation"><[tag]>
 *
 * Note that the `annotations` feature does not implement any behaviors
 * associated with these expressions, it only captures the data.
 *
 * Generated data-structure:
 *
 *     [
 *       {
 *         id: '<id>',
 *         events: [
 *           {
 *             name: '<name>'
 *             value: '<annotation>'
 *           }, ...
 *         ],
 *         bindings: [
 *           {
 *             kind: ['text'|'attribute'],
 *             mode: ['{'|'['],
 *             name: '<name>'
 *             value: '<annotation>'
 *           }, ...
 *         ],
 *         // TODO(sjmiles): this is annotation-parent, not node-parent
 *         parent: <reference to parent annotation object>,
 *         index: <integer index in parent's childNodes collection>
 *       },
 *       ...
 *     ]
 *
 * @class Annotations feature
 */
(function() {

  'use strict';

  // null-array (shared empty array to avoid null-checks)
  const emptyArray = [];

  let bindingRegex = (function() {
    let IDENT  = '(?:' + '[a-zA-Z_$][\\w.:$\\-*]*' + ')';
    let NUMBER = '(?:' + '[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?' + ')';
    let SQUOTE_STRING = '(?:' + '\'(?:[^\'\\\\]|\\\\.)*\'' + ')';
    let DQUOTE_STRING = '(?:' + '"(?:[^"\\\\]|\\\\.)*"' + ')';
    let STRING = '(?:' + SQUOTE_STRING + '|' + DQUOTE_STRING + ')';
    let ARGUMENT = '(?:' + IDENT + '|' + NUMBER + '|' +  STRING + '\\s*' + ')';
    let ARGUMENTS = '(?:' + ARGUMENT + '(?:,\\s*' + ARGUMENT + ')*' + ')';
    let ARGUMENT_LIST = '(?:' + '\\(\\s*' +
                                  '(?:' + ARGUMENTS + '?' + ')' +
                                '\\)\\s*' + ')';
    let BINDING = '(' + IDENT + '\\s*' + ARGUMENT_LIST + '?' + ')'; // Group 3
    let OPEN_BRACKET = '(\\[\\[|{{)' + '\\s*';
    let CLOSE_BRACKET = '(?:]]|}})';
    let NEGATE = '(?:(!)\\s*)?'; // Group 2
    let EXPRESSION = OPEN_BRACKET + NEGATE + BINDING + CLOSE_BRACKET;
    return new RegExp(EXPRESSION, "g");
  })();

  let insertionPointTag = 'slot';
  let currentTemplate;

  function parseTemplateAnnotations(template) {
    // TODO(kschaaf): File issue and/or remove when fixed
    // hold a reference to content as _content to prevent odd Chrome gc issue
    // nested templates also may receive their content as _content
    let content = (template._content = template._content || template.content);
    // since a template may be re-used, memo-ize notes.
    if (!content._notes) {
      content._notes = [];
      // TODO(sorvell): whitespace and processAnnotations need to be factored
      // into plugins
      // TODO(kschaaf): template should be threaded through rather than implied state
      currentTemplate = currentTemplate || template;
      parseNodeAnnotations(content, content._notes,
        template.hasAttribute('strip-whitespace'));
    }
    return content._notes;
  }

  // add annotations gleaned from subtree at `node` to `list`
  function parseNodeAnnotations(node, list, stripWhiteSpace) {
    return node.nodeType === Node.TEXT_NODE ?
      parseTextNodeAnnotation(node, list) :
        // TODO(sjmiles): are there other nodes we may encounter
        // that are not TEXT_NODE but also not ELEMENT?
        parseElementAnnotations(node, list, stripWhiteSpace);
  }

  // TODO(kschaaf): We could modify this to allow an escape mechanism by
  // looking for the escape sequence in each of the matches and converting
  // the part back to a literal type, and then bailing if only literals
  // were found
  function parseBindings(text) {
    let parts = [];
    let lastIndex = 0;
    let m;
    // Example: "literal1{{prop}}literal2[[!compute(foo,bar)]]final"
    // Regex matches:
    //        Iteration 1:  Iteration 2:
    // m[1]: '{{'          '[['
    // m[2]: ''            '!'
    // m[3]: 'prop'        'compute(foo,bar)'
    while ((m = bindingRegex.exec(text)) !== null) {
      // Add literal part
      if (m.index > lastIndex) {
        parts.push({literal: text.slice(lastIndex, m.index)});
      }
      // Add binding part
      // Mode (one-way or two)
      let mode = m[1][0];
      let negate = Boolean(m[2]);
      let value = m[3].trim();
      let customEvent, notifyEvent, colon;
      if (mode == '{' && (colon = value.indexOf('::')) > 0) {
        notifyEvent = value.substring(colon + 2);
        value = value.substring(0, colon);
        customEvent = true;
      }
      parts.push({
        compoundIndex: parts.length,
        value: value,
        mode: mode,
        negate: negate,
        event: notifyEvent,
        customEvent: customEvent
      });
      lastIndex = bindingRegex.lastIndex;
    }
    // Add a final literal part
    if (lastIndex && lastIndex < text.length) {
      let literal = text.substring(lastIndex);
      if (literal) {
        parts.push({
          literal: literal
        });
      }
    }
    if (parts.length) {
      return parts;
    }
  }

  function literalFromParts(parts) {
    let s = '';
    for (let i=0; i<parts.length; i++) {
      let literal = parts[i].literal;
      s += literal || '';
    }
    return s;
  }

  // add annotations gleaned from TextNode `node` to `list`
  function parseTextNodeAnnotation(node, list) {
    let parts = parseBindings(node.textContent);
    if (parts) {
      // Initialize the textContent with any literal parts
      // NOTE: default to a space here so the textNode remains; some browsers
      // (IE) evacipate an empty textNode following cloneNode/importNode.
      node.textContent = literalFromParts(parts) || ' ';
      let note = {
        bindings: [{
          kind: 'text',
          name: 'textContent',
          parts: parts,
          isCompound: parts.length !== 1
        }]
      };
      list.push(note);
      return note;
    }
  }

  // add annotations gleaned from Element `node` to `list`
  function parseElementAnnotations(element, list, stripWhiteSpace) {
    let note = {
      bindings: [],
      events: []
    };
    if (element.localName === insertionPointTag) {
      list._hasInsertionPoint = true;
    }
    parseChildNodesAnnotations(element, note, list, stripWhiteSpace);
    // TODO(sjmiles): is this for non-ELEMENT nodes? If so, we should
    // change the contract of this method, or filter these out above.
    if (element.attributes) {
      parseNodeAttributeAnnotations(element, note, list);
      // TODO(sorvell): ad hoc callback for doing work on elements while
      // leveraging annotator's tree walk.
      // Consider adding an node callback registry and moving specific
      // processing out of this module.
      prepElement(element);
    }
    if (note.bindings.length || note.events.length || note.id) {
      list.push(note);
    }
    return note;
  }

  // add annotations gleaned from children of `root` to `list`, `root`'s
  // `note` is supplied as it is the note.parent of added annotations
  function parseChildNodesAnnotations(root, note, list, stripWhiteSpace) {
    if (root.firstChild) {
      let node = root.firstChild;
      let i = 0;
      while (node) {
        // BREAKME(kschaaf): pseudo-bc auto-wrapper for template type extensions
        if (node.localName === 'template') {
          let t = node;
          let is = t.getAttribute('is');
          // stamp `<dom-*>` elements
          if (is && is.indexOf('dom-') === 0) {
            t.removeAttribute('is');
            node = t.ownerDocument.createElement(is);
            root.replaceChild(node, t);
            node.appendChild(t);
            while(t.attributes.length) {
              node.setAttribute(t.attributes[0].name, t.attributes[0].value);
              t.removeAttribute(t.attributes[0].name);
            }
          }
        }
        if (node.localName === 'template' &&
          !node.hasAttribute('preserve-content')) {
          parseTemplate(node, i, list, note);
        }
        // collapse adjacent textNodes: fixes an IE issue that can cause
        // text nodes to be inexplicably split =(
        // note that root.normalize() should work but does not so we do this
        // manually.
        let next = node.nextSibling;
        if (node.nodeType === Node.TEXT_NODE) {
          let n = next;
          while (n && (n.nodeType === Node.TEXT_NODE)) {
            node.textContent += n.textContent;
            next = n.nextSibling;
            root.removeChild(n);
            n = next;
          }
          // optionally strip whitespace
          if (stripWhiteSpace && !node.textContent.trim()) {
            root.removeChild(node);
            // decrement index since node is removed
            i--;
          }
        }
        // if this node didn't get evacipated, parse it.
        if (node.parentNode) {
          let childAnnotation = parseNodeAnnotations(node, list,
            stripWhiteSpace);
          if (childAnnotation) {
            childAnnotation.parent = note;
            childAnnotation.index = i;
          }
        }
        node = next;
        i++;
      }
    }
  }

  // 1. Parse annotations from the template and memoize them on
  //    content._notes (recurses into nested templates)
  // 2. Remove template.content and store it in annotation list, where it
  //    will be the responsibility of the host to set it back to the template
  //    (this is both an optimization to avoid re-stamping nested template
  //    children and avoids a bug in Chrome where nested template children
  //    upgrade)
  function parseTemplate(node, index, list, parent) {
    let content = document.createDocumentFragment();
    content._notes = parseTemplateAnnotations(node);
    content.appendChild(node.content);
    list.push({
      bindings: emptyArray,
      events: emptyArray,
      templateContent: content,
      parent: parent,
      index: index
    });
  }

  // add annotation data from attributes to the `annotation` for node `node`
  // TODO(sjmiles): the distinction between an `annotation` and
  // `annotation data` is not as clear as it could be
  function parseNodeAttributeAnnotations(node, annotation) {
    // Make copy of original attribute list, since the order may change
    // as attributes are added and removed
    let attrs = Array.prototype.slice.call(node.attributes);
    for (let i=attrs.length-1, a; (a=attrs[i]); i--) {
      let n = a.name;
      let v = a.value;
      let b;
      // events (on-*)
      if (n.slice(0, 3) === 'on-') {
        node.removeAttribute(n);
        annotation.events.push({
          name: n.slice(3),
          value: v
        });
      }
      // bindings (other attributes)
      else if ((b = parseNodeAttributeAnnotation(node, n, v))) {
        annotation.bindings.push(b);
      }
      // static id
      else if (n === 'id') {
        annotation.id = v;
      }
    }
  }

  // construct annotation data from a generic attribute, or undefined
  function parseNodeAttributeAnnotation(node, name, value) {
    let parts = parseBindings(value);
    if (parts) {
      // Attribute or property
      let origName = name;
      let kind = 'property';
      if (name[name.length-1] == '$') {
        name = name.slice(0, -1);
        kind = 'attribute';
      }
      // Initialize attribute bindings with any literal parts
      let literal = literalFromParts(parts);
      if (literal && kind == 'attribute') {
        node.setAttribute(name, literal);
      }
      // Clear attribute before removing, since IE won't allow removing
      // `value` attribute if it previously had a value (can't
      // unconditionally set '' before removing since attributes with `$`
      // can't be set using setAttribute)
      if (node.localName === 'input' && origName === 'value') {
        node.setAttribute(origName, '');
      }
      // Remove annotation
      node.removeAttribute(origName);
      // Case hackery: attributes are lower-case, but bind targets
      // (properties) are case sensitive. Gambit is to map dash-case to
      // camel-case: `foo-bar` becomes `fooBar`.
      // Attribute bindings are excepted.
      let propertyName = Polymer.CaseMap.dashToCamelCase(name);
      if (kind === 'property') {
        name = propertyName;
      }
      return {
        kind: kind,
        name: name,
        propertyName: propertyName,
        parts: parts,
        literal: literal,
        isCompound: parts.length !== 1
      };
    }
  }

  // TODO(sorvell): this should be factored into a plugin
  function prepElement(element) {
    Polymer.ResolveUrl.resolveAttrs(element, currentTemplate.ownerDocument);
  }

  Polymer.Annotations = Polymer.Utils.dedupingMixin(function(superClass) {

    return class Annotations extends superClass {

      // preprocess-time

      // construct and return a list of annotation records
      // by scanning `template`'s content
      //
      // TODO(sorvell): This should just crawl over a template and call
      // a supplied list of callbacks.
      _parseTemplateAnnotations(template) {
        return parseTemplateAnnotations(template);
      }

      // instance-time
      // TODO(sorvell): consider trying to use QS instead of this proprietary
      // search. This would require some unique way to identify a node, a guid.
      // Is this faster? simpler? Is that worth polluting the node?
      _findTemplateAnnotatedNode(root, note) {
        // recursively ascend tree until we hit root
        let parent = note.parent && this._findTemplateAnnotatedNode(root,
          note.parent);
        // unwind the stack, returning the indexed node at each level
        if (parent) {
          // note: marginally faster than indexing via childNodes
          // (http://jsperf.com/childnodes-lookup)
          for (let n=parent.firstChild, i=0; n; n=n.nextSibling) {
            if (note.index === i++) {
              return n;
            }
          }
        } else {
          return root;
        }
      }

    }

  });

})();
(function() {

  'use strict';

  /**
   * Scans a template to produce an annotation object that stores expression
   * metadata along with information to associate the metadata with nodes in an
   * instance.
   *
   * Elements with `id` in the template are noted and marshaled into an
   * the `$` hash in an instance.
   *
   * Example
   *
   *     &lt;template>
   *       &lt;div id="foo">&lt;/div>
   *     &lt;/template>
   *     &lt;script>
   *      Polymer({
   *        task: function() {
   *          this.$.foo.style.color = 'red';
   *        }
   *      });
   *     &lt;/script>
   *
   * Other expressions that are noted include:
   *
   * Double-mustache annotations in text content. The annotation must be the only
   * content in the tag, compound expressions are not (currently) supported.
   *
   *     <[tag]>{{path.to.host.property}}<[tag]>
   *
   * Double-mustache annotations in an attribute.
   *
   *     <[tag] someAttribute="{{path.to.host.property}}"><[tag]>
   *
   * Only immediate host properties can automatically trigger side-effects.
   * Setting `host.path` in the example above triggers the binding, setting
   * `host.path.to.host.property` does not.
   *
   * `on-` style event declarations.
   *
   *     <[tag] on-<event-name>="{{hostMethodName}}"><[tag]>
   *
   * Note: **the `annotations` feature does not actually implement the behaviors
   * associated with these expressions, it only captures the data**.
   *
   * Other optional features contain actual data implementations.
   *
   * @class standard feature: annotations
   */

  /*

  Scans a template to produce an annotation map that stores expression metadata
  and information that associates the metadata to nodes in a template instance.

  Supported annotations are:

    * id attributes
    * binding annotations in text nodes
      * double-mustache expressions: {{expression}}
      * double-bracket expressions: [[expression]]
    * binding annotations in attributes
      * attribute-bind expressions: name="{{expression}} || [[expression]]"
      * property-bind expressions: name*="{{expression}} || [[expression]]"
      * property-bind expressions: name:="expression"
    * event annotations
      * event delegation directives: on-<eventName>="expression"

  Generated data-structure:

    [
      {
        id: '<id>',
        events: [
          {
            mode: ['auto'|''],
            name: '<name>'
            value: '<expression>'
          }, ...
        ],
        bindings: [
          {
            kind: ['text'|'attribute'|'property'],
            mode: ['auto'|''],
            name: '<name>'
            value: '<expression>'
          }, ...
        ],
        // TODO(sjmiles): confusingly, this is annotation-parent, not node-parent
        parent: <reference to parent annotation>,
        index: <integer index in parent's childNodes collection>
      },
      ...
    ]

  TODO(sjmiles): this module should produce either syntactic metadata
  (e.g. double-mustache, double-bracket, star-attr), or semantic metadata
  (e.g. manual-bind, auto-bind, property-bind). Right now it's half and half.

  */

  // construct `$` map (from id annotations)
  function applyIdToMap(inst, map, dom, note) {
    if (note.id) {
      map[note.id] = inst._findTemplateAnnotatedNode(dom, note);
    }
  }

  // install event listeners (from event annotations)
  function applyEventListener(inst, dom, note, host) {
    if (note.events && note.events.length) {
      var node = inst._findTemplateAnnotatedNode(dom, note);
      for (var j=0, e$=note.events, e; (j<e$.length) && (e=e$[j]); j++) {
        inst._addMethodEventListenerToNode(node, e.name, e.value, host);
      }
    }
  }

  // push configuration references at configure time
  function applyTemplateContent(inst, dom, note) {
    if (note.templateContent) {
      var node = inst._findTemplateAnnotatedNode(dom, note);
      node._content = note.templateContent;
    }
  }

  Polymer.TemplateStamp = Polymer.Utils.dedupingMixin(function(superClass) {

    return class TemplateStamp extends Polymer.Annotations(Polymer.EventListeners(superClass)) {

      constructor() {
        super();
        this.$ = null;
      }

      _stampTemplate(template) {
        // Polyfill support: bootstrap the template if it has not already been
        if (template && !template.content &&
            window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
          HTMLTemplateElement.decorate(template);
        }
        var notes = this._parseTemplateAnnotations(template);
        var dom = document.importNode(template._content || template.content, true);
        // NOTE: ShadyDom optimization indicating there is an insertion point
        dom.__noInsertionPoint = !notes._hasInsertionPoint;
        this.$ = {};
        for (var i=0, l=notes.length, note; (i<l) && (note=notes[i]); i++) {
          applyIdToMap(this, this.$, dom, note);
          applyTemplateContent(this, dom, note);
          applyEventListener(this, dom, note, this);
        }
        return dom;
      }

    }

  });

})();
Polymer.Path = {

    root: function(path) {
      var dotIndex = path.indexOf('.');
      if (dotIndex === -1) {
        return path;
      }
      return path.slice(0, dotIndex);
    },

    isDeep: function(path) {
      return path.indexOf('.') !== -1;
    },

    // Given `base` is `foo.bar`, `foo` is an ancestor, `foo.bar` is not
    isAncestor: function(base, path) {
      //     base.startsWith(path + '.');
      return base.indexOf(path + '.') === 0;
    },

    // Given `base` is `foo.bar`, `foo.bar.baz` is an descendant
    isDescendant: function(base, path) {
      //     path.startsWith(base + '.');
      return path.indexOf(base + '.') === 0;
    },

    // can be read as:  from  to       path
    translate: function(base, newBase, path) {
      // Defense?
      return newBase + path.slice(base.length);
    },

    matches: function(base, path) {
      return (base === path) ||
             this.isAncestor(base, path) ||
             this.isDescendant(base, path);
    },

    // Converts array-based paths to flattened path, optionally split into array
    normalize: function(path, split) {
      if (Array.isArray(path)) {
        var parts = [];
        for (var i=0; i<path.length; i++) {
          var args = path[i].toString().split('.');
          for (var j=0; j<args.length; j++) {
            parts.push(args[j]);
          }
        }
        return split ? parts : parts.join('.');
      } else {
        return split ? path.toString().split('.') : path;
      }
    },

    get: function(root, path, info) {
      var prop = root;
      var parts = this.normalize(path, true);
      // Loop over path parts[0..n-1] and dereference
      for (var i=0; i<parts.length; i++) {
        if (!prop) {
          return;
        }
        var part = parts[i];
        prop = prop[part];
      }
      if (info) {
        info.path = parts.join('.');
      }
      return prop;
    },

    set: function(root, path, value) {
      var prop = root;
      var parts = this.normalize(path, true);
      var last = parts[parts.length-1];
      if (parts.length > 1) {
        // Loop over path parts[0..n-2] and dereference
        for (var i=0; i<parts.length-1; i++) {
          var part = parts[i];
          prop = prop[part];
          if (!prop) {
            return;
          }
        }
        // Set value to object at end of path
        prop[last] = value;
      } else {
        // Simple property set
        prop[path] = value;
      }
      return parts.join('.');
    }

  };
(function() {

  'use strict';

  // Save map of native properties; this forms a blacklist or properties
  // that won't have their values "saved" by `saveAccessorValue`, since
  // reading from an HTMLElement accessor from the context of a prototype throws
  const nativeProperties = {};
  let proto = HTMLElement.prototype;
  while (proto) {
    let props = Object.getOwnPropertyNames(proto);
    for (let i=0; i<props.length; i++) {
      nativeProperties[props[i]] = true;
    }
    proto = Object.getPrototypeOf(proto);
  }

  /**
   * Used to save the value of a property that will be overridden with
   * an accessor. If the `model` is a prototype, the values will be saved
   * in `__dataProto`, and it's up to the user (or downstream mixin) to
   * decide how/when to set these values back into the accessors.
   * If `model` is already an instance (it has a `__data` property), then
   * the value will be set as a pending property, meaning the user should
   * call `_invalidateProperties` or `_flushProperties` to take effect
   *
   * @param {Object} model Prototype or instance
   * @param {string} property Name of property
   * @private
   */
  function saveAccessorValue(model, property) {
    // Don't read/store value for any native properties since they could throw
    if (!nativeProperties[property]) {
      let value = model[property];
      if (value !== undefined) {
        if (model.__data) {
          // Adding accessor to instance; update the property
          // It is the user's responsibility to call _flushProperties
          model._setPendingProperty(property, value);
        } else {
          // Adding accessor to proto; save proto's value for instance-time use
          if (!model.__dataProto) {
            model.__dataProto = {};
          } else if (!model.hasOwnProperty('__dataProto')) {
            model.__dataProto = Object.create(model.__dataProto);
          }
          model.__dataProto[property] = value;          
        }
      }      
    }
  }

  Polymer.PropertyAccessors = Polymer.Utils.dedupingMixin(function(superClass) {

    return class PropertyAccessors extends superClass {

      constructor() {
        super();
        this._initializeProperties();
      }

      /**
       * Initializes the local storage for property accessors.
       *
       * Override to initialize with e.g. default values by setting values into
       * accessors.
       *
       * @protected
       */
      _initializeProperties() {
        this.__data = {};
        this.__dataPending = null;
        this.__dataOld = null;
        this.__dataInvalid = false;
      }

      /**
       * Creates a setter/getter pair for the named property with its own
       * local storage.  The getter returns the value in the local storage,
       * and the setter calls `_setProperty`, which updates the local storage
       * for the property and enqueues a `_propertiesChanged` callback.
       *
       * This method may be called on a prototype or an instance.  Calling
       * this method may overwrite a property value that already exists on
       * the prototype/instance by creating the accessor.  When calling on
       * a prototype, any overwritten values are saved in `__dataProto`,
       * and it is up to the subclasser to decide how/when to set those
       * properties back into the accessor.  When calling on an instance,
       * the overwritten value is set via `_setPendingProperty`, and the
       * user should call `_invalidateProperties` or `_flushProperties`
       * for the values to take effect.
       *
       * @param {string} property Name of the property
       * @param {boolean=} readOnly When true, no setter is created; the
       *   protected `_setProperty` function must be used to set the property
       * @protected
       */
      _createPropertyAccessor(property, readOnly) {
        saveAccessorValue(this, property);
        Object.defineProperty(this, property, {
          get: function() {
            return this.__data && this.__data[property];
          },
          set: readOnly ? function() { } : function(value) {
            this._setProperty(property, value);
          }
        });
      }

      /**
       * Updates the local storage for a property (via `_setPendingProperty`)
       * and enqueues a `_proeprtiesChanged` callback.
       *
       * @param {string} property Name of the property
       * @param {*} value Value to set
       * @protected
       */
      _setProperty(property, value) {
        if (this._setPendingProperty(property, value)) {
          this._invalidateProperties();
        }
      }

      /**
       * Updates the local storage for a property, records the previous value,
       * and adds it to the set of "pending changes" that will be passed to the
       * `_propertiesChanged` callback.  This method does not enqueue the
       * `_propertiesChanged` callback.
       *
       * @param {string} property Name of the property
       * @param {*} value Value to set
       * @protected
       */
      _setPendingProperty(property, value) {
        let old = this.__data[property];
        if (this._shouldPropChange(property, value, old)) {
          if (!this.__dataPending) {
            this.__dataPending = {};
            this.__dataOld = {};
          }
          // Ensure old is captured from the last turn
          if (!(property in this.__dataOld)) {
            this.__dataOld[property] = old;
          }
          this.__data[property] = value;
          this.__dataPending[property] = value;
          return true;
        }
      }

      /**
       * Returns true if the specified property has a pending change.
       *
       * @param {string} prop Property name
       * @return {boolean} True if property has a pending change
       * @protected
       */
      _isPropertyPending(prop) {
        return this.__dataPending && (prop in this.__dataPending);
      }

      /**
       * Marks the properties as invalid, and enqueues an async
       * `_propertiesChanged` callback.
       *
       * @protected
       */
      _invalidateProperties() {
        if (!this.__dataInvalid) {
          this.__dataInvalid = true;
          Promise.resolve().then(() => {
            if (this.__dataInvalid) {
              this.__dataInvalid = false;
              this._flushProperties();
            }
          });
        }
      }

      /**
       * Calls the `_propertiesChanged` callback with the current set of
       * pending changes (and old values recorded when pending changes were
       * set), and resets the pending set of changes.
       *
       * @protected
       */
      _flushProperties() {
        let oldProps = this.__dataOld;
        let changedProps = this.__dataPending;
        this.__dataPending = null;
        this._propertiesChanged(this.__data, changedProps, oldProps);
      }

      /**
       * Callback called when any properties with accessors created via 
       * `_createPropertyAccessor` have been set.
       *
       * @param {Object} currentProps Bag of all current accessor values
       * @param {Object} changedProps Bag of properties changed since the last
       *   call to `_propertiesChanged`
       * @param {Object} oldProps Bag of previous values for each property
       *   in `changedProps`
       * @protected
       */
      _propertiesChanged(currentProps, changedProps, oldProps) { // eslint-disable-line no-unused-vars
      }

      /**
       * Method called to determine whether a property value should be
       * considered as a change and cause the `_propertiesChanged` callback
       * to be enqueued.
       *
       * The default implementation returns `true` for primitive types if a
       * strict equality check fails, and returns `true` for all Object/Arrays.
       * The method always returns false for `NaN`.
       *
       * Override this method to e.g. provide stricter checking for
       * Objects/Arrays when using immutable patterns.
       *
       * @param {type} name Description
       * @return {boolean} Whether the property should be considered a change
       *   and enqueue a `_proeprtiesChanged` callback
       * @protected
       */
      _shouldPropChange(property, value, old) {
        return (
          // Strict equality check for primitives
          (old !== value && 
           // This ensures old:NaN, value:NaN always returns false
           (old === old || value === value)) ||
          // Objects/Arrays always pass
          (typeof value == 'object')
        );
      }

    }

  });

})();
(function() {

  'use strict';

  var caseMap = Polymer.CaseMap;

  Polymer.Attributes = Polymer.Utils.dedupingMixin(function(superClass) {

    return class Attributes extends superClass {

      constructor() {
        super();
        this.__serializing = false;
      }

      /**
       * Ensures the element has the given attribute. If it does not,
       * assigns the given value to the attribute.
       *
       *
       * @method _ensureAttribute
       * @param {string} attribute Name of attribute to ensure is set.
       * @param {string} value of the attribute.
       */
      _ensureAttribute(attribute, value) {
        if (!this.hasAttribute(attribute)) {
          this._valueToNodeAttribute(this, value, attribute);
        }
      }

      /**
       * Deserializes an attribute to its associated property.
       *
       * This method calls the `_deserializeAttribute` method to convert the string to
       * a typed value.
       *
       * @method _attributeToProperty
       * @param {string} attribute Name of attribute to deserialize.
       * @param {string} value of the attribute.
       * @param {*} type type to deserialize to.
       */
      _attributeToProperty(attribute, value, type) {
        // Don't deserialize back to property if currently reflecting
        if (!this.__serializing) {
          var property = caseMap.dashToCamelCase(attribute);
          this[property] = this._deserializeAttribute(value, type);
        }
      }

      /**
       * Serializes a property to its associated attribute.
       *
       * @method _propertyToAttribute
       * @param {string} property Property name to reflect.
       * @param {*=} attribute Attribute name to reflect.
       * @param {*=} value Property value to refect.
       */
      _propertyToAttribute(property, attribute, value) {
        this.__serializing = true;
        value = (value === undefined) ? this[property] : value;
        this._valueToNodeAttribute(this, value,
          attribute || caseMap.camelToDashCase(property));
        this.__serializing = false;
      }

      /**
       * Sets a typed value to an HTML attribute on a node.
       *
       * This method calls the `_serializeAttribute` method to convert the typed
       * value to a string.  If the `_serializeAttribute` method returns `undefined`,
       * the attribute will be removed (this is the default for boolean
       * type `false`).
       *
       * @method _valueToAttribute
       * @param {Element=} node Element to set attribute to.
       * @param {*} value Value to serialize.
       * @param {string} attribute Attribute name to serialize to.

       */
      _valueToNodeAttribute(node, value, attribute) {
        var str = this._serializeAttribute(value);
        if (str === undefined) {
          node.removeAttribute(attribute);
        } else {
          node.setAttribute(attribute, str);
        }
      }

      /**
       * Converts a typed value to a string.
       *
       * This method is called by Polymer when setting JS property values to
       * HTML attributes.  Users may override this method on Polymer element
       * prototypes to provide serialization for custom types.
       *
       * @method _serializeAttribute
       * @param {*} value Property value to serialize.
       * @return {string} String serialized from the provided property value.
       */
      _serializeAttribute(value) {
        /* eslint-disable no-fallthrough */
        switch (typeof value) {
          case 'boolean':
            return value ? '' : undefined;

          case 'object':
            if (value instanceof Date) {
              return value;
            } else if (value) {
              try {
                return JSON.stringify(value);
              } catch(x) {
                return '';
              }
            }

          default:
            return value != null ? value : undefined;
        }
      }

      /**
       * Converts a string to a typed value.
       *
       * This method is called by Polymer when reading HTML attribute values to
       * JS properties.  Users may override this method on Polymer element
       * prototypes to provide deserialization for custom `type`s.  Note,
       * the `type` argument is the value of the `type` field provided in the
       * `properties` configuration object for a given property, and is
       * by convention the constructor for the type to deserialize.
       *
       * Note: The return value of `undefined` is used as a sentinel value to
       * indicate the attribute should be removed.
       *
       * @method _deserializeAttribute
       * @param {string} value Attribute value to deserialize.
       * @param {*} type Type to deserialize the string to.
       * @return {*} Typed value deserialized from the provided string.
       */
      _deserializeAttribute(value, type) {
        switch (type) {
          case Number:
            value = Number(value);
            break;

          case Boolean:
            value = (value !== null);
            break;

          case Object:
            try {
              value = JSON.parse(value);
            } catch(x) {
              // allow non-JSON literals like Strings and Numbers
            }
            break;

          case Array:
            try {
              value = JSON.parse(value);
            } catch(x) {
              value = null;
              console.warn('Polymer::Attributes: couldn`t decode Array as JSON');
            }
            break;

          case Date:
            value = new Date(value);
            break;

          case String:
          default:
            break;
        }
        return value;
      }
      /* eslint-enable no-fallthrough */
    }

  });


})();
(function() {

  'use strict';

  const CaseMap = Polymer.CaseMap;

  // Property effect types; effects are stored on the prototype using these keys
  const TYPES = {
    ANY: '__propertyEffects',
    COMPUTE: '__computeEffects',
    REFLECT: '__reflectEffects',
    NOTIFY: '__notifyEffects',
    PROPAGATE: '__propagateEffects',
    OBSERVE: '__observeEffects',
    READ_ONLY: '__readOnly'
  }

  /**
   * Ensures that the model has an own-property map of effects for the given type.
   * The model may be a prototype or an instance.
   * 
   * Property effects are stored as arrays of effects by property in a map,
   * by named type on the model. e.g.
   *
   *   __computeEffects: {
   *     foo: [ ... ],
   *     bar: [ ... ]
   *   }
   *
   * If the model does not yet have an effect map for the type, one is created
   * and returned.  If it does, but it is not an own property (i.e. the
   * prototype had effects), the the map is deeply cloned and the copy is
   * set on the model and returned, ready for new effects to be added. 
   *
   * @param {Object} model Prototype or instance
   * @param {string} type Property effect type
   * @return {Object} The own-property map of effects for the given type
   * @private
   */
  function ensureOwnEffectMap(model, type) {
    let effects = model[type];
    if (!effects) {
      effects = model[type] = {};
    } else if (!model.hasOwnProperty(type)) {
      effects = model[type] = Object.create(model[type]);
      for (let p in effects) {
        // TODO(kschaaf): replace with fast array copy #!%&$!
        effects[p] = effects[p].slice();
      }
    }
    return effects;
  }

  // -- effects ----------------------------------------------

  /**
   * Runs all effects for the given property on an instance.
   *
   * @param {Object} inst The instance with effects to run
   * @param {string} property Name of property
   * @param {*} value Current value of property
   * @param {*} old Previous value of property
   * @param {Object<string,Array>} effects List of effects
   * @private
   */
  function runEffects(inst, property, value, old, effects) {
    for (let i=0, l=effects.length, fx; (i<l) && (fx=effects[i]); i++) {
      if (Polymer.Path.matches(fx.path, property)) {
        fx.fn(inst, property, inst.__data[property], old, fx.info);
      }
    }
  }

  /**
   * Implements the "observer" effect.
   *
   * Calls the method with `info.methodName` on the instance, passing the
   * new and old values.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {*} value Current value of property
   * @param {*} old Previous value of property
   * @param {Object} info Effect metadata
   * @private
   */
  function runObserverEffect(inst, property, value, old, info) {
    let fn = inst[info.methodName];
    if (fn) {
      fn.call(inst, value, old);
    } else {
      console.warn('observer method `' + info.methodName + '` not defined');
    }
  }

  /**
   * Implements the "notify" effect.
   *
   * Dispatches a non-bubbling event named `info.eventName` on the instance
   * with a detail object containing the new `value`.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {*} value Current value of property
   * @param {*} old Previous value of property
   * @param {Object} info Effect metadata
   * @private
   */
  function runNotifyEffect(inst, path, value, old, info) {
    let detail = { value };
    if (info.property !== path) {
      detail.path = path;
    }
    inst._dispatchNotifyingEvent(new CustomEvent(info.eventName, { detail }))
  }

  /**
   * Implements the "reflect" effect.
   *
   * Sets the attribute named `info.attrName` to the given property value.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {*} value Current value of property
   * @param {*} old Previous value of property
   * @param {Object} info Effect metadata
   * @private
   */
  function runReflectEffect(inst, property, value, old, info) {
    inst._propertyToAttribute(property, info.attrName);
  }

  /**
   * Implements the "method observer" effect by running the method with the
   * values of the arguments specified in the `info` object.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {*} value Current value of property
   * @param {*} old Previous value of property
   * @param {Object} info Effect metadata
   * @private
   */
  function runMethodObserverEffect(inst, property, value, old, info) {
    runMethodEffect(inst, property, value, old, info);
  }

  /**
   * Implements the "computed property" effect by running the method with the
   * values of the arguments specified in the `info` object and setting the
   * return value to the computed property specified.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {*} value Current value of property
   * @param {*} old Previous value of property
   * @param {Object} info Effect metadata
   * @private
   */
  function runComputedEffect(inst, property, value, old, info) {
    var result = runMethodEffect(inst, property, value, old, info);
    var computedProp = info.methodInfo;
    inst._setPropertyFromComputation(computedProp, result);
  }

  // -- bindings / annotations ----------------------------------------------

  /**
   * Adds "annotation" property effects for the template annotation
   * ("note" for short) and node index specified.  These may either be normal
   * "annotation" effects (property/path bindings) or "annotation method"
   * effects, aka inline computing functions, depending on the type of binding
   * detailed in the note.
   *
   * @param {Object} model Prototype or instance
   * @param {Object} note Annotation note returned from Annotator
   * @param {number} index Index into `__dataNodes` list of annotated nodes that the
   *   note applies to
   * @private
   */
  function addAnnotationEffect(model, note, index) {
    for (let i=0; i<note.parts.length; i++) {
      let part = note.parts[i];
      if (part.signature) {
        addAnnotationMethodEffect(model, note, part, index);
      } else if (!part.literal) {
        if (note.kind === 'attribute' && note.name[0] === '-') {
          console.warn('Cannot set attribute ' + note.name +
            ' because "-" is not a valid attribute starting character');
        } else {
          model._addPropertyEffect(part.value, TYPES.PROPAGATE, {
            fn: runAnnotationEffect,
            info:  {
              kind: note.kind,
              index: index,
              name: note.name,
              propertyName: note.propertyName,
              value: part.value,
              isCompound: note.isCompound,
              compoundIndex: part.compoundIndex,
              event: part.event,
              customEvent: part.customEvent,
              negate: part.negate
            }
          });
        }
      }
    }
  }

  /**
   * Implements the "annotation" (property/path binding) effect.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {*} value Current value of property
   * @param {*} old Previous value of property
   * @param {Object} info Effect metadata
   * @private
   */
  function runAnnotationEffect(inst, path, value, old, info) {
    let node = inst.__dataNodes[info.index];
    // Subpath notification: transform path and set to client
    // e.g.: foo="{{obj.sub}}", path: 'obj.sub.prop', set 'foo.prop'=obj.sub.prop
    if ((path.length > info.value.length) &&
        (info.kind == 'property') && !info.isCompound &&
        node._hasPropertyEffect && node._hasPropertyEffect(info.name)) {
      path = Polymer.Path.translate(info.value, info.name, path);
      inst._setPropertyToNodeFromAnnotation(node, path, value);
    } else {
      // Root or deeper path was set; extract bound path value
      // e.g.: foo="{{obj.sub}}", path: 'obj', set 'foo'=obj.sub
      //   or: foo="{{obj.sub}}", path: 'obj.sub.prop', set 'foo'=obj.sub
      if (path != info.value) {
        value = Polymer.Path.get(inst, info.value);
        inst.__data[info.value] = value;
      }
      // Propagate value to child
      applyAnnotationValue(inst, info, value);
    }
  }

  /**
   * Sets the value for an "annotation" (binding) effect to a node,
   * either as a property or attribute.
   *
   * @param {Object} inst The instance owning the annotation effect
   * @param {Object} info Effect metadata
   * @param {*} value Value to set
   * @private
   */
  function applyAnnotationValue(inst, info, value) {
    let node = inst.__dataNodes[info.index];
    value = computeAnnotationValue(node, value, info);
    if (info.kind == 'attribute') {
      // Attribute binding
      inst._valueToNodeAttribute(node, value, info.name);
    } else {
      // Property binding
      let prop = info.name;
      if (node._hasPropertyEffect && node._hasPropertyEffect(prop)) {
        inst._setPropertyToNodeFromAnnotation(node, prop, value);
      } else if (inst._shouldPropChange(prop, node[prop], value)) {
        node[prop] = value;
      }
    }
  }

  /**
   * Transforms an "annotation" effect value based on compound & negation
   * effect metadata, as well as handling for special-case properties
   *
   * @param {Node} node Node the value will be set to
   * @param {*} value Value to set
   * @param {Object} info Effect metadata
   * @return {*} Transformed value to set
   * @private
   */
  function computeAnnotationValue(node, value, info) {
    if (info.negate) {
      value = !value;
    }
    if (info.isCompound) {
      let storage = node.__dataCompoundStorage[info.name];
      storage[info.compoundIndex] = value;
      value = storage.join('');
    }
    if (info.kind !== 'attribute') {
      // Some browsers serialize `undefined` to `"undefined"`
      if (info.name === 'textContent' ||
          (node.localName == 'input' && info.name == 'value')) {
        value = value == undefined ? '' : value;
      }
    }
    return value;
  }

  /**
   * Adds "annotation method" property effects for the template annotation
   * ("note" for short), part metadata, and node index specified.
   *
   * @param {Object} model Prototype or instance
   * @param {Object} note Annotation note returned from Annotator
   * @param {number} part The compound part metadata
   * @param {number} index Index into `__dataNodes` list of annotated nodes that the
   *   note applies to
   * @private
   */
  function addAnnotationMethodEffect(model, note, part, index) {
    createMethodEffect(model, part.signature, TYPES.PROPAGATE,
      runAnnotationMethodEffect, {
        index: index,
        isCompound: note.isCompound,
        compoundIndex: part.compoundIndex,
        kind: note.kind,
        name: note.name,
        negate: part.negate,
        part: part
      }, true
    );
  }

  /**
   * Implements the "annotation method" (inline computed function) effect.
   *
   * Runs the method with the values of the arguments specified in the `info`
   * object and setting the return value to the node property/attribute.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {*} value Current value of property
   * @param {*} old Previous value of property
   * @param {Object} info Effect metadata
   * @private
   */
  function runAnnotationMethodEffect(inst, property, value, old, info) {
    let val = runMethodEffect(inst, property, value, old, info);
    applyAnnotationValue(inst, info.methodInfo, val);
  }

  /**
   * Post-processes template annotations (notes for short) provided by the
   * Annotations library for use by the effects system:
   * - Parses bindings for methods into method `signature` objects
   * - Memoizes the root property for path bindings
   * - Recurses into nested templates and processes those templates and
   *   extracts any host properties, which are set to the template's
   *   `_content._hostProps` 
   * - Adds bindings from the host to <template> elements for any nested
   *   template's lexically bound "host properties"; template handling
   *   elements can then add accessors to the template for these properties
   *   to forward host properties into template instances accordingly.
   *
   * @param {Array<Object>} notes List of notes to process; the notes are
   *   modified in place.
   * @private
   */
  function processAnnotations(notes) {
    if (!notes._processed) {
      for (let i=0; i<notes.length; i++) {
        let note = notes[i];
        // Parse bindings for methods & path roots (models)
        for (let j=0; j<note.bindings.length; j++) {
          let b = note.bindings[j];
          for (let k=0; k<b.parts.length; k++) {
            let p = b.parts[k];
            if (!p.literal) {
              p.signature = parseMethod(p.value);
              if (!p.signature) {
                p.rootProperty = Polymer.Path.root(p.value);
              }
            }
          }
        }
        // Recurse into nested templates & bind host props
        if (note.templateContent) {
          processAnnotations(note.templateContent._notes);
          let hostProps = note.templateContent._hostProps =
            discoverTemplateHostProps(note.templateContent._notes);
          let bindings = [];
          for (let prop in hostProps) {
            bindings.push({
              index: note.index,
              kind: 'property',
              name: '_host_' + prop,
              parts: [{
                mode: '{',
                rootProperty: prop,
                value: prop
              }]
            });
          }
          note.bindings = note.bindings.concat(bindings);
        }
      }
      notes._processed = true;
    }
  }

  /**
   * Finds all property usage in templates (property/path bindings and function
   * arguments) and returns the path roots as keys in a map. Each outer template
   * merges inner _hostProps to propagate inner host property needs to outer
   * templates.
   *
   * @param {Array<Object>} notes List of notes to process for a given template
   * @return {Object<string,boolean>} Map of host properties that the template
   *   (or any nested templates) uses
   * @private
   */
  function discoverTemplateHostProps(notes) {
    let hostProps = {};
    for (let i=0, n; (i<notes.length) && (n=notes[i]); i++) {
      // Find all bindings to parent.* and spread them into _parentPropChain
      for (let j=0, b$=n.bindings, b; (j<b$.length) && (b=b$[j]); j++) {
        for (let k=0, p$=b.parts, p; (k<p$.length) && (p=p$[k]); k++) {
          if (p.signature) {
            let args = p.signature.args;
            for (let kk=0; kk<args.length; kk++) {
              let rootProperty = args[kk].rootProperty;
              if (rootProperty) {
                hostProps[rootProperty] = true;
              }
            }
            hostProps[p.signature.methodName] = true;
          } else {
            if (p.rootProperty) {
              hostProps[p.rootProperty] = true;
            }
          }
        }
      }
      // Merge child _hostProps into this _hostProps
      if (n.templateContent) {
        let templateHostProps = n.templateContent._hostProps;
        Polymer.Base.mixin(hostProps, templateHostProps);
      }
    }
    return hostProps;
  }

  /**
   * Returns true if a binding's metadata meets all the requirements to allow
   * 2-way binding, and therefore a <property>-changed event listener should be
   * added:
   * - used curly braces
   * - is a property (not attribute) binding
   * - is not a textContent binding
   * - is not compound
   *
   * @param {Object} binding Binding metadata
   * @return {boolean} True if 2-way listener should be added
   * @private
   */
  function shouldAddListener(binding) {
    return binding.name &&
           binding.kind != 'attribute' &&
           binding.kind != 'text' &&
           !binding.isCompound &&
           binding.parts[0].mode === '{';
  }

  /**
   * Sets up a prototypical `_bindListeners` metadata array to be used at
   * instance time to add event listeners for 2-way bindings.
   *
   * @param {Object} model Prototype (instances not currently supported)
   * @param {number} index Index into `__dataNodes` list of annotated nodes that the
   *   event should be added to
   * @param {string} property Property of target node to listen for changes
   * @param {string} path Host path that the change should be propagated to
   * @param {string=} event A custom event name to listen for (e.g. via the
   *   `{{prop::eventName}}` syntax)
   * @param {boolean=} negate Whether the notified value should be negated before
   *   setting to host path
   * @private
   */
  function addAnnotatedListener(model, index, property, path, event, negate) {
    if (!model._bindListeners) {
      model._bindListeners = [];
    }
    let eventName = event ||
      (CaseMap.camelToDashCase(property) + '-changed');
    model._bindListeners.push({
      index: index,
      property: property,
      path: path,
      event: eventName,
      negate: negate
    });
  }

  /**
   * Adds all 2-way binding notification listeners to a host based on
   * `_bindListeners` metadata recorded by prior calls to`addAnnotatedListener`
   *
   * @param {Object} inst Host element instance
   * @private
   */
  function setupBindListeners(inst) {
    let b$ = inst._bindListeners;
    for (let i=0, l=b$.length, info; (i<l) && (info=b$[i]); i++) {
      let node = inst.__dataNodes[info.index];
      addNotifyListener(node, inst, info);
    }
  }

  /**
   * Finds all bound nodes in the given `dom` fragment that were recorded in the
   * provided Annotator `notes` array and stores them in `__dataNodes` for this
   * instance.  The index of nodes in `__dataNodes` corresponds to the index
   * of a note in the `notes` array, and annotation effect metadata uses this
   * index to identify bound nodes when propagating data.
   *
   * Compound binding storage structures are also initialized onto the bound
   * nodes, and 2-way binding event listeners are also added.
   *
   * @param {Object} inst Instance that bas been previously bound
   * @param {DocumentFragment} dom Document fragment containing stamped nodes
   * @param {Array<Object>} notes Array of annotation notes provided by
   *   Polymer.Annotator
   * @private
   */
  function setupBindings(inst, dom, notes) {
    if (notes.length) {
      let nodes = new Array(notes.length);
      for (let i=0; i < notes.length; i++) {
        let note = notes[i];
        let node = nodes[i] = inst._findTemplateAnnotatedNode(dom, note);
        node.__dataHost = inst;
        if (note.bindings) {
          setupCompoundBinding(note, node);
        }
      }
      inst.__dataNodes = nodes;
    }
    if (inst._bindListeners) {
      setupBindListeners(inst);
    }
  }

  /**
   * Adds a 2-way binding notification event listener to the node specified
   *
   * @param {Object} node Child element to add listener to
   * @param {Object} inst Host element instance to handle notification event
   * @param {Object} info Listener metadata stored via addAnnotatedListener
   * @private
   */
  function addNotifyListener(node, inst, info) {
    node.addEventListener(info.event, function(e) {
      handleNotification(e, inst, info.property, info.path, info.negate);
    });
  }

  /**
   * Handler function for 2-way notification events. Receives context
   * information captured in the `addNotifyListener` closure from the
   * `_bindListeners` metadata.
   *
   * Sets the value of the notified property to the host property or path.  If
   * the event contained path information, translate that path to the host
   * scope's name for that path first.
   *
   * @param {Event} e Notification event (e.g. '<property>-changed')
   * @param {Object} inst Host element instance handling the notification event
   * @param {string} property Child element property that was bound
   * @param {string} path Host property/path that was bound 
   * @param {boolean} negate Whether the binding was negated
   * @private
   */
  function handleNotification(e, inst, property, path, negate) {
    let value;
    let targetPath = e.detail && e.detail.path;
    if (targetPath) {
      path = Polymer.Path.translate(property, path, targetPath);
      value = e.detail && e.detail.value;
    } else {
      value = e.target[property];
    }
    value = negate ? !value : value;
    inst._setPropertyFromNotification(path, value, e);
  }

  // -- for method-based effects (complexObserver & computed) --------------

  /**
   * Adds property effects for each argument in the method signature (and
   * optionally, for the method name if `dynamic` is true) that calls the
   * provided effect function.
   *
   * @param {Object} inst Prototype or instance
   * @param {Object} sig Method signature metadata
   * @param {Function} effectFn Function to run when arguments change
   * @param {boolean=} dynamic Whether the method name should be included as
   *   a dependency to the effect.
   * @private
   */
  function createMethodEffect(model, sig, type, effectFn, methodInfo, dynamic) {
    let info = {
      methodName: sig.methodName,
      args: sig.args,
      methodInfo: methodInfo,
      dynamicFn: dynamic
    };
    // TODO(sorvell): why still here?
    if (sig.static) {
      model._addPropertyEffect('__static__', type, {
        fn: effectFn, info: info
      });
    } else {
      for (let i=0, arg; (i<sig.args.length) && (arg=sig.args[i]); i++) {
        if (!arg.literal) {
          model._addPropertyEffect(arg.name, type, {
            fn: effectFn, info: info
          });
        }
      }
    }
    if (dynamic) {
      model._addPropertyEffect(sig.methodName, type, {
        fn: effectFn, info: info
      });
    }
  }

  /**
   * Calls a method with arguments marshaled from properties on the instance
   * based on the method signature contained in the effect metadata.
   *
   * Multi-property observers, computed properties, and inline computing
   * functions call this function to invoke the method, then use the return
   * value accordingly.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {*} value Current value of property
   * @param {*} old Previous value of property
   * @param {Object} info Effect metadata
   * @private
   */
  function runMethodEffect(inst, property, value, old, info) {
    // TODO(kschaaf): ideally rootDataHost would be a detail of Templatizer only
    let context = inst._rootDataHost || inst;
    let fn = context[info.methodName];
    if (fn) {
      let args = marshalArgs(inst.__data, info.args, property, value);
      return fn.apply(context, args);
    } else if (!info.dynamicFn) {
      console.warn('method `' + info.methodName + '` not defined');
    }
  }

  const emptyArray = [];

  /**
   * Parses an expression string for a method signature, and returns a metadata
   * describing the method in terms of `methodName`, `static` (whether all the
   * arguments are literals), and an array of `args`
   *
   * @param {string} expression The expression to parse
   * @return {?Object} The method metadata object if a method expression was
   *   found, otherwise `undefined`
   * @private
   */
  function parseMethod(expression) {
    // tries to match valid javascript property names
    let m = expression.match(/([^\s]+?)\(([\s\S]*)\)/);
    if (m) {
      let sig = { methodName: m[1], static: true };
      if (m[2].trim()) {
        // replace escaped commas with comma entity, split on un-escaped commas
        let args = m[2].replace(/\\,/g, '&comma;').split(',');
        return parseArgs(args, sig);
      } else {
        sig.args = emptyArray;
        return sig;
      }
    }
  }

  /**
   * Parses an array of arguments and sets the `args` property of the supplied
   * signature metadata object. Sets the `static` property to false if any
   * argument is a non-literal.
   *
   * @param {Array<string>} argList Array of argument names
   * @param {Object} sig Method signature metadata object
   * @return {Object} The updated signature metadata object
   * @private
   */
  function parseArgs(argList, sig) {
    sig.args = argList.map(function(rawArg) {
      let arg = parseArg(rawArg);
      if (!arg.literal) {
        sig.static = false;
      }
      return arg;
    }, this);
    return sig;
  }

  /**
   * Parses an individual argument, and returns an argument metadata object
   * with the following fields:
   *
   *   {
   *     value: 'prop',        // property/path or literal value
   *     literal: false,       // whether argument is a literal
   *     structured: false,    // whether the property is a path
   *     rootProperty: 'prop', // the root property of the path
   *     wildcard: false       // whether the argument was a wildcard '.*' path
   *   }
   *
   * @param {string} rawArg The string value of the argument
   * @return {Object} Argument metadata object
   * @private
   */
  function parseArg(rawArg) {
    // clean up whitespace
    let arg = rawArg.trim()
      // replace comma entity with comma
      .replace(/&comma;/g, ',')
      // repair extra escape sequences; note only commas strictly need
      // escaping, but we allow any other char to be escaped since its
      // likely users will do this
      .replace(/\\(.)/g, '\$1')
      ;
    // basic argument descriptor
    let a = {
      name: arg
    };
    // detect literal value (must be String or Number)
    let fc = arg[0];
    if (fc === '-') {
      fc = arg[1];
    }
    if (fc >= '0' && fc <= '9') {
      fc = '#';
    }
    switch(fc) {
      case "'":
      case '"':
        a.value = arg.slice(1, -1);
        a.literal = true;
        break;
      case '#':
        a.value = Number(arg);
        a.literal = true;
        break;
    }
    // if not literal, look for structured path
    if (!a.literal) {
      a.rootProperty = Polymer.Path.root(arg);
      // detect structured path (has dots)
      a.structured = Polymer.Path.isDeep(arg);
      if (a.structured) {
        a.wildcard = (arg.slice(-2) == '.*');
        if (a.wildcard) {
          a.name = arg.slice(0, -2);
        }
      }
    }
    return a;
  }

  /**
   * Gather the argument values for a method specified in the provided array
   * of argument metadata.
   *
   * The `path` and `value` arguments are used to fill in wildcard descriptor
   * when the method is being called as a result of a path notification.
   * 
   * @param {Object} data Instance data storage object to read properties from
   * @param {Array<Object>} args Array of argument metadata
   * @return {Array<*>} Array of argument values
   * @private
   */
  function marshalArgs(data, args, path, value) {
    let values = [];
    for (let i=0, l=args.length; i<l; i++) {
      let arg = args[i];
      let name = arg.name;
      let v;
      if (arg.literal) {
        v = arg.value;
      } else if (path == name) {
        v = value;
      } else {
        // TODO(kschaaf): confirm design of this
        v = data[name];
        if (v === undefined && arg.structured) {
          v = Polymer.Path.get(data, name);
        }
      }
      if (arg.wildcard) {
        // Only send the actual path changed info if the change that
        // caused the observer to run matched the wildcard
        let baseChanged = (name.indexOf(path + '.') === 0);
        let matches = (path.indexOf(name) === 0 && !baseChanged);
        values[i] = {
          path: matches ? path : name,
          value: matches ? value : v,
          base: v
        };
      } else {
        values[i] = v;
      }
    }
    return values;
  }

  /**
   * Initializes `__dataCompoundStorage` local storage on a bound node with
   * initial literal data for compound bindings, and sets the joined
   * literal parts to the bound property.
   * 
   * When changes to compound parts occur, they are first set into the compound
   * storage array for that property, and then the array is joined to result in
   * the final value set to the property/attribute.
   *
   * @param {Object} note Annotation metadata
   * @param {Node} node Bound node to initialize
   * @private
   */
  function setupCompoundBinding(note, node) {
    let bindings = note.bindings;
    for (let i=0; i<bindings.length; i++) {
      let binding = bindings[i];
      if (binding.isCompound) {
        // Create compound storage map
        let storage = node.__dataCompoundStorage ||
          (node.__dataCompoundStorage = {});
        let parts = binding.parts;
        // Copy literals from parts into storage for this binding
        let literals = new Array(parts.length);
        for (let j=0; j<parts.length; j++) {
          literals[j] = parts[j].literal;
        }
        let name = binding.name;
        storage[name] = literals;
        // Configure properties with their literal parts
        if (binding.literal && binding.kind == 'property') {
          // TODO(kschaaf) config integration
          // if (node._configValue) {
          //   node._configValue(name, binding.literal);
          // } else {
            node[name] = binding.literal;
          // }
        }
      }
    }
  }

  // data api

  /**
   * Sends array splice notifications (`.splices` and `.length`) 
   *
   * Note: this implementation only accepts normalized paths
   *
   * @param {Object} inst Instance to send notifications to
   * @param {Array} array The array the mutations occurred on
   * @param {string} path The path to the array that was mutated
   * @param {Array} splices Array of splice records
   * @private
   */
  function notifySplices(inst, array, path, splices) {
    let splicesPath = path + '.splices';
    inst._setProperty(splicesPath, { indexSplices: splices });
    inst._setProperty(path + '.length', array.length);
    // All path notification values are cached on `this.__data__`.
    // Null here to allow potentially large splice records to be GC'ed.
    inst.__data[splicesPath] = {indexSplices: null};
  }

  /**
   * Creates a splice record and sends an array splice notification for
   * the described mutation
   *
   * Note: this implementation only accepts normalized paths
   *
   * @param {Object} inst Instance to send notifications to
   * @param {Array} array The array the mutations occurred on
   * @param {string} path The path to the array that was mutated
   * @param {number} index Index at which the array mutation occurred
   * @param {number} addedCount Number of added items
   * @param {Array} removed Array of removed items
   * @private
   */
  function notifySplice(inst, array, path, index, addedCount, removed) {
    notifySplices(inst, array, path, [{
      index: index,
      addedCount: addedCount,
      removed: removed,
      object: array,
      type: 'splice'
    }]);
  }

  /**
   * Returns an upper-cased version of the string.
   *
   * @param {string} name String to uppercase
   * @return {string} Uppercased string
   */
  function upper(name) {
    return name[0].toUpperCase() + name.substring(1);
  }

  Polymer.PropertyEffects = Polymer.Utils.dedupingMixin(function(superClass) {

    return class PropertyEffects extends Polymer.TemplateStamp(
      Polymer.Attributes(Polymer.PropertyAccessors(superClass))) {

      get PROPERTY_EFFECT_TYPES() {
        return TYPES;
      }

      constructor() {
        super();
        this._asyncEffects = false;
        this.__dataInitialized = false;
        this.__dataPendingClients = null;
        this.__dataFromAbove = false;
        this.__dataLinkedPaths = null;
        this.__dataNodes = null;
        // May be set on instance prior to upgrade
        this.__dataCompoundStorage = this.__dataCompoundStorage || null;
        this.__dataHost = this.__dataHost || null;
      }

      /**
       * Adds to default initialization in `PropertyAccessors` by initializing
       * local property & pending data storage with any accessor values saved
       * in `__dataProto`.  If instance properties had been set before the
       * element upgraded and gained accessors on its prototype, these values
       * are set into the prototype's accessors after being deleted from the
       * instance.
       *
       * @override
       */
      _initializeProperties() {
        super._initializeProperties();
        // initialize data with prototype values saved when creating accessors
        if (this.__dataProto) {
          this.__data = Object.create(this.__dataProto);
          this.__dataPending = Object.create(this.__dataProto);
          this.__dataOld = {};
        } else {
          this.__dataPending = null;
        }
        // update instance properties
        for (let p in this.__propertyEffects) {
          if (this.hasOwnProperty(p)) {
            let value = this[p];
            delete this[p];
            this[p] = value;
          }
        }
      }

      /**
       * Adds to the default implementation in `PropertyAccessors` by clearing
       * any locally cached path values if a root object has been set, as that
       * invalidates any descendant paths of that object.
       *
       * @override
       */
      _setPendingProperty(prop, value) {
        // clear cached paths
        if (typeof value == 'object') {
          for (var p in this.__data) {
            if (Polymer.Path.isDescendant(prop, p)) {
              this.__data[p] = undefined;
            }
          }
        }
        return super._setPendingProperty(prop, value);
      }

      // Prototype setup ----------------------------------------

      /**
       * Ensures an accessor exists for the specified property, and adds
       * to a list of "property effects" that will run when the accessor for
       * the specified property is set.  Effects are grouped by "type", which
       * roughly corresponds to a phase in effect processing.  The effect
       * metadata should be in the following form:
       *
       *   {
       *     fn: effectFunction, // Reference to function to call to perform effect
       *     info: { ... }       // Effect metadata passed to function
       *     // path: '...'      // Will be set by this method based on path arg
       *   }
       *
       * Effect functions are called with the following signature:
       *
       *   effectFunction(inst, property, currentValue, oldValue, info)
       *
       * This method may be called either on the prototype of a class
       * using the PropertyEffects mixin (for best performance), or on
       * an instance to add dynamic effects.  When called on an instance or
       * subclass of a class that has already had property effects added to
       * its prototype, the property effect lists will be cloned and added as
       * own properties of the caller.
       *
       * @param {string} path Property (or path) that should trigger the effect
       * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
       * @param {Object} effect Effect metadata object
       * @protected
       */
      _addPropertyEffect(path, type, effect) {
        let property = Polymer.Path.root(path);
        let effects = ensureOwnEffectMap(this, TYPES.ANY)[property];
        if (!effects) {
          effects = this.__propertyEffects[property] = [];
          this._createPropertyAccessor(property,
            type == TYPES.READ_ONLY);
        }
        // effects are accumulated into arrays per property based on type
        if (effect) {
          effect.path = path;
          effects.push(effect);
        }
        effects = ensureOwnEffectMap(this, type)[property];
        if (!effects) {
          effects = this[type][property] = [];
        }
        effects.push(effect);
      }

      /**
       * Returns whether the current prototype/instance has a property effect
       * of a certain type.
       *
       * @param {string} property Property name
       * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */
      _hasPropertyEffect(property, type) {
        let effects = this[type || TYPES.ANY];
        return Boolean(effects && effects[property]);
      }

      /**
       * Returns whether the current prototype/instance has a "read only"
       * accessor for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */
      _hasReadOnlyEffect(property) {
        return this._hasPropertyEffect(property, TYPES.READ_ONLY);
      }

      /**
       * Returns whether the current prototype/instance has a "notify"
       * property effect for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */
      _hasNotifyEffect(property) {
        return this._hasPropertyEffect(property, TYPES.NOTIFY);
      }

      /**
       * Returns whether the current prototype/instance has a "reflect to attribute"
       * property effect for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */
      _hasReflectEffect(property) {
        return this._hasPropertyEffect(property, TYPES.REFLECT);
      }

      /**
       * Returns whether the current prototype/instance has a "computed"
       * property effect for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */
      _hasComputedEffect(property) {
        return this._hasPropertyEffect(property, TYPES.COMPUTE);
      }

      // Runtime ----------------------------------------

      /**
       * Sets an unmanaged property (property without accessor) or leaf property
       * of a path to the given value.  If the path in question was a simple
       * property with an accessor, no action is taken.
       *
       * This function isolates relatively expensive functionality necessary
       * for the public API, such that it is only done when paths enter the
       * system, and not in every step of the hot path.
       *
       * If `path` is an unmanaged property (property without an accessor)
       * or a path, sets the value at that path.
       * 
       * If the root of the path is a managed property, returns a normalized
       * string path suitable for setting into the system via `_setProperty`/
       * `_setPendingProperty`.
       *
       * `path` can be a path string or array of path parts as accepted by the
       * public API.
       *
       * @param {string} path Path to set
       * @param {*} value Value to set
       * @return {?string} If the root property was managed, the normalized
       *   string representation of the path, otherwise returns falsey.
       * @protected
       */
      _setPathOrUnmanagedProperty(path, value) {
        let rootProperty = Polymer.Path.root(Array.isArray(path) ? path[0] : path);
        let hasEffect = this._hasPropertyEffect(rootProperty);
        let isPath = (rootProperty !== path);
        if (!hasEffect || isPath) {
          path = Polymer.Path.set(this, path, value);
        }
        if (hasEffect) {
          return path;
        }
      }

      /**
       * Overrides PropertyAccessor's default async queuing of 
       * `_propertiesChanged`: if `__dataInitialized` is false (has not yet been
       * manually flushed), the function no-ops; otherwise flushes
       * `_propertiesChanged` synchronously.
       *
       * Subclasses may set `this._asyncEffects = true` to cause 
       * `_propertiesChanged` to be flushed asynchronously.
       *
       * @override
       */
      _invalidateProperties() {
        if (this.__dataInitialized) {
          if (this._asyncEffects) {
            super._invalidateProperties();
          } else {
            this._flushProperties();
          }
        }
      }

      /**
       * Overrides PropertyAccessor's default async queuing of 
       * `_propertiesChanged`, to instead synchronously flush
       * `_propertiesChanged` unless the `this._asyncEffects` property is true.
       *
       * If this is the first time properties are being flushed, the `ready`
       * callback will be called.
       *
       * Also adds an optional `fromAbove` argument to indicate when properties
       * are being flushed by a host during data propagation. This information
       * is used to avoid sending upwards notification events in response to
       * downward data flow.  This is a performance optimization, but also
       * critical to avoid infinite looping when an object is notified, since
       * the default implementation of `_shouldPropertyChange` always returns
       * true for Objects, and without would result in a notify-propagate-notify
       * loop.
       *
       * @param {boolean=} fromAbove When true, sets `this.__dataFromAbove` to
       *   `true` for the duration of the call to `_propertiesChanged`.
       * @override
       */
      _flushProperties(fromAbove) {
        if (!this.__dataInitialized) {
          this.ready();
        }
        if (this.__dataPending || this.__dataPendingClients) {
          this.__dataFromAbove = fromAbove;
          super._flushProperties();
          this.__dataFromAbove = false;
        }
      }

      /**
       * Polymer-specific lifecycle callback called the first time properties
       * are being flushed.  Prior to `ready`, all property sets through
       * accessors are queued and their effects are flushed after this method
       * returns.
       *
       * Users may override this function to implement behavior that is
       * dependent on the element having its properties initialized, e.g.
       * from defaults (initialized from `constructor`, `_initializeProperties`),
       * `attributeChangedCallback`, or binding values propagated from host
       * "annotation effects".  `super.ready()` must be called to ensure the
       * data system becomes enabled.
       *
       * @public
       */
      ready() {
        this.__dataInitialized = true;
      }

      /**
       * Stamps the provided template and performs instance-time setup for
       * Polymer template features, including data bindings, declarative event
       * listeners, and the `this.$` map of `id`'s to nodes.  A document fragment
       * is returned containing the stamped DOM, ready for insertion into the
       * DOM.
       * 
       * Note that for host data to be bound into the stamped DOM, the template
       * must have been previously bound to the prototype via a call to
       * `_bindTemplate`, which performs one-time template binding work.
       *
       * Note that this method currently only supports being called once per
       * instance.
       *
       * @param {HTMLTemplateElement} template Template to stamp
       * @return {DocumentFragment} Cloned template content
       * @protected
       */
      _stampTemplate(template) {
        let dom = super._stampTemplate(template);
        let notes = (template._content || template.content)._notes;
        setupBindings(this, dom, notes);
        return dom;
      }

      /**
       * Implements `PropertyAccessors`'s properties changed callback.
       *
       * Base implementation simply iterates the list of all property effects
       * and runs them in the order they were added.
       *
       * @override
       */
      _propertiesChanged(currentProps, changedProps, oldProps) {
        for (let p in changedProps) {
          let effects = this.__propertyEffects[p];
          runEffects(this, p, changedProps[p], oldProps[p], effects);
        }
      }

      /**
       * Aliases one data path as another, such that path notifications from one
       * are routed to the other.
       *
       * @method linkPaths
       * @param {string} to Target path to link.
       * @param {string} from Source path to link.
       * @public
       */
      linkPaths(to, from) {
        to = Polymer.Path.normalize(to);
        from = Polymer.Path.normalize(from);
        this.__dataLinkedPaths = this.__dataLinkedPaths || {};
        if (from) {
          this.__dataLinkedPaths[to] = from;
        } else {
          this.__dataLinkedPaths(to);
        }
      }

      /**
       * Removes a data path alias previously established with `_linkPaths`.
       *
       * Note, the path to unlink should be the target (`to`) used when
       * linking the paths.
       *
       * @method unlinkPaths
       * @param {string} path Target path to unlink.
       * @public
       */
      unlinkPaths(path) {
        path = Polymer.Path.normalize(path);
        if (this.__dataLinkedPaths) {
          delete this.__dataLinkedPaths[path];
        }
      }

      /**
       * Notify that an array has changed.
       *
       * Example:
       *
       *     this.items = [ {name: 'Jim'}, {name: 'Todd'}, {name: 'Bill'} ];
       *     ...
       *     this.items.splice(1, 1, {name: 'Sam'});
       *     this.items.push({name: 'Bob'});
       *     this.notifySplices('items', [
       *       { index: 1, removed: [{name: 'Todd'}], addedCount: 1, obect: this.items, type: 'splice' },
       *       { index: 3, removed: [], addedCount: 1, object: this.items, type: 'splice'}
       *     ]);
       *
       * @param {string} path Path that should be notified.
       * @param {Array} splices Array of splice records indicating ordered
       *   changes that occurred to the array. Each record should have the
       *   following fields:
       *    * index: index at which the change occurred
       *    * removed: array of items that were removed from this index
       *    * addedCount: number of new items added at this index
       *    * object: a reference to the array in question
       *    * type: the string literal 'splice'
       *
       *   Note that splice records _must_ be normalized such that they are
       *   reported in index order (raw results from `Object.observe` are not
       *   ordered and must be normalized/merged before notifying).
       * @public
      */
      notifySplices(path, splices) {
        let info = {};
        let array = Polymer.Path.get(this, path, info);
        notifySplices(this, array, info.path, splices);
      }

      /**
       * Convenience method for reading a value from a path.
       *
       * Note, if any part in the path is undefined, this method returns
       * `undefined` (this method does not throw when dereferencing undefined
       * paths).
       *
       * @method get
       * @param {(string|Array<(string|number)>)} path Path to the value
       *   to read.  The path may be specified as a string (e.g. `foo.bar.baz`)
       *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
       *   bracketed expressions are not supported; string-based path parts
       *   *must* be separated by dots.  Note that when dereferencing array
       *   indices, the index may be used as a dotted part directly
       *   (e.g. `users.12.name` or `['users', 12, 'name']`).
       * @param {Object=} root Root object from which the path is evaluated.
       * @return {*} Value at the path, or `undefined` if any part of the path
       *   is undefined.
       * @public
       */
      get(path, root) {
        return Polymer.Path.get(root || this, path);
      }

      /**
       * Convenience method for setting a value to a path and notifying any
       * elements bound to the same path.
       *
       * Note, if any part in the path except for the last is undefined,
       * this method does nothing (this method does not throw when
       * dereferencing undefined paths).
       *
       * @method set
       * @param {(string|Array<(string|number)>)} path Path to the value
       *   to write.  The path may be specified as a string (e.g. `'foo.bar.baz'`)
       *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
       *   bracketed expressions are not supported; string-based path parts
       *   *must* be separated by dots.  Note that when dereferencing array
       *   indices, the index may be used as a dotted part directly
       *   (e.g. `'users.12.name'` or `['users', 12, 'name']`).
       * @param {*} value Value to set at the specified path.
       * @param {Object=} root Root object from which the path is evaluated.
       *   When specified, no notification will occur.
       * @public
      */
      set(path, value, root) {
        if (root) {
          Polymer.Path.set(root, path, value);
        } else {
          if (!this._hasReadOnlyEffect(path)) {
            if ((path = this._setPathOrUnmanagedProperty(path, value))) {
              this._setProperty(path, value);
            }
          }          
        }
      }

      /**
       * Called by 2-way binding notification event listeners to set a property
       * or path to the host based on a notification from a bound child.
       *
       * This method is provided as an override point.  The default
       * implementation causes a synchronous `set` of the given path.
       *
       * @param {string} path Path on this instance to set
       * @param {*} value Value to set to given path
       * @protected
       */
      _setPropertyFromNotification(path, value) {
        this.set(path, value);
      }

      /**
       * Called by "notification effect" to dispatch a change notification
       * event.
       *
       * This method is provided as an override point for e.g. decorating events.
       * The default implementation simply calls `dispatchEvent`.
       *
       * @param {Event} event The property change notification event to dispatch
       * @protected
       */
      _dispatchNotifyingEvent(event) {
        this.dispatchEvent(event);
      }

      /**
       * Called by "annotation effect" to set a property to a node.  Note,
       * the caller must ensure that the target node has a property effect for
       * the property in question, otherwise this method will error.
       *
       * This method is provided as an override point.  The default
       * implementation calls `_setProperty` to synchronously set & flush
       * the property to the node as long as the property is not read-only.
       *
       * @param {Node} node Node to set property on
       * @param {string} prop Property (or path) name to set
       * @param {*} value Value to set
       * @protected
       */
      _setPropertyToNodeFromAnnotation(node, prop, value) {
        if (!node._hasReadOnlyEffect(prop)) {
          node._setProperty(prop, value);
        }
      }

      /**
       * Called by "computed property effect" to set the result of a computing
       * function to the computing property.
       *
       * This method is provided as an override point.  The default
       * implementation simply sets the value in to the accessor for the
       * property.
       *
       * @param {string} prop Property name to set
       * @param {*} value Computed value to set
       * @protected
       */
      _setPropertyFromComputation(prop, value) {
        this[prop] = value;
      }

      /**
       * Adds items onto the end of the array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.push`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @method push
       * @param {String} path Path to array.
       * @param {...any} var_args Items to push onto array
       * @return {number} New length of the array.
       * @public
       */
      push(path, ...items) {
        let info = {};
        let array = Polymer.Path.get(this, path, info);
        let len = array.length;
        let ret = array.push(...items);
        if (items.length) {
          notifySplice(this, array, info.path, len, items.length, []);
        }
        return ret;
      }

      /**
       * Removes an item from the end of array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.pop`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @method pop
       * @param {String} path Path to array.
       * @return {any} Item that was removed.
       * @public
       */
      pop(path) {
        let info = {};
        let array = Polymer.Path.get(this, path, info);
        let hadLength = Boolean(array.length);
        let ret = array.pop();
        if (hadLength) {
          notifySplice(this, array, info.path, array.length, 0, [ret]);
        }
        return ret;
      }

      /**
       * Starting from the start index specified, removes 0 or more items
       * from the array and inserts 0 or more new items in their place.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.splice`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @method splice
       * @param {String} path Path to array.
       * @param {number} start Index from which to start removing/inserting.
       * @param {number} deleteCount Number of items to remove.
       * @param {...any} var_args Items to insert into array.
       * @return {Array} Array of removed items.
       * @public
       */
      splice(path, start, deleteCount, ...items) {
        let info = {};
        let array = Polymer.Path.get(this, path, info);
        // Normalize fancy native splice handling of crazy start values
        if (start < 0) {
          start = array.length - Math.floor(-start);
        } else {
          start = Math.floor(start);
        }
        if (!start) {
          start = 0;
        }
        let ret = array.splice(start, deleteCount, ...items);
        if (items.length || ret.length) {
          notifySplice(this, array, info.path, start, items.length, ret);
        }
        return ret;
      }

      /**
       * Removes an item from the beginning of array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.pop`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @method shift
       * @param {String} path Path to array.
       * @return {any} Item that was removed.
       * @public
       */
      shift(path) {
        let info = {};
        let array = Polymer.Path.get(this, path, info);
        let hadLength = Boolean(array.length);
        let ret = array.shift();
        if (hadLength) {
          notifySplice(this, array, info.path, 0, 0, [ret]);
        }
        return ret;
      }

      /**
       * Adds items onto the beginning of the array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.push`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @method unshift
       * @param {String} path Path to array.
       * @param {...any} var_args Items to insert info array
       * @return {number} New length of the array.
       * @public
       */
      unshift(path, ...items) {
        let info = {};
        let array = Polymer.Path.get(this, path, info);
        let ret = array.unshift(...items);
        if (items.length) {
          notifySplice(this, array, info.path, 0, items.length, []);
        }
        return ret;
      }

      /**
       * Notify that a path has changed.
       *
       * Example:
       *
       *     this.item.user.name = 'Bob';
       *     this.notifyPath('item.user.name');
       *
       * @param {string} path Path that should be notified.
       * @param {*=} value Value at the path (optional).
       * @public
      */
      notifyPath(path, value) {
        if (arguments.length == 1) {
          // Get value if not supplied
          let info = {};
          value = Polymer.Path.get(this, path, info);
          path = info.path;
        } else if (Array.isArray(path)) {
          // Normalize path if needed
          path = Polymer.Path.normalize(path);
        }
        this._setProperty(path, value);
      }

      /**
       * Creates a read-only accessor for the given property.
       *
       * To set the property, use the protected `_setProperty` API.
       * To create a custom protected setter (e.g. `_setMyProp()` for 
       * property `myProp`), pass `true` for `protectedSetter`.
       *
       * Note, if the property will have other property effects, this method
       * should be called first, before adding other effects.
       *
       * @param {string} property Property name
       * @param {boolean=} protectedSetter Creates a custom protected setter
       *   when `true`.
       * @protected
       */
      _createReadOnlyProperty(property, protectedSetter) {
        this._addPropertyEffect(property, TYPES.READ_ONLY);
        if (protectedSetter) {
          this['_set' + upper(property)] = function(value) {
            this._setProperty(property, value);
          }
        }
      }

      /**
       * Creates a single-property observer for the given property.
       *
       * @param {string} property Property name
       * @param {string} methodName Name of observer method to call
       * @protected
       */
      _createObservedProperty(property, methodName) {
        this._addPropertyEffect(property, TYPES.OBSERVE, {
          fn: runObserverEffect,
          info: {
            methodName: methodName
          }
        });
      }

      /**
       * Creates a multi-property "method observer" based on the provided
       * expression, which should be a string in the form of a normal Javascript
       * function signature: `'methodName(arg1, [..., argn])'`.  Each argument
       * should correspond to a property or path in the context of this
       * prototype (or instance), or may be a literal string or number.
       *
       * @param {string} expression Method expression
       * @protected
       */
      _createMethodObserver(expression) {
        let sig = parseMethod(expression);
        if (!sig) {
          throw new Error("Malformed observer expression '" + expression + "'");
        }
        createMethodEffect(this, sig, TYPES.OBSERVE, runMethodObserverEffect);
      }

      /**
       * Causes the setter for the given property to dispatch `<property>-changed`
       * events to notify of changes to the property.
       *
       * @param {string} property Property name
       * @protected
       */
      _createNotifyingProperty(property) {
        this._addPropertyEffect(property, TYPES.NOTIFY, {
          fn: runNotifyEffect,
          info: {
            eventName: CaseMap.camelToDashCase(property) + '-changed',
            property: property
          }
        });
      }

      /**
       * Causes the setter for the given property to reflect the property value
       * to a (dash-cased) attribute of the same name.
       *
       * @param {string} property Property name
       * @protected
       */
      _createReflectedProperty(property) {
        let attr = CaseMap.camelToDashCase(property);
        if (attr[0] === '-') {
          console.warn('Property ' + property + ' cannot be reflected to attribute ' +
            attr + ' because "-" is not a valid starting attribute name. Use a lowercase first letter for the property thisead.');
        } else {
          this._addPropertyEffect(property, TYPES.REFLECT, {
            fn: runReflectEffect,
            info: {
              attrName: attr
            }
          });
        }
      }

      /**
       * Creates a computed property whose value is set to the result of the
       * method described by the given `expression` each time one or more
       * arguments to the method changes.  The expression should be a string
       * in the form of a normal Javascript function signature:
       * `'methodName(arg1, [..., argn])'`
       *
       * @param {string} property Name of computed property to set
       * @param {string} expression Method expression
       * @protected
       */
      _createComputedProperty(property, expression) {
        let sig = parseMethod(expression);
        if (!sig) {
          throw new Error("Malformed computed expression '" + expression + "'");
        }
        createMethodEffect(this, sig, TYPES.COMPUTE,
          runComputedEffect, property);
      }

      // -- annotation ----------------------------------------------

      /**
       * Creates "annotation" property effects for all binding annotations
       * in the provided template that forward host properties into DOM stamped
       * from the template via `_stampTemplate`.
       *
       * @param {HTMLTemplateElement} template Template containing binding
       *   annotations
       * @protected
       */
      _bindTemplate(template) {
        // Clear any existing propagation effects inherited from superClass
        this[TYPES.PROPAGATE] = {};
        let notes = this._parseTemplateAnnotations(template);
        processAnnotations(notes);
        for (let i=0, note; (i<notes.length) && (note=notes[i]); i++)  {
          // where to find the node in the concretized list
          let b$ = note.bindings;
          for (let j=0, binding; (j<b$.length) && (binding=b$[j]); j++) {
            if (shouldAddListener(binding)) {
              addAnnotatedListener(this, i, binding.name,
                binding.parts[0].value,
                binding.parts[0].event,
                binding.parts[0].negate);
            }
            addAnnotationEffect(this, binding, i);
          }
        }
      }

    }

  });

})();
(function() {

  'use strict';

  let utils = Polymer.Utils;

  let effectUid = 0;

  function runComputedEffects(inst, changedProps, oldProps) {
    const COMPUTE = inst.PROPERTY_EFFECT_TYPES.COMPUTE;
    if (inst[COMPUTE]) {
      let inputProps = changedProps;
      let computedProps;
      while (runEffects(inst, COMPUTE, inputProps)) {
        utils.mixin(oldProps, inst.__dataOld);
        utils.mixin(changedProps, inst.__dataPending);
        computedProps = utils.mixin(computedProps || {}, inst.__dataPending);
        inputProps = inst.__dataPending;
        inst.__dataPending = null;
      }
      return computedProps;
    }
  }

  function computeLinkedPaths(inst, changedProps, computedProps) {
    const links = inst.__dataLinkedPaths;
    if (links) {
      computedProps = computedProps || {};
      let link;
      for (let a in links) {
        let b = links[a];
        for (let path in changedProps) {
          if (Polymer.Path.isDescendant(a, path)) {
            link = Polymer.Path.translate(a, b, path);
            changedProps[link] = computedProps[link] =
              inst.__data[link] = changedProps[path];
          } else if (Polymer.Path.isDescendant(b, path)) {
            link = Polymer.Path.translate(b, a, path);
            changedProps[link] = computedProps[link] =
              inst.__data[link] = changedProps[path];
          }
        }
      }
    }
    return computedProps;
  }

  function notifyProperties(inst, changedProps, computedProps, oldProps) {
    // Determine which props to notify
    let props = inst.__dataFromAbove ? computedProps : changedProps;
    // Save interim data for potential re-entry
    let runId = (inst._runId = ((inst._runId || 0) + 1));
    inst.__dataInterim = inst.__dataInterim ?
      utils.mixin(inst.__dataInterim, changedProps) : changedProps;
    inst.__dataInterimOld = inst.__dataInterimOld ?
      utils.mixin(inst.__dataInterimOld, oldProps) : oldProps;
    // Notify
    let notified;
    let notifyEffects = inst[inst.PROPERTY_EFFECT_TYPES.NOTIFY];
    let id = effectUid++;
    // Try normal notify effects; if none, fall back to try path notification
    for (let prop in props) {
      if (notifyEffects && runEffectsForProperty(inst, notifyEffects, id,
        prop, oldProps && oldProps[prop])) {
        notified = true;
      } else if (notifyPath(inst, prop)) {
        notified = true;
      }
    }
    // Flush host if we actually notified and host was batching
    let host;
    if (notified && (host = inst.__dataHost) && host.setProperties) {
      host._flushProperties();
    }
    // Combine & return interim data only for last entry
    if (runId == inst._runId) {
      changedProps = inst.__dataInterim;
      oldProps = inst.__dataInterimOld;
      inst.__dataInterim = null;
      inst.__dataInterimOld = null;
      return { changedProps, oldProps };
    }
  }

  function notifyPath(inst, prop) {
    let rootProperty = Polymer.Path.root(prop);
    if (rootProperty !== prop) {
      let name = Polymer.CaseMap.camelToDashCase(rootProperty) + '-changed';
      let options = { detail: {value: inst.__data[prop], path: prop }};
      inst._dispatchNotifyingEvent(new CustomEvent(name, options));
      return true;
    }
  }

  function runEffects(inst, type, props, oldProps) {
    let ran;
    let effects = inst[type];
    if (effects) {
      let id = effectUid++;
      for (let prop in props) {
        if (runEffectsForProperty(inst, effects, id, prop,
          oldProps && oldProps[prop])) {
          ran = true;
        }
      }
    }
    return ran;
  }

  function runEffectsForProperty(inst, effects, id, prop, old) {
    let ran;
    let rootProperty = Polymer.Path.root(prop);
    let fxs = effects[rootProperty];
    if (fxs) {
      let fromAbove = inst.__dataFromAbove;
      for (let i=0, l=fxs.length, fx; (i<l) && (fx=fxs[i]); i++) {
        if (Polymer.Path.matches(fx.path, prop) &&
          (!fx.info || fx.info.lastRun !== id)) {
          fx.fn(inst, prop, inst.__data[prop], old, fx.info, fromAbove);
          if (fx.info) {
            fx.info.lastRun = id;
          }
          ran = true;
        }
      }
    }
    return ran;
  }

  Polymer.BatchedEffects = Polymer.Utils.dedupingMixin(function(superClass) {

    return class BatchedEffects extends Polymer.PropertyEffects(superClass) {

      constructor() {
        super();
        this.__dataPendingClients = null;
      }

      // -- set properties machinery

      _propertiesChanged(currentProps, changedProps, oldProps) {
        // ----------------------------
        // let c = Object.getOwnPropertyNames(changedProps || {});
        // console.group(this.localName + '#' + this.id + ': ' + c);
        // ----------------------------
        // Compute
        let computedProps = runComputedEffects(this, changedProps, oldProps);
        // Compute linked paths
        computedProps = computeLinkedPaths(this, changedProps, computedProps);
        // Notify
        let props = notifyProperties(this, changedProps, computedProps, oldProps);
        if (props) {
          oldProps = props.oldProps;
          changedProps = props.changedProps;
          // Propagate
          runEffects(this, this.PROPERTY_EFFECT_TYPES.PROPAGATE, changedProps);
          // Flush clients
          this._flushClients();
          // Reflect
          runEffects(this, this.PROPERTY_EFFECT_TYPES.REFLECT,
            changedProps, oldProps);
          // Observe
          runEffects(this, this.PROPERTY_EFFECT_TYPES.OBSERVE,
            changedProps, oldProps);
        }
        // ----------------------------
        // console.groupEnd(this.localName + '#' + this.id + ': ' + c);
        // ----------------------------
      }

      _setPropertyToNodeFromAnnotation(node, prop, value) {
        // TODO(kschaaf): fix id of BatchedEffects client...
        if (node.setProperties) {
          if (!node._hasReadOnlyEffect(prop)) {
            if (node._setPendingProperty(prop, value)) {
              this._enqueueClient(node);
            }
          }
        } else {
          super._setPropertyToNodeFromAnnotation(node, prop, value);
        }
      }

      _setPropertyFromNotification(path, value, event) {
        let detail = event.detail;
        if (detail && detail.queueProperty) {
          if (!this._hasReadOnlyEffect(path)) {
            if ((path = this._setPathOrUnmanagedProperty(path, value))) {
              this._setPendingProperty(path, value);
            }
          }
        } else {
          super._setPropertyFromNotification(path, value, event);
        }
      }

      _dispatchNotifyingEvent(event) {
        event.detail.queueProperty = true;
        super._dispatchNotifyingEvent(event);
      }

      _setPropertyFromComputation(prop, value) {
        if (this._hasPropertyEffect(prop)) {
          this._setPendingProperty(prop, value);
        } else {
          this[prop] = value;
        }
      }

      _enqueueClient(client) {
        this.__dataPendingClients = this.__dataPendingClients || new Map();
        if (client !== this) {
          this.__dataPendingClients.set(client, true);
        }
      }

      _flushClients() {
        // Flush all clients
        let clients = this.__dataPendingClients;
        if (clients) {
          clients.forEach((v, client) => {
            // TODO(kschaaf): more explicit check?
            if (client._flushProperties) {
              client._flushProperties(true);
            }
          });
          this.__dataPendingClients = null;
        }
      }

      setProperties(props) {
        for (let path in props) {
          if (!this._hasReadOnlyEffect(path)) {
            let value = props[path];
            if ((path = this._setPathOrUnmanagedProperty(path, value))) {
              this._setPendingProperty(path, value);
            }
          }
        }
        this._invalidateProperties();
      }

    }

  });

})();
(function() {
  'use strict';

  var StyleGather = {
    MODULE_STYLES_SELECTOR: 'style, link[rel=import][type~=css], template',
    INCLUDE_ATTR: 'include',
    _importModule(moduleId) {
      if (!Polymer.DomModule) {
        return null;
      }
      return Polymer.DomModule.import(moduleId);
    },
    cssFromModules(moduleIds, warnIfNotFound) {
      var modules = moduleIds.trim().split(' ');
      var cssText = '';
      for (var i=0; i < modules.length; i++) {
        cssText += this.cssFromModule(modules[i], warnIfNotFound);
      }
      return cssText;
    },

    // returns cssText of styles in a given module; also un-applies any
    // styles that apply to the document.
    cssFromModule(moduleId, warnIfNotFound) {
      var m = this._importModule(moduleId);
      if (m && !m._cssText) {
        m._cssText = this.cssFromElement(m);
      }
      if (!m && warnIfNotFound) {
        console.warn('Could not find style data in module named', moduleId);
      }
      return m && m._cssText || '';
    },

    // support lots of ways to discover css...
    cssFromElement(element) {
      var cssText = '';
      // if element is a template, get content from its .content
      var content = element.content || element;
      var e$ = content.querySelectorAll(this.MODULE_STYLES_SELECTOR);
      for (var i=0, e; i < e$.length; i++) {
        e = e$[i];
        // look inside templates for elements
        if (e.localName === 'template') {
          cssText += this.cssFromElement(e);
        } else {
          // style elements inside dom-modules will apply to the main document
          // we don't want this, so we remove them here.
          if (e.localName === 'style') {
            var include = e.getAttribute(this.INCLUDE_ATTR);
            // now support module refs on 'styling' elements
            if (include) {
              cssText += this.cssFromModules(include, true);
            }
            // get style element applied to main doc via HTMLImports polyfill
            e = e.__appliedElement || e;
            e.parentNode.removeChild(e);
            cssText += Polymer.ResolveUrl.resolveCss(e.textContent, element.ownerDocument);
            // it's an import, assume this is a text file of css content.
            // TODO(sorvell): plan is to deprecate this way to get styles;
            // remember to add deprecation warning when this is done.
          } else if (e.import && e.import.body) {
            cssText += Polymer.ResolveUrl.resolveCss(e.import.body.textContent, e.import);
          }
        }
      }
      return cssText;
    }
  };

  Polymer.StyleGather = StyleGather;
})();
(function() {
    'use strict';

    var StyleUtil = {

      isTargetedBuild: function(buildType) {
        return (!window.ShadyDOM || !ShadyDOM.inUse) ?
          buildType === 'shadow' : buildType === 'shady';
      },

      cssBuildTypeForModule: function (module) {
        var dm = Polymer.DomModule.import(module);
        if (dm) {
          return this.getCssBuildType(dm);
        }
      },

      getCssBuildType: function(element) {
        return element.getAttribute('css-build');
      }

    };

    Polymer.StyleUtil = StyleUtil;

  })();
(function() {

  'use strict';

  let caseMap = Polymer.CaseMap;

  // Same as Polymer.Utils.mixin, but upgrades shorthand type
  // syntax to { type: Type }
  function flattenProperties(flattenedProps, props) {
    for (let p in props) {
      let o = props[p];
      if (typeof o == 'function') {
        o = { type: o };
      }
      flattenedProps[p] = o;
    }
    return flattenedProps;
  }

  Polymer.ElementMixin = Polymer.Utils.cachingMixin(function(base) {

    return class PolymerElement extends Polymer.BatchedEffects(base) {

      // returns the config object on specifically on `this` class (not super)
      // config is used for:
      // (1) super chain mixes togther to make `flattenedProperties` which is
      // then used to make observedAttributes and set property defaults
      // (2) properties effects and observers are created from it at `finalize` time.
      static get _ownConfig() {
        if (!this.hasOwnProperty('__ownConfig')) {
          this.__ownConfig = this.hasOwnProperty('config') ? this.config : {};
        }
        return this.__ownConfig;
      }

      // a flattened list of properties mixed together from the chain of all
      // constructor's `config.properties`
      // This list is used to create
      // (1) observedAttributes,
      // (2) element default values
      static get _flattenedProperties() {
        if (!this.hasOwnProperty('__flattenedProperties')) {
          // TODO(sorvell): consider optimizing; shorthand type support requires
          // an extra loop to upgrade shorthand property info to longhand
          this.__flattenedProperties = flattenProperties({}, this._ownConfig.properties);
          let superCtor = Object.getPrototypeOf(this.prototype).constructor;
          if (superCtor.prototype instanceof PolymerElement) {
            this.__flattenedProperties = flattenProperties(
              Object.create(superCtor._flattenedProperties),
              this.__flattenedProperties);
          }
        }
        return this.__flattenedProperties;
      }

      static get observedAttributes() {
        if (!this.hasOwnProperty('_observedAttributes')) {
          // observedAttributes must be finalized at registration time
          this._observedAttributes = this._addPropertiesToAttributes(
            this._flattenedProperties, []);
        }
        return this._observedAttributes;
      }

      static _addPropertiesToAttributes(properties, list) {
        for (let prop in properties) {
          list.push(Polymer.CaseMap.camelToDashCase(prop));
        }
        return list;
      }

      static get finalized() {
        return this.hasOwnProperty('_finalized');
      }

      static set finalized(value) {
        this._finalized = value;
      }

      // TODO(sorvell): need to work on public api surrouding `finalize`.
      // Due to meta-programming, it's awkward to make a subclass impl of this.
      // However, a user might want to call `finalize` prior to define to do
      // this work eagerly. Need to also decide on `finalizeConfig(config)` and
      // `finalizeTemplate(template)`. Both are public but have simiarly
      // awkward subclassing characteristics.
      static finalize() {
        let proto = this.prototype;
        if (!this.finalized) {

          let superProto = Object.getPrototypeOf(proto);
          let superCtor = superProto && superProto.constructor;
          if (superCtor.prototype instanceof PolymerElement) {
            superCtor.finalize();
          }
          this.finalized = true;
          if (this.hasOwnProperty('is') && this.is) {
            Polymer.telemetry.register(proto);
          }
          let config = this._ownConfig;
          if (config) {
            this._finalizeConfig(config);
          }
          if (this.template) {
            let template = this.template.cloneNode(true);
            this._finalizeTemplate(template);
          }
        }
      }

      static _finalizeConfig(config) {
        if (config.properties) {
          // process properties
          for (let p in config.properties) {
            this.prototype._createPropertyFromConfig(p, config.properties[p]);
          }
        }
        if (config.observers) {
          for (let i=0; i < config.observers.length; i++) {
            this.prototype._createMethodObserver(config.observers[i]);
          }
        }
      }

      static get template() {
        if (!this.hasOwnProperty('_template')) {
          // TODO(sorvell): support more ways to acquire template.
          // this requires `is` on constructor...
          this._template = Polymer.DomModule.import(this.is, 'template') ||
            // note: implemented so a subclass can retrieve the super
            // template; call the super impl this way so that `this` points
            // to the superclass.
            Object.getPrototypeOf(this.prototype).constructor.template;
        }
        return this._template;
      }

      static _finalizeTemplate(template) {
        // support `include="module-name"`
        let cssText = Polymer.StyleGather.cssFromElement(template);
        if (cssText) {
          let style = document.createElement('style');
          style.textContent = cssText;
          template.content.insertBefore(style, template.content.firstChild);
        }
        if (window.ShadyCSS) {
          window.ShadyCSS.prepareTemplate(template, this.is, this.extends);
        }
        var proto = this.prototype;
        this.prototype._bindTemplate(template);
        proto._template = template;
      }

      constructor() {
        super();
        // note: `this.constructor.prototype` is wrong in Safari so make sure to
        // use `__proto__`
        Polymer.telemetry.instanceCount++;
        // add self to host's pending client list
        hostStack.registerHost(this);
      }

      _initializeProperties() {
        if (!this.constructor.finalized) {
          this.constructor.finalize();
        }
        super._initializeProperties();
        // apply property defaults...
        let p$ = this.constructor._flattenedProperties;
        for (let p in p$) {
          let info = p$[p];
          if (('value' in info) && !this._isPropertyPending(p)) {
            var value = typeof info.value == 'function' ?
              info.value.call(this) :
              info.value;
            if (this._hasReadOnlyEffect(p)) {
              this._setProperty(p, value)
            } else {
              this[p] = value;
            }
          }
        }
      }

      /**
       * Creates effects for a property.
       *
       * Example:
       *
       *     this._createPropertyFromConfig('foo', {
       *       type: String, value: 'foo', reflectToAttribute: true
       *     });
       *
       * Note, once a property has been set to
       * `readOnly`, `computed`, `reflectToAttribute`, or `notify`
       * these values may not be changed. For example, a subclass cannot
       * alter these settings. However, additional `observers` may be added
       * by subclasses.
       *
       * @param {string} name Name of the property.
       * @param {*=} info Info object from which to create property effects.
       * Supported keys:
       *
       * * type: {function} type to which an attribute matching the property
       * is deserialized. Note the property is camel-cased from a dash-cased
       * attribute. For example, 'foo-bar' attribute is dersialized to a
       * property named 'fooBar'.
       *
       * * readOnly: {boolean} creates a readOnly property and
       * makes a private setter for the private of the form '_setFoo' for a
       * property 'foo',
       *
       * * computed: {string} creates a computed property. A computed property
       * also automatically is set to `readOnly: true`. The value is calculated
       * by running a method and arguments parsed from the given string. For
       * example 'compute(foo)' will compute a given property when the
       * 'foo' property changes by executing the 'compute' method. This method
       * must return the computed value.
       *
       * * reflectToAttriute: {boolean} If true, the property value is reflected
       * to an attribute of the same name. Note, the attribute is dash-cased
       * so a property named 'fooBar' is reflected as 'foo-bar'.
       *
       * * notify: {boolean} sends a non-bubbling notification event when
       * the property changes. For example, a property named 'foo' sends an
       * event named 'foo-changed' with `event.detail` set to the value of
       * the property.
       *
       * * observer: {string} name of a method that runs when the property
       * changes. The arguments of the method are (value, previousValue).
       *
      */
      /* TODO(sorvell): Users may want control over modifying property
       effects via subclassing. For example, a user might want to make a
       reflectToAttribute property not do so in a subclass. We've chosen to
       disable this because it leads to additional complication.
       For example, a readOnly effect generates a special setter. If a subclass
       disables the effect, the setter would fail unexpectedly.
       Based on feedback, we may want to try to make effects more malleable
       and/or provide an advanced api for manipulating them.
       Also consider adding warnings when an effect cannot be changed.
      */
      _createPropertyFromConfig(name, info) {
        // computed forces readOnly...
        if (info.computed) {
          info.readOnly = true;
        }
        // Note, since all computed properties are readOnly, this prevents
        // adding additional computed property effects (which leads to a confusing
        // setup where multiple triggers for setting a property)
        // While we do have `hasComputedEffect` this is set on the property's
        // dependencies rather than itself.
        if (info.computed  && !this._hasReadOnlyEffect(name)) {
          this._createComputedProperty(name, info.computed);
        }
        if (info.readOnly && !this._hasReadOnlyEffect(name)) {
          this._createReadOnlyProperty(name, !info.computed);
        }
        if (info.reflectToAttribute && !this._hasReflectEffect(name)) {
          this._createReflectedProperty(name);
        }
        if (info.notify && !this._hasNotifyEffect(name)) {
          this._createNotifyingProperty(name);
        }
        // always add observer
        if (info.observer) {
          this._createObservedProperty(name, info.observer);
        }
      }

      // reserved for canonical behavior
      connectedCallback() {
        if (hostStack.isEmpty()) {
          this._flushProperties();
          this.updateStyles();
        }
      }

      disconnectedCallback() {}

      ready() {
        super.ready();
        if (this._template) {
          hostStack.beginHosting(this);
          this.root = this._stampTemplate(this._template);
          this._flushProperties();
          this.root = this._attachDom(this.root);
          hostStack.endHosting(this);
        } else {
          this.root = this;
          this._flushProperties();
        }
      }

      /**
       * Attach an element's stamped dom to itself. By default,
       * this method creates a `shadowRoot` and adds the dom to it.
       * However, this method may be overridden to allow an element
       * to put its dom in another location.
       *
       * @method _attachDom
       * @param {NodeList} dom to attach to the element.
       * @returns {Node} node to which the dom has been attached.
       */
      _attachDom(dom) {
        if (this.attachShadow) {
          if (dom) {
            if (!this.shadowRoot) {
              this.attachShadow({mode: 'open'});
            }
            this.shadowRoot.appendChild(dom);
            return this.shadowRoot;
          }
        } else {
          throw new Error(`ShadowDOM not available. ` +
            // BREAKME(sorvell): move to developer conditional when supported.
           `Polymer.Element can
              create dom as children instead of in ShadowDOM by setting
              \`this.root = this;\` before \`ready\`.`);
        }
      }

      attributeChangedCallback(name, old, value) {
        let property = caseMap.dashToCamelCase(name);
        let type = this.constructor._flattenedProperties[property].type;
        if (!this._hasReadOnlyEffect(property)) {
          this._attributeToProperty(name, value, type);
        }
      }

      updateStyles(properties) {
        if (window.ShadyCSS) {
          ShadyCSS.applyStyle(this, properties);
        }
      }

      /**
       * Rewrites a given URL relative to the original location of the document
       * containing the `dom-module` for this element.  This method will return
       * the same URL before and after vulcanization.
       *
       * @method resolveUrl
       * @param {string} url URL to resolve.
       * @return {string} Rewritten URL relative to the import
       */
      resolveUrl(url) {
        var module = Polymer.DomModule.import(this.constructor.is);
        var root = '';
        if (module) {
          var assetPath = module.getAttribute('assetpath') || '';
          root = Polymer.ResolveUrl.resolveUrl(
            assetPath, module.ownerDocument.baseURI);
        }
        return Polymer.ResolveUrl.resolveUrl(url, root);
      }

    }

  });

  let hostStack = {

    stack: [],

    isEmpty() {
      return !this.stack.length;
    },

    registerHost(inst) {
      if (this.stack.length) {
        let host = this.stack[this.stack.length-1];
        host._enqueueClient(inst);
      }
    },

    beginHosting(inst) {
      this.stack.push(inst);
    },

    endHosting(inst) {
      let stackLen = this.stack.length;
      if (stackLen && this.stack[stackLen-1] == inst) {
        this.stack.pop();
      }
    }

  }

  // telemetry
  Polymer.telemetry = {
    instanceCount: 0,
    registrations: [],
    _regLog: function(prototype) {
      console.log('[' + prototype.is + ']: registered')
    },
    register: function(prototype) {
      this.registrations.push(prototype);
      Polymer.log && this._regLog(prototype);
    },
    dumpRegistrations: function() {
      this.registrations.forEach(this._regLog);
    }
  };

  Polymer.Element = Polymer.ElementMixin(HTMLElement);

  Polymer.updateStyles = function(props) {
    if (window.ShadyCSS) {
      ShadyCSS.updateStyles(props);
    }
  };

})();
(function() {

  'use strict';

  Polymer.Async = {

    _currVal: 0,
    _lastVal: 0,
    _callbacks: [],
    _twiddleContent: 0,
    _twiddle: document.createTextNode(''),

    run: function (callback, waitTime) {
      if (waitTime > 0) {
        return ~setTimeout(callback, waitTime);
      } else {
        this._twiddle.textContent = this._twiddleContent++;
        this._callbacks.push(callback);
        return this._currVal++;
      }
    },

    cancel: function(handle) {
      if (handle < 0) {
        clearTimeout(~handle);
      } else {
        var idx = handle - this._lastVal;
        if (idx >= 0) {
          if (!this._callbacks[idx]) {
            throw 'invalid async handle: ' + handle;
          }
          this._callbacks[idx] = null;
        }
      }
    },

    _atEndOfMicrotask: function() {
      var len = this._callbacks.length;
      for (var i=0; i<len; i++) {
        var cb = this._callbacks[i];
        if (cb) {
          try {
            cb();
          } catch(e) {
            // Clear queue up to this point & start over after throwing
            i++;
            this._callbacks.splice(0, i);
            this._lastVal += i;
            this._twiddle.textContent = this._twiddleContent++;
            throw e;
          }
        }
      }
      this._callbacks.splice(0, len);
      this._lastVal += len;
    },

    flush: function() {
      this.observer.takeRecords();
      this._atEndOfMicrotask();
    }
  };

  Polymer.Async.observer = new window.MutationObserver(function() {
    Polymer.Async._atEndOfMicrotask();
  });
  Polymer.Async.observer.observe(Polymer.Async._twiddle, {characterData: true});

})();
Polymer.Debouncer = function Debouncer(context) {
  this.context = context;
  var self = this;
  this.boundFlush = function() {
    self.flush();
  };
};

Polymer.Utils.mixin(Polymer.Debouncer.prototype, {

  go: function(callback, wait) {
    var h;
    this.finish = function() {
      Polymer.Async.cancel(h);
    };
    h = Polymer.Async.run(this.boundFlush, wait);
    this.callback = callback;
  },

  cancel: function() {
    if (this.finish) {
      this.finish();
      this.finish = null;
    }
  },

  flush: function() {
    if (this.finish) {
      this.cancel();
      this.callback.call(this.context);
    }
  },

  isActive: function() {
    return Boolean(this.finish);
  }

});

Polymer.Debouncer.debounce = function(debouncer, callback, wait, context) {
  context = context || this;
  if (debouncer) {
    debouncer.cancel();
  } else {
    debouncer = new Polymer.Debouncer(context);
  }
  debouncer.go(callback, wait);
  return debouncer;
};
(function() {

  'use strict';

  // let DIRECTION_MAP = {
  //   x: 'pan-x',
  //   y: 'pan-y',
  //   none: 'none',
  //   all: 'auto'
  // };

  let wrap = function(n) { return n; };

  // detect native touch action support
  let HAS_NATIVE_TA = typeof document.head.style.touchAction === 'string';
  let GESTURE_KEY = '__polymerGestures';
  let HANDLED_OBJ = '__polymerGesturesHandled';
  let TOUCH_ACTION = '__polymerGesturesTouchAction';
  // radius for tap and track
  let TAP_DISTANCE = 25;
  let TRACK_DISTANCE = 5;
  // number of last N track positions to keep
  let TRACK_LENGTH = 2;

  // Disabling "mouse" handlers for 2500ms is enough
  let MOUSE_TIMEOUT = 2500;
  let MOUSE_EVENTS = ['mousedown', 'mousemove', 'mouseup', 'click'];
  // an array of bitmask values for mapping MouseEvent.which to MouseEvent.buttons
  let MOUSE_WHICH_TO_BUTTONS = [0, 1, 4, 2];
  let MOUSE_HAS_BUTTONS = (function() {
    try {
      return new MouseEvent('test', {buttons: 1}).buttons === 1;
    } catch (e) {
      return false;
    }
  })();

  // Check for touch-only devices
  let IS_TOUCH_ONLY = navigator.userAgent.match(/iP(?:[oa]d|hone)|Android/);

  // touch will make synthetic mouse events
  // `preventDefault` on touchend will cancel them,
  // but this breaks `<input>` focus and link clicks
  // disable mouse handlers for MOUSE_TIMEOUT ms after
  // a touchend to ignore synthetic mouse events
  let mouseCanceller = function(mouseEvent) {
    // Check for sourceCapabilities, used to distinguish synthetic events
    // if mouseEvent did not come from a device that fires touch events,
    // it was made by a real mouse and should be counted
    // http://wicg.github.io/InputDeviceCapabilities/#dom-inputdevicecapabilities-firestouchevents
    let sc = mouseEvent.sourceCapabilities;
    if (sc && !sc.firesTouchEvents) {
      return;
    }
    // skip synthetic mouse events
    mouseEvent[HANDLED_OBJ] = {skip: true};
    // disable "ghost clicks"
    if (mouseEvent.type === 'click') {
      let path = mouseEvent.composedPath && mouseEvent.composedPath();
      if (path) {
        for (let i = 0; i < path.length; i++) {
          if (path[i] === POINTERSTATE.mouse.target) {
            return;
          }
        }
      }
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
    }
  };

  function setupTeardownMouseCanceller(setup) {
    let events = IS_TOUCH_ONLY ? ['click'] : MOUSE_EVENTS;
    for (let i = 0, en; i < events.length; i++) {
      en = events[i];
      if (setup) {
        document.addEventListener(en, mouseCanceller, true);
      } else {
        document.removeEventListener(en, mouseCanceller, true);
      }
    }
  }

  function ignoreMouse() {
    if (!POINTERSTATE.mouse.mouseIgnoreJob) {
      setupTeardownMouseCanceller(true);
    }
    let unset = function() {
      setupTeardownMouseCanceller();
      POINTERSTATE.mouse.target = null;
      POINTERSTATE.mouse.mouseIgnoreJob = null;
    };
    POINTERSTATE.mouse.mouseIgnoreJob = Polymer.Debouncer.debounce(
      POINTERSTATE.mouse.mouseIgnoreJob, unset, MOUSE_TIMEOUT);
  }

  function hasLeftMouseButton(ev) {
    let type = ev.type;
    // exit early if the event is not a mouse event
    if (MOUSE_EVENTS.indexOf(type) === -1) {
      return false;
    }
    // ev.button is not reliable for mousemove (0 is overloaded as both left button and no buttons)
    // instead we use ev.buttons (bitmask of buttons) or fall back to ev.which (deprecated, 0 for no buttons, 1 for left button)
    if (type === 'mousemove') {
      // allow undefined for testing events
      let buttons = ev.buttons === undefined ? 1 : ev.buttons;
      if ((ev instanceof window.MouseEvent) && !MOUSE_HAS_BUTTONS) {
        buttons = MOUSE_WHICH_TO_BUTTONS[ev.which] || 0;
      }
      // buttons is a bitmask, check that the left button bit is set (1)
      return Boolean(buttons & 1);
    } else {
      // allow undefined for testing events
      let button = ev.button === undefined ? 0 : ev.button;
      // ev.button is 0 in mousedown/mouseup/click for left button activation
      return button === 0;
    }
  }

  function isSyntheticClick(ev) {
    if (ev.type === 'click') {
      // ev.detail is 0 for HTMLElement.click in most browsers
      if (ev.detail === 0) {
        return true;
      }
      // in the worst case, check that the x/y position of the click is within
      // the bounding box of the target of the event
      // Thanks IE 10 >:(
      let t = gestures.findOriginalTarget(ev);
      let bcr = t.getBoundingClientRect();
      // use page x/y to account for scrolling
      let x = ev.pageX, y = ev.pageY;
      // ev is a synthetic click if the position is outside the bounding box of the target
      return !((x >= bcr.left && x <= bcr.right) && (y >= bcr.top && y <= bcr.bottom));
    }
    return false;
  }

  let POINTERSTATE = {
    mouse: {
      target: null,
      mouseIgnoreJob: null
    },
    touch: {
      x: 0,
      y: 0,
      id: -1,
      scrollDecided: false
    }
  };

  function firstTouchAction(ev) {
    let ta = 'auto';
    let path = ev.composedPath && ev.composedPath();
    if (path) {
      for (let i = 0, n; i < path.length; i++) {
        n = path[i];
        if (n[TOUCH_ACTION]) {
          ta = n[TOUCH_ACTION];
          break;
        }
      }
    }
    return ta;
  }

  function trackDocument(stateObj, movefn, upfn) {
    stateObj.movefn = movefn;
    stateObj.upfn = upfn;
    document.addEventListener('mousemove', movefn);
    document.addEventListener('mouseup', upfn);
  }

  function untrackDocument(stateObj) {
    document.removeEventListener('mousemove', stateObj.movefn);
    document.removeEventListener('mouseup', stateObj.upfn);
    stateObj.movefn = null;
    stateObj.upfn = null;
  }

  let gestures = {
    gestures: {},
    recognizers: [],

    deepTargetFind: function(x, y) {
      let node = document.elementFromPoint(x, y);
      let next = node;
      // this code path is only taken when native ShadowDOM is used
      // if there is a shadowroot, it may have a node at x/y
      // if there is not a shadowroot, exit the loop
      while (next && next.shadowRoot) {
        // if there is a node at x/y in the shadowroot, look deeper
        next = next.shadowRoot.elementFromPoint(x, y);
        if (next) {
          node = next;
        }
      }
      return node;
    },
    // a cheaper check than ev.composedPath()[0];
    findOriginalTarget: function(ev) {
      // shadowdom
      if (ev.composedPath) {
        return ev.composedPath()[0];
      }
      // shadydom
      return ev.target;
    },
    handleNative: function(ev) {
      let handled;
      let type = ev.type;
      let node = wrap(ev.currentTarget);
      let gobj = node[GESTURE_KEY];
      if (!gobj) {
        return;
      }
      let gs = gobj[type];
      if (!gs) {
        return;
      }
      if (!ev[HANDLED_OBJ]) {
        ev[HANDLED_OBJ] = {};
        if (type.slice(0, 5) === 'touch') {
          let t = ev.changedTouches[0];
          if (type === 'touchstart') {
            // only handle the first finger
            if (ev.touches.length === 1) {
              POINTERSTATE.touch.id = t.identifier;
            }
          }
          if (POINTERSTATE.touch.id !== t.identifier) {
            return;
          }
          if (!HAS_NATIVE_TA) {
            if (type === 'touchstart' || type === 'touchmove') {
              gestures.handleTouchAction(ev);
            }
          }
          if (type === 'touchend') {
            let rootTarget = ev.composedPath ? ev.composedPath()[0] : ev.target;
            POINTERSTATE.mouse.target = rootTarget;
            // ignore syntethic mouse events after a touch
            ignoreMouse();
          }
        }
      }
      handled = ev[HANDLED_OBJ];
      // used to ignore synthetic mouse events
      if (handled.skip) {
        return;
      }
      let recognizers = gestures.recognizers;
      // reset recognizer state
      for (let i = 0, r; i < recognizers.length; i++) {
        r = recognizers[i];
        if (gs[r.name] && !handled[r.name]) {
          if (r.flow && r.flow.start.indexOf(ev.type) > -1 && r.reset) {
            r.reset();
          }
        }
      }
      // enforce gesture recognizer order
      for (let i = 0, r; i < recognizers.length; i++) {
        r = recognizers[i];
        if (gs[r.name] && !handled[r.name]) {
          handled[r.name] = true;
          r[type](ev);
        }
      }
    },

    handleTouchAction: function(ev) {
      let t = ev.changedTouches[0];
      let type = ev.type;
      if (type === 'touchstart') {
        POINTERSTATE.touch.x = t.clientX;
        POINTERSTATE.touch.y = t.clientY;
        POINTERSTATE.touch.scrollDecided = false;
      } else if (type === 'touchmove') {
        if (POINTERSTATE.touch.scrollDecided) {
          return;
        }
        POINTERSTATE.touch.scrollDecided = true;
        let ta = firstTouchAction(ev);
        let prevent = false;
        let dx = Math.abs(POINTERSTATE.touch.x - t.clientX);
        let dy = Math.abs(POINTERSTATE.touch.y - t.clientY);
        if (!ev.cancelable) {
          // scrolling is happening
        } else if (ta === 'none') {
          prevent = true;
        } else if (ta === 'pan-x') {
          prevent = dy > dx;
        } else if (ta === 'pan-y') {
          prevent = dx > dy;
        }
        if (prevent) {
          ev.preventDefault();
        } else {
          gestures.prevent('track');
        }
      }
    },

    addListener: function(node, evType, handler) {
      if (this.gestures[evType]) {
        this.add(node, evType, handler);
        return true;
      }
    },

    removeListener: function(node, evType, handler) {
      if (this.gestures[evType]) {
        this.remove(node, evType, handler);
        return true;
      }
    },

    // automate the event listeners for the native events
    add: function(node, evType, handler) {
      // SD polyfill: handle case where `node` is unwrapped, like `document`
      node = wrap(node);
      let recognizer = this.gestures[evType];
      let deps = recognizer.deps;
      let name = recognizer.name;
      let gobj = node[GESTURE_KEY];
      if (!gobj) {
        node[GESTURE_KEY] = gobj = {};
      }
      for (let i = 0, dep, gd; i < deps.length; i++) {
        dep = deps[i];
        // don't add mouse handlers on iOS because they cause gray selection overlays
        if (IS_TOUCH_ONLY && MOUSE_EVENTS.indexOf(dep) > -1 && dep !== 'click') {
          continue;
        }
        gd = gobj[dep];
        if (!gd) {
          gobj[dep] = gd = {_count: 0};
        }
        if (gd._count === 0) {
          node.addEventListener(dep, this.handleNative);
        }
        gd[name] = (gd[name] || 0) + 1;
        gd._count = (gd._count || 0) + 1;
      }
      node.addEventListener(evType, handler);
      if (recognizer.touchAction) {
        this.setTouchAction(node, recognizer.touchAction);
      }
    },

    // automate event listener removal for native events
    remove: function(node, evType, handler) {
      // SD polyfill: handle case where `node` is unwrapped, like `document`
      node = wrap(node);
      let recognizer = this.gestures[evType];
      let deps = recognizer.deps;
      let name = recognizer.name;
      let gobj = node[GESTURE_KEY];
      if (gobj) {
        for (let i = 0, dep, gd; i < deps.length; i++) {
          dep = deps[i];
          gd = gobj[dep];
          if (gd && gd[name]) {
            gd[name] = (gd[name] || 1) - 1;
            gd._count = (gd._count || 1) - 1;
            if (gd._count === 0) {
              node.removeEventListener(dep, this.handleNative);
            }
          }
        }
      }
      node.removeEventListener(evType, handler);
    },

    register: function(recog) {
      this.recognizers.push(recog);
      for (let i = 0; i < recog.emits.length; i++) {
        this.gestures[recog.emits[i]] = recog;
      }
    },

    findRecognizerByEvent: function(evName) {
      for (let i = 0, r; i < this.recognizers.length; i++) {
        r = this.recognizers[i];
        for (let j = 0, n; j < r.emits.length; j++) {
          n = r.emits[j];
          if (n === evName) {
            return r;
          }
        }
      }
      return null;
    },

    // set scrolling direction on node to check later on first move
    // must call this before adding event listeners!
    setTouchAction: function(node, value) {
      if (HAS_NATIVE_TA) {
        node.style.touchAction = value;
      }
      node[TOUCH_ACTION] = value;
    },

    fire: function(target, type, detail) {
      let ev = new Event(type, { bubbles: true, cancelable: true, composed: true });
      ev.detail = detail;
      target.dispatchEvent(ev);
      // forward `preventDefault` in a clean way
      if (ev.defaultPrevented) {
        let preventer = detail.preventer || detail.sourceEvent;
        if (preventer && preventer.preventDefault) {
          preventer.preventDefault();
        }
      }
    },

    prevent: function(evName) {
      let recognizer = this.findRecognizerByEvent(evName);
      if (recognizer.info) {
        recognizer.info.prevent = true;
      }
    },

    /**
     * Reset the 2500ms timeout on processing mouse input after detecting touch input.
     *
     * Touch inputs create synthesized mouse inputs anywhere from 0 to 2000ms after the touch.
     * This method should only be called during testing with simulated touch inputs.
     * Calling this method in production may cause duplicate taps or other gestures.
     *
     * @method resetMouseCanceller
     */
    resetMouseCanceller: function() {
      if (POINTERSTATE.mouse.mouseIgnoreJob) {
        POINTERSTATE.mouse.mouseIgnoreJob.flush();
      }
    }
  };

  gestures.register({
    name: 'downup',
    deps: ['mousedown', 'touchstart', 'touchend'],
    flow: {
      start: ['mousedown', 'touchstart'],
      end: ['mouseup', 'touchend']
    },
    emits: ['down', 'up'],

    info: {
      movefn: null,
      upfn: null
    },

    reset: function() {
      untrackDocument(this.info);
    },

    mousedown: function(e) {
      if (!hasLeftMouseButton(e)) {
        return;
      }
      let t = gestures.findOriginalTarget(e);
      let self = this;
      let movefn = function movefn(e) {
        if (!hasLeftMouseButton(e)) {
          self.fire('up', t, e);
          untrackDocument(self.info);
        }
      };
      let upfn = function upfn(e) {
        if (hasLeftMouseButton(e)) {
          self.fire('up', t, e);
        }
        untrackDocument(self.info);
      };
      trackDocument(this.info, movefn, upfn);
      this.fire('down', t, e);
    },
    touchstart: function(e) {
      this.fire('down', gestures.findOriginalTarget(e), e.changedTouches[0], e);
    },
    touchend: function(e) {
      this.fire('up', gestures.findOriginalTarget(e), e.changedTouches[0], e);
    },
    fire: function(type, target, event, preventer) {
      gestures.fire(target, type, {
        x: event.clientX,
        y: event.clientY,
        sourceEvent: event,
        preventer: preventer,
        prevent: function(e) {
          return gestures.prevent(e);
        }
      });
    }
  });

  gestures.register({
    name: 'track',
    touchAction: 'none',
    deps: ['mousedown', 'touchstart', 'touchmove', 'touchend'],
    flow: {
      start: ['mousedown', 'touchstart'],
      end: ['mouseup', 'touchend']
    },
    emits: ['track'],

    info: {
      x: 0,
      y: 0,
      state: 'start',
      started: false,
      moves: [],
      addMove: function(move) {
        if (this.moves.length > TRACK_LENGTH) {
          this.moves.shift();
        }
        this.moves.push(move);
      },
      movefn: null,
      upfn: null,
      prevent: false
    },

    reset: function() {
      this.info.state = 'start';
      this.info.started = false;
      this.info.moves = [];
      this.info.x = 0;
      this.info.y = 0;
      this.info.prevent = false;
      untrackDocument(this.info);
    },

    hasMovedEnough: function(x, y) {
      if (this.info.prevent) {
        return false;
      }
      if (this.info.started) {
        return true;
      }
      let dx = Math.abs(this.info.x - x);
      let dy = Math.abs(this.info.y - y);
      return (dx >= TRACK_DISTANCE || dy >= TRACK_DISTANCE);
    },

    mousedown: function(e) {
      if (!hasLeftMouseButton(e)) {
        return;
      }
      let t = gestures.findOriginalTarget(e);
      let self = this;
      let movefn = function movefn(e) {
        let x = e.clientX, y = e.clientY;
        if (self.hasMovedEnough(x, y)) {
          // first move is 'start', subsequent moves are 'move', mouseup is 'end'
          self.info.state = self.info.started ? (e.type === 'mouseup' ? 'end' : 'track') : 'start';
          if (self.info.state === 'start') {
            // if and only if tracking, always prevent tap
            gestures.prevent('tap');
          }
          self.info.addMove({x: x, y: y});
          if (!hasLeftMouseButton(e)) {
            // always fire "end"
            self.info.state = 'end';
            untrackDocument(self.info);
          }
          self.fire(t, e);
          self.info.started = true;
        }
      };
      let upfn = function upfn(e) {
        if (self.info.started) {
          movefn(e);
        }

        // remove the temporary listeners
        untrackDocument(self.info);
      };
      // add temporary document listeners as mouse retargets
      trackDocument(this.info, movefn, upfn);
      this.info.x = e.clientX;
      this.info.y = e.clientY;
    },

    touchstart: function(e) {
      let ct = e.changedTouches[0];
      this.info.x = ct.clientX;
      this.info.y = ct.clientY;
    },

    touchmove: function(e) {
      let t = gestures.findOriginalTarget(e);
      let ct = e.changedTouches[0];
      let x = ct.clientX, y = ct.clientY;
      if (this.hasMovedEnough(x, y)) {
        if (this.info.state === 'start') {
          // if and only if tracking, always prevent tap
          gestures.prevent('tap');
        }
        this.info.addMove({x: x, y: y});
        this.fire(t, ct);
        this.info.state = 'track';
        this.info.started = true;
      }
    },

    touchend: function(e) {
      let t = gestures.findOriginalTarget(e);
      let ct = e.changedTouches[0];
      // only trackend if track was started and not aborted
      if (this.info.started) {
        // reset started state on up
        this.info.state = 'end';
        this.info.addMove({x: ct.clientX, y: ct.clientY});
        this.fire(t, ct, e);
      }
    },

    fire: function(target, touch) {
      let secondlast = this.info.moves[this.info.moves.length - 2];
      let lastmove = this.info.moves[this.info.moves.length - 1];
      let dx = lastmove.x - this.info.x;
      let dy = lastmove.y - this.info.y;
      let ddx, ddy = 0;
      if (secondlast) {
        ddx = lastmove.x - secondlast.x;
        ddy = lastmove.y - secondlast.y;
      }
      return gestures.fire(target, 'track', {
        state: this.info.state,
        x: touch.clientX,
        y: touch.clientY,
        dx: dx,
        dy: dy,
        ddx: ddx,
        ddy: ddy,
        sourceEvent: touch,
        hover: function() {
          return gestures.deepTargetFind(touch.clientX, touch.clientY);
        }
      });
    }

  });

  gestures.register({
    name: 'tap',
    deps: ['mousedown', 'click', 'touchstart', 'touchend'],
    flow: {
      start: ['mousedown', 'touchstart'],
      end: ['click', 'touchend']
    },
    emits: ['tap'],
    info: {
      x: NaN,
      y: NaN,
      prevent: false
    },
    reset: function() {
      this.info.x = NaN;
      this.info.y = NaN;
      this.info.prevent = false;
    },
    save: function(e) {
      this.info.x = e.clientX;
      this.info.y = e.clientY;
    },

    mousedown: function(e) {
      if (hasLeftMouseButton(e)) {
        this.save(e);
      }
    },
    click: function(e) {
      if (hasLeftMouseButton(e)) {
        this.forward(e);
      }
    },

    touchstart: function(e) {
      this.save(e.changedTouches[0], e);
    },
    touchend: function(e) {
      this.forward(e.changedTouches[0], e);
    },

    forward: function(e, preventer) {
      let dx = Math.abs(e.clientX - this.info.x);
      let dy = Math.abs(e.clientY - this.info.y);
      let t = gestures.findOriginalTarget(e);
      // dx,dy can be NaN if `click` has been simulated and there was no `down` for `start`
      if (isNaN(dx) || isNaN(dy) || (dx <= TAP_DISTANCE && dy <= TAP_DISTANCE) || isSyntheticClick(e)) {
        // prevent taps from being generated if an event has canceled them
        if (!this.info.prevent) {
          gestures.fire(t, 'tap', {
            x: e.clientX,
            y: e.clientY,
            sourceEvent: e,
            preventer: preventer
          });
        }
      }
    }
  });

  // expose for bc with Polymer 1.0 (e.g. add `tap` listener to document)
  Polymer.Gestures = gestures;

  Polymer.GestureEventListeners = Polymer.Utils.dedupingMixin(function(superClass) {

    return class GestureEventListeners extends Polymer.EventListeners(superClass) {

      _addEventListenerToNode(node, eventName, handler) {
        if (!gestures.addListener(node, eventName, handler)) {
          super._addEventListenerToNode(node, eventName, handler);
        }
      }

      _removeEventListenerFromNode(node, eventName, handler) {
        if (!gestures.removeListener(node, eventName, handler)) {
          super._removeEventListenerFromNode(node, eventName, handler);
        }
      }

    }

  });

})();
(function() {

  'use strict';

  Polymer.AsyncRender = {

    _scheduled: false,

    _beforeRenderQueue: [],

    _afterRenderQueue: [],

    beforeRender: function(cb) {
      if (!this._scheduled) {
        this._schedule();
      }
      this._beforeRenderQueue.push(cb);
    },

    afterRender: function(cb) {
      if (!this._scheduled) {
        this._schedule();
      }
      this._afterRenderQueue.push(cb);
    },

    _schedule: function() {
      this._scheduled = true;
      var self = this;
      // before next render
      requestAnimationFrame(function() {
        self._scheduled = false;
        self._flushQueue(self._beforeRenderQueue);
        // after the render
        setTimeout(function() {
          self._flushQueue(self._afterRenderQueue);
        });
      });
    },

    flush: function() {
      this.flushBeforeRender();
      this.flushAfterRender();
    },

    flushBeforeRender: function() {
      this._flushQueue(this._beforeRenderQueue);
    },

    flushAfterRender: function() {
      this._flushQueue(this._afterRenderQueue);
    },

    _flushQueue: function(queue) {
      for (var i=0; i<queue.length; i++) {
        // TODO(sorvell): include exception handling from Async.
        try {
          queue[i]();
        } catch(e) {
          console.warn(e);
        }
      }
      queue.splice(0, queue.length);
    }

  };

  // bc
  Polymer.RenderStatus = {
    afterNextRender: function(context, fn, args) {
      Polymer.AsyncRender.afterRender(function() {
        fn.apply(context, args);
      });
    }
  }

})();
(function() {

  'use strict';

  function newSplice(index, removed, addedCount) {
    return {
      index: index,
      removed: removed,
      addedCount: addedCount
    };
  }

  const EDIT_LEAVE = 0;
  const EDIT_UPDATE = 1;
  const EDIT_ADD = 2;
  const EDIT_DELETE = 3;

  let ArraySplice = {

    // Note: This function is *based* on the computation of the Levenshtein
    // "edit" distance. The one change is that "updates" are treated as two
    // edits - not one. With Array splices, an update is really a delete
    // followed by an add. By retaining this, we optimize for "keeping" the
    // maximum array items in the original array. For example:
    //
    //   'xxxx123' -> '123yyyy'
    //
    // With 1-edit updates, the shortest path would be just to update all seven
    // characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
    // leaves the substring '123' intact.
    calcEditDistances(current, currentStart, currentEnd,
                                old, oldStart, oldEnd) {
      // "Deletion" columns
      let rowCount = oldEnd - oldStart + 1;
      let columnCount = currentEnd - currentStart + 1;
      let distances = new Array(rowCount);

      // "Addition" rows. Initialize null column.
      for (let i = 0; i < rowCount; i++) {
        distances[i] = new Array(columnCount);
        distances[i][0] = i;
      }

      // Initialize null row
      for (let j = 0; j < columnCount; j++)
        distances[0][j] = j;

      for (let i = 1; i < rowCount; i++) {
        for (let j = 1; j < columnCount; j++) {
          if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
            distances[i][j] = distances[i - 1][j - 1];
          else {
            let north = distances[i - 1][j] + 1;
            let west = distances[i][j - 1] + 1;
            distances[i][j] = north < west ? north : west;
          }
        }
      }

      return distances;
    },

    // This starts at the final weight, and walks "backward" by finding
    // the minimum previous weight recursively until the origin of the weight
    // matrix.
    spliceOperationsFromEditDistances(distances) {
      let i = distances.length - 1;
      let j = distances[0].length - 1;
      let current = distances[i][j];
      let edits = [];
      while (i > 0 || j > 0) {
        if (i == 0) {
          edits.push(EDIT_ADD);
          j--;
          continue;
        }
        if (j == 0) {
          edits.push(EDIT_DELETE);
          i--;
          continue;
        }
        let northWest = distances[i - 1][j - 1];
        let west = distances[i - 1][j];
        let north = distances[i][j - 1];

        let min;
        if (west < north)
          min = west < northWest ? west : northWest;
        else
          min = north < northWest ? north : northWest;

        if (min == northWest) {
          if (northWest == current) {
            edits.push(EDIT_LEAVE);
          } else {
            edits.push(EDIT_UPDATE);
            current = northWest;
          }
          i--;
          j--;
        } else if (min == west) {
          edits.push(EDIT_DELETE);
          i--;
          current = west;
        } else {
          edits.push(EDIT_ADD);
          j--;
          current = north;
        }
      }

      edits.reverse();
      return edits;
    },

    /**
     * Splice Projection functions:
     *
     * A splice map is a representation of how a previous array of items
     * was transformed into a new array of items. Conceptually it is a list of
     * tuples of
     *
     *   <index, removed, addedCount>
     *
     * which are kept in ascending index order of. The tuple represents that at
     * the |index|, |removed| sequence of items were removed, and counting forward
     * from |index|, |addedCount| items were added.
     */

    /**
     * Lacking individual splice mutation information, the minimal set of
     * splices can be synthesized given the previous state and final state of an
     * array. The basic approach is to calculate the edit distance matrix and
     * choose the shortest path through it.
     *
     * Complexity: O(l * p)
     *   l: The length of the current array
     *   p: The length of the old array
     */
    calcSplices(current, currentStart, currentEnd,
                          old, oldStart, oldEnd) {
      let prefixCount = 0;
      let suffixCount = 0;
      let splice;

      let minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
      if (currentStart == 0 && oldStart == 0)
        prefixCount = this.sharedPrefix(current, old, minLength);

      if (currentEnd == current.length && oldEnd == old.length)
        suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);

      currentStart += prefixCount;
      oldStart += prefixCount;
      currentEnd -= suffixCount;
      oldEnd -= suffixCount;

      if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
        return [];

      if (currentStart == currentEnd) {
        splice = newSplice(currentStart, [], 0);
        while (oldStart < oldEnd)
          splice.removed.push(old[oldStart++]);

        return [ splice ];
      } else if (oldStart == oldEnd)
        return [ newSplice(currentStart, [], currentEnd - currentStart) ];

      let ops = this.spliceOperationsFromEditDistances(
          this.calcEditDistances(current, currentStart, currentEnd,
                                 old, oldStart, oldEnd));

      splice = undefined;
      let splices = [];
      let index = currentStart;
      let oldIndex = oldStart;
      for (let i = 0; i < ops.length; i++) {
        switch(ops[i]) {
          case EDIT_LEAVE:
            if (splice) {
              splices.push(splice);
              splice = undefined;
            }

            index++;
            oldIndex++;
            break;
          case EDIT_UPDATE:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.addedCount++;
            index++;

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
          case EDIT_ADD:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.addedCount++;
            index++;
            break;
          case EDIT_DELETE:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
        }
      }

      if (splice) {
        splices.push(splice);
      }
      return splices;
    },

    sharedPrefix(current, old, searchLength) {
      for (let i = 0; i < searchLength; i++)
        if (!this.equals(current[i], old[i]))
          return i;
      return searchLength;
    },

    sharedSuffix(current, old, searchLength) {
      let index1 = current.length;
      let index2 = old.length;
      let count = 0;
      while (count < searchLength && this.equals(current[--index1], old[--index2]))
        count++;

      return count;
    },

    calculateSplices(current, previous) {
      return this.calcSplices(current, 0, current.length, previous, 0,
                              previous.length);
    },

    equals(currentValue, previousValue) {
      return currentValue === previousValue;
    }

  };

  Polymer.ArraySplice = {
    calculateSplices(current, previous) {
      return ArraySplice.calculateSplices(current, previous);
    }
  }

})();
(function() {

  function isSlot(node) {
    return (node.localName === 'slot');
  }

  function getEffectiveNodes(node) {
    if (isSlot(node)) {
      return node.assignedNodes({flatten: true});
    } else {
      return Array.from(node.childNodes).map(node => {
        if (isSlot(node)) {
          return node.assignedNodes({flatten: true});
        } else {
          return [node];
        }
      }).reduce((a, b) => a.concat(b), []);
    }
  }

  let effectiveNodesObserverPromise = Promise.resolve();

  class EffectiveNodesObserver {

    constructor(target, callback) {
      this.target = target;
      this.callback = callback;
      this.effectiveNodes = [];
      this.observer = null;
      this.scheduled = false;
      this._boundSchedule = () => {
        this.schedule();
      }
      this.connect();
      this.schedule();
    }

    connect() {
      if (isSlot(this.target)) {
        this.listenSlots([this.target]);
      } else {
        this.listenSlots(this.target.children);
        if (window.ShadyDOM) {
          this.shadyChildrenObserver =
            ShadyDOM.observeChildren(this.target, (mutations) => {
              this.processMutations(mutations);
            });
        } else {
          this.nativeChildrenObserver =
            new MutationObserver((mutations) => {
              this.processMutations(mutations);
            });
          this.nativeChildrenObserver.observe(this.target, {childList: true});
        }
      }
      this.connected = true;
    }

    disconnect() {
      if (isSlot(this.target)) {
        this.unlistenSlots([this.target]);
      } else {
        this.unlistenSlots(this.target.children);
        if (window.ShadyDOM && this.shadyChildrenObserver) {
          ShadyDOM.unobserveChildren(this.shadyChildrenObserver);
          this.shadyChildrenObserver = null;
        } else if (this.nativeChildrenObserver) {
          this.nativeChildrenObserver.disconnect();
          this.nativeChildrenObserver = null;
        }
      }
      this.connected = false;
    }

    schedule() {
      if (!this.scheduled) {
        this.scheduled = true;
        effectiveNodesObserverPromise.then(() => {
          this.flush();
        });
      }
    }

    processMutations(mutations) {
      this.processSlotMutations(mutations);
      this.flush();
    }

    processSlotMutations(mutations) {
      if (mutations) {
        for (let i=0; i < mutations.length; i++) {
          let mutation = mutations[i];
          if (mutation.addedNodes) {
            this.listenSlots(mutation.addedNodes);
          }
          if (mutation.removedNodes) {
            this.unlistenSlots(mutation.removedNodes);
          }
        }
      }
    }

    flush() {
      if (!this.connected) {
        return;
      }
      if (window.ShadyDOM) {
        ShadyDOM.flush();
      }
      if (this.nativeChildrenObserver) {
        this.processSlotMutations(this.nativeChildrenObserver.takeRecords());
      } else if (this.shadyChildrenObserver) {
        this.processSlotMutations(this.shadyChildrenObserver.takeRecords());
      }
      this.scheduled = false;
      let info = {
        target: this.target,
        addedNodes: [],
        removedNodes: []
      };
      let newNodes = getEffectiveNodes(this.target);
      let splices = Polymer.ArraySplice.calculateSplices(newNodes,
        this.effectiveNodes);
      // process removals
      for (let i=0, s; (i<splices.length) && (s=splices[i]); i++) {
        for (let j=0, n; (j < s.removed.length) && (n=s.removed[j]); j++) {
          info.removedNodes.push(n);
        }
      }
      // process adds
      for (let i=0, s; (i<splices.length) && (s=splices[i]); i++) {
        for (let j=s.index; j < s.index + s.addedCount; j++) {
          info.addedNodes.push(newNodes[j]);
        }
      }
      // update cache
      this.effectiveNodes = newNodes;
      if (info.addedNodes.length || info.removedNodes.length) {
        this.callback.call(this.target, info);
      }
    }

    listenSlots(nodeList) {
      for (let i=0; i < nodeList.length; i++) {
        let n = nodeList[i];
        if (isSlot(n)) {
          n.addEventListener('slotchange', this._boundSchedule);
        }
      }
    }

    unlistenSlots(nodeList) {
      for (let i=0; i < nodeList.length; i++) {
        let n = nodeList[i];
        if (isSlot(n)) {
          n.removeEventListener('slotchange', this._boundSchedule);
        }
      }
    }

  }

  class DomApi {

    constructor(node) {
      if (window.ShadyDOM) {
        ShadyDOM.patch(node);
      }
      this.node = node;
    }

    observeNodes(callback) {
      return new EffectiveNodesObserver(this.node, callback);
    }

    unobserveNodes(observerHandle) {
      observerHandle.disconnect();
    }

    notifyObserver() {}

    deepContains(node) {
      if (this.node.contains(node)) {
        return true;
      }
      let n = node;
      let doc = node.ownerDocument;
      // walk from node to `this` or `document`
      while (n && n !== doc && n !== this.node) {
        // use logical parentnode, or native ShadowRoot host
        n = Polymer.dom(n).parentNode || n.host;
      }
      return n === this.node;
    }

    getOwnerRoot() {
      return this.node.getRootNode();
    }

    getDistributedNodes() {
      return (this.node.localName === 'slot') ?
        this.node.assignedNodes({flatten: true}) :
        [];
    }

    getDestinationInsertionPoints() {
      let ip$ = [];
      let n = this.node.assignedSlot;
      while (n) {
        ip$.push(n);
        n = n.assignedSlot;
      }
      return ip$;
    }

    importNode(externalNode, deep) {
      let doc = this.node instanceof Document ? this.node :
        this.node.ownerDocument;
      return doc.importNode(externalNode, deep);
    }

    getEffectiveChildNodes() {
      return getEffectiveNodes(this.node);
    }

    queryDistributedElements(selector) {
      let c$ = this.getEffectiveChildNodes();
      let list = [];
      for (let i=0, l=c$.length, c; (i<l) && (c=c$[i]); i++) {
        if ((c.nodeType === Node.ELEMENT_NODE) &&
            Polymer.Utils.matchesSelector(c, selector)) {
          list.push(c);
        }
      }
      return list;
    }

    get activeElement() {
      let node = this.node;
      return node._activeElement !== undefined ? node._activeElement : node.activeElement;
    }
  }

  function forwardMethods(proto, methods) {
    for (let i=0; i < methods.length; i++) {
      let method = methods[i];
      proto[method] = function() {
        return this.node[method].apply(this.node, arguments);
      }
    }
  }

  function forwardReadOnlyProperties(proto, properties) {
    for (let i=0; i < properties.length; i++) {
      let name = properties[i];
      Object.defineProperty(proto, name, {
        get: function() {
          return this.node[name];
        },
        configurable: true
      });
    }
  }

  function forwardProperties(proto, properties) {
    for (let i=0; i < properties.length; i++) {
      let name = properties[i];
      Object.defineProperty(proto, name, {
        get: function() {
          return this.node[name];
        },
        set: function(value) {
          this.node[name] = value;
        },
        configurable: true
      });
    }
  }

  forwardMethods(DomApi.prototype, [
    'cloneNode', 'appendChild', 'insertBefore', 'removeChild',
    'replaceChild', 'setAttribute', 'removeAttribute',
    'querySelector', 'querySelectorAll'
  ]);

  forwardReadOnlyProperties(DomApi.prototype, [
    'parentNode', 'firstChild', 'lastChild',
    'nextSibling', 'previousSibling', 'firstElementChild',
    'lastElementChild', 'nextElementSibling', 'previousElementSibling',
    'childNodes', 'children', 'classList'
  ]);

  forwardProperties(DomApi.prototype, [
    'textContent', 'innerHTML'
  ]);


  class EventApi {
    constructor(event) {
      this.event = event;
    }

    get rootTarget() {
      return this.event.composedPath()[0];
    }

    get localTarget() {
      return this.event.target;
    }

    get path() {
      return this.event.composedPath();
    }
  }

  Polymer.dom = function(obj) {
    obj = obj || document;
    let ctor = obj instanceof Event ? EventApi : DomApi;
    if (!obj.__domApi) {
      obj.__domApi = new ctor(obj);
    }
    return obj.__domApi;
  };

  Polymer.dom.flush = function() {
    if (window.ShadyDOM) {
      ShadyDOM.flush();
    }
    if (window.ShadyCSS) {
      ShadyCSS.flush();
    }
    if (customElements.flush) {
      customElements.flush();
    }
  }

  Polymer.Settings = {
    useShadow: true
  };

})();
(function() {

  // unresolved

  function resolve() {
    document.body.removeAttribute('unresolved');
  }

  if (window.WebComponents) {
    addEventListener('WebComponentsReady', resolve);
  } else {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      resolve();
    } else {
      addEventListener('DOMContentLoaded', resolve);
    }
  }

})();
(function() {
  'use strict';
  Polymer.Logging = Polymer.Utils.dedupingMixin(function(superClass) {
    const hasColor = (window.chrome && !(/edge/i.test(navigator.userAgent))) || (/firefox/i.test(navigator.userAgent));
    const prefix = hasColor ? ['%c[%s::%s]:', 'font-weight: bold; background-color:#EEEE00;'] : ['[%s::%s]:']

    return class Logging extends superClass {
      _logger(level, args) {
        // accept ['foo', 'bar'] and [['foo', 'bar']]
        if (Array.isArray(args) && args.length === 1) {
          args = args[0];
        }
        switch(level) {
          case 'log':
          case 'warn':
          case 'error':
            console[level](...args);
        }
      }
      _log(...args) {
        this._logger('log', args);
      }
      _warn(...args) {
        this._logger('warn', args);
      }
      _error(...args) {
        this._logger('error', args)
      }
      _logf(...args) {
        return prefix.concat(this.is).concat(args);
      }
    };
  });
})();
(function() {

  'use strict';

  var utils = Polymer.Utils;

  Polymer.LegacyElementMixin = Polymer.Utils.cachingMixin(function(base) {

    return class LegacyElement extends Polymer.Logging(
      Polymer.GestureEventListeners(Polymer.ElementMixin(base))) {

      constructor() {
        super();
        this.created();
      }

      _applyListeners() {
        this._applyConfigListeners(this.constructor._ownConfig);
      }

      _applyConfigListeners(config) {
        if (config.listeners) {
          for (let l in config.listeners) {
            this._addMethodEventListenerToNode(this, l, config.listeners[l]);
          }
        }
      }

      _ensureAttributes() {
        this._ensureConfigAttributes(this.constructor._ownConfig);
      }

      _ensureConfigAttributes(config) {
        if (config.hostAttributes) {
          for (let a in config.hostAttributes) {
            this._ensureAttribute(a, config.hostAttributes[a]);
          }
        }
      }

      ready() {
        this._applyListeners();
        this._ensureAttributes();
        super.ready();
      }

      connectedCallback() {
        super.connectedCallback();
        this.isAttached = true;
        this.attached();
      }

      disconnectedCallback() {
        this.isAttached = false;
        super.disconnectedCallback();
        this.detached();
      }

      attributeChangedCallback(name, old, value) {
        super.attributeChangedCallback(name, old, value);
        this.attributeChanged(name, old, value);
      }

      created() {}

      attached() {}

      detached() {}

      attributeChanged() {}

      serialize(value) {
        return this._serializeAttribute(value);
      }

      deserialize(value, type) {
        return this._deserializeAttribute(value, type);
      }

      reflectPropertyToAttribute(property, attribute, value) {
        this._propertyToAttribute(this, property, attribute, value);
      }

      serializeValueToAttribute(value, attribute, node) {
        this._valueToNodeAttribute(node || this, value, attribute);
      }

      /**
       * Copies own properties (including accessor descriptors) from a source
       * object to a target object.
       *
       * @method extend
       * @param {Object} prototype Target object to copy properties to.
       * @param {Object} api Source object to copy properties from.
       * @return {Object} prototype object that was passed as first argument.
       */
      extend(prototype, api) {
        return utils.extend(prototype, api);
      }

      /**
       * Copies props from a source object to a target object.
       *
       * Note, this method uses a simple `for...in` strategy for enumerating
       * properties.  To ensure only `ownProperties` are copied from source
       * to target and that accessor implementations are copied, use `extend`.
       *
       * @method mixin
       * @param {Object} target Target object to copy properties to.
       * @param {Object} source Source object to copy properties from.
       * @return {Object} Target object that was passed as first argument.
       */
      mixin(target, source) {
        return utils.mixin(target, source);
      }

      chainObject(object, inherited) {
        if (object && inherited && object !== inherited) {
          if (!Object.__proto__) {
            object = this.extend(Object.create(inherited), object);
          }
          object.__proto__ = inherited;
        }
        return object;
      }

      /* **** Begin Template **** */
      /**
       * Calls `importNode` on the `content` of the `template` specified and
       * returns a document fragment containing the imported content.
       *
       * @method instanceTemplate
       * @param {HTMLTemplateElement} template HTML template element to instance.
       * @return {DocumentFragment} Document fragment containing the imported
       *   template content.
      */
      instanceTemplate(template) {
        var dom =
          document.importNode(template._content || template.content, true);
        return dom;
      }

      /* **** Begin Events **** */
      /**
       * Dispatches a custom event with an optional detail value.
       *
       * @method fire
       * @param {String} type Name of event type.
       * @param {*=} detail Detail value containing event-specific
       *   payload.
       * @param {Object=} options Object specifying options.  These may include:
       *  `bubbles` (boolean, defaults to `true`),
       *  `cancelable` (boolean, defaults to false), and
       *  `node` on which to fire the event (HTMLElement, defaults to `this`).
       * @return {CustomEvent} The new event that was fired.
       */
      fire(type, detail, options) {
        options = options || {};
        detail = (detail === null || detail === undefined) ? {} : detail;
        var event = new Event(type, {
          bubbles: options.bubbles === undefined ? true : options.bubbles,
          cancelable: Boolean(options.cancelable),
          composed: options.composed === undefined ? true: options.composed
        });
        event.detail = detail;
        var node = options.node || this;
        node.dispatchEvent(event)
        return event;
      }

      /**
       * Convenience method to add an event listener on a given element,
       * late bound to a named method on this element.
       *
       * @method listen
       * @param {Element} node Element to add event listener to.
       * @param {string} eventName Name of event to listen for.
       * @param {string} methodName Name of handler method on `this` to call.
       */
      listen(node, eventName, methodName) {
        node = node || this;
        var hbl = this.__boundListeners ||
          (this.__boundListeners = new WeakMap());
        var bl = hbl.get(node);
        if (!bl) {
          bl = {};
          hbl.set(node, bl);
        }
        var key = eventName + methodName;
        if (!bl[key]) {
          bl[key] = this._addMethodEventListenerToNode(
            node, eventName, methodName, this);
        }
      }

      /**
       * Convenience method to remove an event listener from a given element,
       * late bound to a named method on this element.
       *
       * @method unlisten
       * @param {Element} node Element to remove event listener from.
       * @param {string} eventName Name of event to stop listening to.
       * @param {string} methodName Name of handler method on `this` to not call
       anymore.
       */
      unlisten(node, eventName, methodName) {
        node = node || this;
        var bl = this.__boundListeners && this.__boundListeners.get(node);
        var key = eventName + methodName;
        var handler = bl && bl[key];
        if (handler) {
          this._removeEventListenerFromNode(node, eventName, handler);
          bl[key] = null;
        }
      }

      /**
       * Override scrolling behavior to all direction, one direction, or none.
       *
       * Valid scroll directions:
       *   - 'all': scroll in any direction
       *   - 'x': scroll only in the 'x' direction
       *   - 'y': scroll only in the 'y' direction
       *   - 'none': disable scrolling for this node
       *
       * @method setScrollDirection
       * @param {String=} direction Direction to allow scrolling
       * Defaults to `all`.
       * @param {HTMLElement=} node Element to apply scroll direction setting.
       * Defaults to `this`.
       */
      setScrollDirection(direction, node) {
        Polymer.Gestures.setTouchAction(node || this, direction || 'auto');
      }
      /* **** End Events **** */

      /**
       * Convenience method to run `querySelector` on this local DOM scope.
       *
       * This function calls `Polymer.dom(this.root).querySelector(slctr)`.
       *
       * @method $$
       * @param {string} slctr Selector to run on this local DOM scope
       * @return {Element} Element found by the selector, or null if not found.
       */
      $$(slctr) {
        return this.root.querySelector(slctr);
      }

      /**
       * Return the element whose local dom within which this element
       * is contained. This is a shorthand for
       * `this.getRootNode().host`.
       */
      get domHost() {
        var root = this.getRootNode();
        return (root instanceof DocumentFragment) ? root.host : root;
      }

      /**
       * Force this element to distribute its children to its local dom.
       * This is necessary only when ShadyDOM is used and only in cases that
       * are not automatically handled. For example,
       * a user should call `distributeContent` if distribution has been
       * invalidated due to an element being added or removed from the shadowRoot
       * that contains an insertion point (<slot>) inside its subtree.
       * @method distributeContent
       */
      distributeContent() {
        if (window.ShadyDOM && this.shadowRoot) {
          this.shadowRoot.forceRender();
        }
      }

      /**
       * Returns a list of nodes that are the effective childNodes. The effective
       * childNodes list is the same as the element's childNodes except that
       * any `<content>` elements are replaced with the list of nodes distributed
       * to the `<content>`, the result of its `getDistributedNodes` method.
       *
       * @method getEffectiveChildNodes
       * @return {Array<Node>} List of effctive child nodes.
       */
      getEffectiveChildNodes() {
        return Polymer.dom(this).getEffectiveChildNodes();
      }

      /**
       * Returns a list of nodes distributed within this element that match
       * `selector`. These can be dom children or elements distributed to
       * children that are insertion points.
       * @method queryDistributedElements
       * @param {string} selector Selector to run.
       * @return {Array<Node>} List of distributed elements that match selector.
       */
      queryDistributedElements(selector) {
        return Polymer.dom(this).queryDistributedElements(selector);
      }

      /**
       * Returns a list of elements that are the effective children. The effective
       * children list is the same as the element's children except that
       * any `<content>` elements are replaced with the list of elements
       * distributed to the `<content>`.
       *
       * @method getEffectiveChildren
       * @return {Array<Node>} List of effctive children.
       */
      getEffectiveChildren() {
        var list = this.getEffectiveChildNodes();
        return list.filter(function(n) {
          return (n.nodeType === Node.ELEMENT_NODE);
        });
      }

      /**
       * Returns a string of text content that is the concatenation of the
       * text content's of the element's effective childNodes (the elements
       * returned by <a href="#getEffectiveChildNodes>getEffectiveChildNodes</a>.
       *
       * @method getEffectiveTextContent
       * @return {Array<Node>} List of effctive children.
       */
      getEffectiveTextContent() {
        var cn = this.getEffectiveChildNodes();
        var tc = [];
        for (var i=0, c; (c = cn[i]); i++) {
          if (c.nodeType !== Node.COMMENT_NODE) {
            tc.push(c.textContent);
          }
        }
        return tc.join('');
      }

      /**
       * Returns the first effective childNode within this element that
       * match `selector`. These can be dom child nodes or elements distributed
       * to children that are insertion points.
       * @method queryEffectiveChildren
       * @param {string} selector Selector to run.
       * @return {Object<Node>} First effective child node that matches selector.
       */
      queryEffectiveChildren(selector) {
        var e$ = this.queryDistributedElements(selector);
        return e$ && e$[0];
      }

      /**
       * Returns a list of effective childNodes within this element that
       * match `selector`. These can be dom child nodes or elements distributed
       * to children that are insertion points.
       * @method queryEffectiveChildren
       * @param {string} selector Selector to run.
       * @return {Array<Node>} List of effective child nodes that match selector.
       */
      queryAllEffectiveChildren(selector) {
        return this.queryDistributedElements(selector);
      }

      /**
       * Returns a list of nodes distributed to this element's `<content>`.
       *
       * If this element contains more than one `<content>` in its local DOM,
       * an optional selector may be passed to choose the desired content.
       *
       * @method getContentChildNodes
       * @param {String=} slctr CSS selector to choose the desired
       *   `<content>`.  Defaults to `content`.
       * @return {Array<Node>} List of distributed nodes for the `<content>`.
       */
      getContentChildNodes(slctr) {
        var content = this.root.querySelector(slctr || 'content');
        return content ? content.getDistributedNodes() : [];
      }

      /**
       * Returns a list of element children distributed to this element's
       * `<content>`.
       *
       * If this element contains more than one `<content>` in its
       * local DOM, an optional selector may be passed to choose the desired
       * content.  This method differs from `getContentChildNodes` in that only
       * elements are returned.
       *
       * @method getContentChildNodes
       * @param {String=} slctr CSS selector to choose the desired
       *   `<content>`.  Defaults to `content`.
       * @return {Array<HTMLElement>} List of distributed nodes for the
       *   `<content>`.
       */
      getContentChildren(slctr) {
        return this.getContentChildNodes(slctr).filter(function(n) {
          return (n.nodeType === Node.ELEMENT_NODE);
        });
      }

      /**
       * Checks whether an element is in this element's light DOM tree.
       *
       * @method isLightDescendant
       * @param {?Node} node The element to be checked.
       * @return {Boolean} true if node is in this element's light DOM tree.
       */
      isLightDescendant(node) {
        return this !== node && this.contains(node) &&
            this.getRootNode() === node.getRootNode();
      }

      /**
       * Checks whether an element is in this element's local DOM tree.
       *
       * @method isLocalDescendant
       * @param {HTMLElement=} node The element to be checked.
       * @return {Boolean} true if node is in this element's local DOM tree.
       */
      isLocalDescendant(node) {
        return this.root === node.getRootNode();
      }

      // NOTE: should now be handled by ShadyCss library.
      scopeSubtree(container, shouldObserve) { // eslint-disable-line no-unused-vars
      }

      /**
       * Returns the computed style value for the given property.
       * @param {String} property
       * @return {String} the computed value
       */
      getComputedStyleValue(property) {
        return ShadyCSS.getComputedStyleValue(this, property);
      }

      // debounce

      /**
       * Call `debounce` to collapse multiple requests for a named task into
       * one invocation which is made after the wait time has elapsed with
       * no new request.  If no wait time is given, the callback will be called
       * at microtask timing (guaranteed before paint).
       *
       *     debouncedClickAction(e) {
       *       // will not call `processClick` more than once per 100ms
       *       this.debounce('click', function() {
       *        this.processClick();
       *       } 100);
       *     }
       *
       * @method debounce
       * @param {String} jobName String to indentify the debounce job.
       * @param {Function} callback Function that is called (with `this`
       *   context) when the wait time elapses.
       * @param {number} wait Optional wait time in milliseconds (ms) after the
       *   last signal that must elapse before invoking `callback`
       */
      debounce(jobName, callback, wait) {
        this._debouncers = this._debouncers || {};
        return this._debouncers[jobName] = Polymer.Debouncer.debounce(
          this._debouncers[jobName], callback, wait, this);
      }

      /**
       * Returns whether a named debouncer is active.
       *
       * @method isDebouncerActive
       * @param {String} jobName The name of the debouncer started with `debounce`
       * @return {boolean} Whether the debouncer is active (has not yet fired).
       */
      isDebouncerActive(jobName) {
        this._debouncers = this._debouncers || {};
        var debouncer = this._debouncers[jobName];
        return !!(debouncer && debouncer.isActive());
      }

      /**
       * Immediately calls the debouncer `callback` and inactivates it.
       *
       * @method flushDebouncer
       * @param {String} jobName The name of the debouncer started with `debounce`
       */
      flushDebouncer(jobName) {
        this._debouncers = this._debouncers || {};
        var debouncer = this._debouncers[jobName];
        if (debouncer) {
          debouncer.flush();
        }
      }

      /**
       * Cancels an active debouncer.  The `callback` will not be called.
       *
       * @method cancelDebouncer
       * @param {String} jobName The name of the debouncer started with `debounce`
       */
      cancelDebouncer(jobName) {
        this._debouncers = this._debouncers || {}
        var debouncer = this._debouncers[jobName];
        if (debouncer) {
          debouncer.cancel();
        }
      }

      /**
       * Runs a callback function asyncronously.
       *
       * By default (if no waitTime is specified), async callbacks are run at
       * microtask timing, which will occur before paint.
       *
       * @method async
       * @param {Function} callback The callback function to run, bound to `this`.
       * @param {number=} waitTime Time to wait before calling the
       *   `callback`.  If unspecified or 0, the callback will be run at microtask
       *   timing (before paint).
       * @return {number} Handle that may be used to cancel the async job.
       */
      async(callback, waitTime) {
        var self = this;
        return Polymer.Async.run(function() {
          callback.call(self);
        }, waitTime);
      }

      /**
       * Cancels an async operation started with `async`.
       *
       * @method cancelAsync
       * @param {number} handle Handle returned from original `async` call to
       *   cancel.
       */
      cancelAsync(handle) {
        Polymer.Async.cancel(handle);
      }

      // other

      /**
       * Convenience method for creating an element and configuring it.
       *
       * @method create
       * @param {string} tag HTML element tag to create.
       * @param {Object} props Object of properties to configure on the
       *    instance.
       * @return {Element} Newly created and configured element.
       */
      create(tag, props) {
        var elt = document.createElement(tag);
        if (props) {
          if (elt.setProperties) {
            elt.setProperties(props);
          } else {
            for (var n in props) {
              elt[n] = props[n];
            }
          }
        }
        return elt;
      }

      /**
       * Convenience method for importing an HTML document imperatively.
       *
       * This method creates a new `<link rel="import">` element with
       * the provided URL and appends it to the document to start loading.
       * In the `onload` callback, the `import` property of the `link`
       * element will contain the imported document contents.
       *
       * @method importHref
       * @param {string} href URL to document to load.
       * @param {Function} onload Callback to notify when an import successfully
       *   loaded.
       * @param {Function} onerror Callback to notify when an import
       *   unsuccessfully loaded.
       * @param {boolean} optAsync True if the import should be loaded `async`.
       *   Defaults to `false`.
       * @return {HTMLLinkElement} The link element for the URL to be loaded.
       */
      importHref(href, onload, onerror, optAsync) { // eslint-disable-line no-unused-vars
        return Polymer.Utils.importHref.apply(this, arguments);
      }

      /**
       * Polyfill for Element.prototype.matches, which is sometimes still
       * prefixed.
       *
       * @method elementMatches
       * @param {string} selector Selector to test.
       * @param {Element=} node Element to test the selector against.
       * @return {boolean} Whether the element matches the selector.
       */
      elementMatches(selector, node) {
        return Polymer.Utils.matchesSelector(node || this, selector);
      }

      /**
       * Toggles an HTML attribute on or off.
       *
       * @method toggleAttribute
       * @param {String} name HTML attribute name
       * @param {boolean=} bool Boolean to force the attribute on or off.
       *    When unspecified, the state of the attribute will be reversed.
       * @param {HTMLElement=} node Node to target.  Defaults to `this`.
       */
      toggleAttribute(name, bool, node) {
        node = node || this;
        if (arguments.length == 1) {
          bool = !node.hasAttribute(name);
        }
        if (bool) {
          node.setAttribute(name, '');
        } else {
          node.removeAttribute(name);
        }
      }


      /**
       * Toggles a CSS class on or off.
       *
       * @method toggleClass
       * @param {String} name CSS class name
       * @param {boolean=} bool Boolean to force the class on or off.
       *    When unspecified, the state of the class will be reversed.
       * @param {HTMLElement=} node Node to target.  Defaults to `this`.
       */
      toggleClass(name, bool, node) {
        node = node || this;
        if (arguments.length == 1) {
          bool = !node.classList.contains(name);
        }
        if (bool) {
          node.classList.add(name);
        } else {
          node.classList.remove(name);
        }
      }

      /**
       * Cross-platform helper for setting an element's CSS `transform` property.
       *
       * @method transformText
       * @param {String} transform Transform setting.
       * @param {HTMLElement=} node Element to apply the transform to.
       * Defaults to `this`
       */
      transform(transformText, node) {
        node = node || this;
        node.style.webkitTransform = transformText;
        node.style.transform = transformText;
      }

      /**
       * Cross-platform helper for setting an element's CSS `translate3d`
       * property.
       *
       * @method translate3d
       * @param {number} x X offset.
       * @param {number} y Y offset.
       * @param {number} z Z offset.
       * @param {HTMLElement=} node Element to apply the transform to.
       * Defaults to `this`.
       */
      translate3d(x, y, z, node) {
        node = node || this;
        this.transform('translate3d(' + x + ',' + y + ',' + z + ')', node);
      }

      /**
       * Removes an item from an array, if it exists.
       *
       * If the array is specified by path, a change notification is
       * generated, so that observers, data bindings and computed
       * properties watching that path can update.
       *
       * If the array is passed directly, **no change
       * notification is generated**.
       *
       * @method arrayDelete
       * @param {String|Array} path Path to array from which to remove the item
       *   (or the array itself).
       * @param {any} item Item to remove.
       * @return {Array} Array containing item removed.
       */
      arrayDelete(arrayOrPath, item) {
        var index;
        if (Array.isArray(arrayOrPath)) {
          index = arrayOrPath.indexOf(item);
          if (index >= 0) {
            return arrayOrPath.splice(index, 1);
          }
        } else {
          var arr = Polymer.Path.get(this, arrayOrPath);
          index = arr.indexOf(item);
          if (index >= 0) {
            return this.splice(arrayOrPath, index, 1);
          }
        }
      }

    }

  });

  // bc
  Polymer.LegacyElement = Polymer.LegacyElementMixin(HTMLElement);
  Polymer.Base = Polymer.LegacyElement.prototype;

})();
(function() {

    'use strict';

    var utils = Polymer.Utils;
    var LegacyElementMixin = Polymer.LegacyElementMixin;

    var metaProps = {
      attached: true,
      detached: true,
      ready: true,
      created: true,
      beforeRegister: true,
      registered: true,
      attributeChanged: true,
      // meta objects
      behaviors: true,
      hostAttributes: true,
      properties: true,
      observers: true,
      listeners: true
    }

    var mixinBehaviors = function(behaviors, klass) {
      for (var i=0; i<behaviors.length; i++) {
        var b = behaviors[i];
        if (b) {
          klass = Array.isArray(b) ? mixinBehaviors(b, klass) :
            MixinBehavior(b, klass);
        }
      }
      return klass;
    }

    var flattenBehaviors = function(behaviors, list) {
      list = list || [];
      if (behaviors) {
        for (var i=0; i < behaviors.length; i++) {
          var b = behaviors[i];
          if (b) {
            if (Array.isArray(b)) {
              flattenBehaviors(b, list);
            } else {
              if (list.indexOf(b) < 0) {
                list.push(b);
              }
            }
          } else {
            Polymer._warn('behavior is null, check for missing or 404 import');
          }
        }
      }
      return list;
    }

    var MixinBehavior = function(behavior, Base) {

      var config = {
        properties: behavior.properties,
        observers: behavior.observers,
        generatedFrom: behavior
      };

      class PolymerGenerated extends Base {

        static get config() {
          return config;
        }

        static get template() {
          return behavior._template || super.template || this.prototype._template;
        }

        _invokeFunction(fn, args) {
          if (fn) {
            fn.apply(this, args);
          }
        }

        _initializeProperties() {
          // call `registered` only if it was not called for *this* constructor
          if (!PolymerGenerated.hasOwnProperty('__registered')) {
            PolymerGenerated.__registered = true;
            if (behavior.registered) {
              behavior.registered.call(Object.getPrototypeOf(this));
            }
          }
          super._initializeProperties();
        }

        created() {
          super.created();
          this._invokeFunction(behavior.created);
        }

        _applyListeners() {
          super._applyListeners();
          this._applyConfigListeners(behavior);
        }

        _ensureAttributes() {
          // ensure before calling super so that subclasses can override defaults
          this._ensureConfigAttributes(behavior);
          super._ensureAttributes();
        }

        ready() {
          super.ready();
          this._invokeFunction(behavior.ready);
        }

        attached() {
          super.attached();
          this._invokeFunction(behavior.attached);
        }

        detached() {
          super.detached();
          this._invokeFunction(behavior.detached);
        }

        attributeChanged(name, old, value) {
          super.attributeChanged(name, old, value);
          this._invokeFunction(behavior.attributeChanged, [name, old, value]);
        }
      }

      for (var p in behavior) {
        if (!(p in metaProps))
          utils.copyOwnProperty(p, behavior, PolymerGenerated.prototype);
      }

      return PolymerGenerated;
    }

    //var nativeConstructors = {};

    /**
     * Returns the native element constructor for the tag specified.
     *
     * @method getNativeConstructor
     * @param {string} tag  HTML tag name.
     * @return {Object} Native constructor for specified tag.
    */
    var getNativeConstructor = function(tag) {
      if (tag) {
        // TODO(kschaaf): hack, for now, needs to be removed; needed to allow
        // subclassing from overwridden constructors in CEv1 polyfill
        return window['HTML' + tag[0].toUpperCase() + tag.slice(1) + 'Element'];
        // var c = nativeConstructors[tag];
        // if (!c) {
        //   c = document.createElement(tag).constructor;
        //   nativeConstructors[tag] = c;
        // }
        // return c;
      } else {
        return HTMLElement;
      }
    }

    Polymer.Class = function(info) {
      if (!info) {
        Polymer._warn('Polymer.Class requires `info` argument');
      }
      var klass = LegacyElementMixin(getNativeConstructor(info.extends));
      var behaviors = flattenBehaviors(info.behaviors);
      if (behaviors.length) {
        klass = mixinBehaviors(behaviors, klass);
      }
      klass = MixinBehavior(info, klass);
      // decorate klass with registration info
      klass.is = info.is;
      klass.extends = info.extends;
      // behaviors on prototype for BC...
      behaviors.reverse();
      klass.prototype.behaviors = behaviors;
      // NOTE: while we could call `beforeRegister` here to maintain
      // some BC, the state of the element at this point is not as it was in 1.0
      // In 1.0, the method was called *after* mixing prototypes together
      // but before processing of meta-objects. Since this is now done
      // in 1 step via `MixinBehavior`, this is no longer possible.
      // However, *most* work (not setting `is`) that was previously done in
      // `beforeRegister` should be possible in `registered`.
      return klass;
    }

  })();
(function() {

    class DomBind extends Polymer.BatchedEffects(HTMLElement) {

      connectedCallback() {
        this.render();
      }

      disconnectedCallback() {
        this._removeChildren();
      }

      _insertChildren() {
        this.parentNode.insertBefore(this.root, this);
      }

      _removeChildren() {
        if (this._children) {
          for (var i=0; i<this._children.length; i++) {
            this.root.appendChild(this._children[i]);
          }
        }
      }

      /**
       * Forces the element to render its content. This is typically only
       * necessary to call if HTMLImports with the async attribute are used.
       */
      render() {
        if (!this._children) {
          var template = this.querySelector('template');
          if (!template) {
            throw new Error('dom-bind requires a <template> child');
          }
          this._bindTemplate(template);
          this.root = this._stampTemplate(template);
          this._children = [];
          for (var n=this.root.firstChild; n; n=n.nextSibling) {
            this._children[this._children.length] = n;
          }
          this._flushProperties(this);
        }
        this._insertChildren();
        this.dispatchEvent(new CustomEvent('dom-change'));
      }

    }

    customElements.define('dom-bind', DomBind);

  })();
(function() {
    'use strict';

    let TemplateInstanceBase = Polymer.BatchedEffects(class{});

    function PatchedHTMLTemplateElement() {
      return PatchedHTMLTemplateElement._newInstance;
    }
    PatchedHTMLTemplateElement.prototype = Object.create(HTMLTemplateElement.prototype, {
      constructor: {
        value: PatchedHTMLTemplateElement
      }
    });
    PatchedHTMLTemplateElement._newInstance = null;

    class DataTemplate extends Polymer.BatchedEffects(PatchedHTMLTemplateElement) {
      static upgradeTemplate(template) {
        PatchedHTMLTemplateElement._newInstance = template;
        Object.setPrototypeOf(template, DataTemplate.prototype);
        new DataTemplate();
        PatchedHTMLTemplateElement._newInstance = null;
      }
    }

    class Templatizer {

      static enqueueDebouncer(debouncer) {
        this._debouncerQueue = this._debouncerQueue || [];
        this._debouncerQueue.push(debouncer);
      }

      static flush() {
        if (this._debouncerQueue) {
          while (this._debouncerQueue.length) {
            this._debouncerQueue.shift().flush();
          }
        }
      }

      templatize(template, options) {
        let klass = template.__templatizerClass;
        // Return memoized class if already templatized (allows calling
        // templatize on same template more than once)
        if (klass) {
          return klass;
        }
        // Ensure template has _content
        template._content = template._content || template.content;
        // Get memoized base class for the prototypical template
        let baseClass = template._content.__templatizerClass;
        if (!baseClass) {
          baseClass = template._content.__templatizerClass =
            this._createTemplatizerClass(template, options);
        }
        // Host property forwarding must be installed onto template instance
        this._prepHostProperties(template, options);
        // Subclass base class to add template reference for this specific
        // template
        klass = class TemplateInstance extends baseClass {};
        klass.prototype.__template = template;
        klass.instCount = 0;   
        template.__templatizerClass = klass;         
        return klass;
      }

      _createTemplatizerClass(template, options) {
        // Anonymous class created by the templatizer
        var klass = class extends TemplateInstanceBase {
          //TODO(kschaaf): for debugging; remove?
          get localName() { return 'template#' + this.__template.id + '/TemplateInstance' }
          constructor(host, props) {
            super();
            //TODO(kschaaf): for debugging; remove?
            this.id = this.constructor.instCount;
            this.constructor.instCount++;
            this.__dataHost = this.__template;
            // Root data host is always calculated based on the template, which
            // is guaranteed to have a __dataHost (due to being in __dataNodes for
            // purposes of getting templateContent)
            let templateHost = this.__template.__dataHost;
            this._rootDataHost = 
              templateHost && templateHost._rootDataHost || templateHost;
            this._hostProps = template._content._hostProps;
            this._configureProperties(props);
            //TODO(kschaaf): id marshalling unnecessary
            this.root = this._stampTemplate(template);
            // Save list of stamped children
            var children = this.children = [];
            for (var n = this.root.firstChild; n; n=n.nextSibling) {
              children.push(n);
              n._templateInstance = this;
            }
            if (host.__hideTemplateChildren__) {
              this._showHideChildren(true);
            }
            this._flushProperties(true);
          }
          _showHideChildren(hide) {
            var c = this.children;
            for (var i=0; i<c.length; i++) {
              var n = c[i];
              // Ignore non-changes
              if (Boolean(hide) != Boolean(n.__hideTemplateChildren__)) {
                if (n.nodeType === Node.TEXT_NODE) {
                  if (hide) {
                    n.__polymerTextContent__ = n.textContent;
                    n.textContent = '';
                  } else {
                    n.textContent = n.__polymerTextContent__;
                  }
                } else if (n.style) {
                  if (hide) {
                    n.__polymerDisplay__ = n.style.display;
                    n.style.display = 'none';
                  } else {
                    n.style.display = n.__polymerDisplay__;
                  }
                }
              }
              n.__hideTemplateChildren__ = hide;
              if (n._showHideChildren) {
                n._showHideChildren(hide);
              }
            }
          }
          _configureProperties(props) {
            if (props) {
              for (var iprop in options.instanceProps) {
                if (iprop in props) {
                  this[iprop] = props[iprop];
                }
              }
            }
            for (var hprop in this._hostProps) {
              this[hprop] = this.__template['_host_' + hprop];
            }
          }
          forwardProperty(prop, value, host) {
            this._setPendingProperty(prop, value);
            if (host) {
              host._enqueueClient(this);
            }
          }
          flushProperties() {
            this._flushProperties(true);
          }
          dispatchEvent() { }
          _addEventListenerToNode(node, eventName, handler) {
            if (this._rootDataHost) {
              this._rootDataHost._addEventListenerToNode(node, eventName, (e) => {
                e.model = this;
                handler(e);
              });              
            }
          }
        }
        klass.prototype._bindTemplate(template);
        this._prepInstanceProperties(klass, template, options);
        return klass;
      }

      _prepHostProperties(template, options) {
        if (options.fwdHostPropToInstance) {
          // Provide data API
          // TODO(kschaaf): memoize template proto
          DataTemplate.upgradeTemplate(template);
          // Add template - >instances effects
          // and host <- template effects
          var hostProps = template._content._hostProps;
          for (var prop in hostProps) {
            template._addPropertyEffect('_host_' + prop,
              template.PROPERTY_EFFECT_TYPES.PROPAGATE,
              {fn: this._createHP2IEffector(prop, options)});
            template._createNotifyingProperty('_host_' + prop);
          }
          // Mix any pre-bound data into __data; no need to flush this to
          // instances since they pull from the template at instance-time
          if (template.__dataProto) {
            Polymer.Utils.mixin(template.__data, template.__dataProto);
          }
        }
      }

      _createHP2IEffector(hostProp, options) {
        return function(template, prop, value) {
          options.fwdHostPropToInstance.call(template, template,
            prop.substring('_host_'.length), value);
        }
      }

      _prepInstanceProperties(klass, template, options) {
        var hostProps = template._content._hostProps || {};
        for (var iprop in options.instanceProps) {
          delete hostProps[iprop];
          if (options.fwdInstancePropToHost) {
            klass.prototype._addPropertyEffect(iprop,
              klass.prototype.PROPERTY_EFFECT_TYPES.NOTIFY,
              {fn: this._createIP2HEffector(iprop, options)});
          }
        }
        if (options.fwdHostPropToInstance && template.__dataHost) {
          for (var hprop in hostProps) {
            klass.prototype._addPropertyEffect(hprop,
              klass.prototype.PROPERTY_EFFECT_TYPES.NOTIFY,
              {fn: this._createHP2HEffector()})
          }
        }
      }

      _createIP2HEffector(instProp, options) {
        return function fwdInstPropToHost(inst, prop, value, old, info, fromAbove) {
          if (!fromAbove) {
            options.fwdInstancePropToHost.call(inst, inst, prop, value);
          }
        }
      }

      _createHP2HEffector() {
        return function fwdHostPropToHost(inst, prop, value, old, info, fromAbove) {
          if (!fromAbove) {
            // TODO(kschaaf) This does not take advantage of the efficient
            // upward flow in batched effects
            inst.__template._setProperty('_host_' + prop, value);
          }
        }
      }

      /**
       * Returns the template "model" associated with a given element, which
       * serves as the binding scope for the template instance the element is
       * contained in. A template model is an instance of `Polymer.Base`, and
       * should be used to manipulate data associated with this template instance.
       *
       * Example:
       *
       *   var model = modelForElement(el);
       *   if (model.index < 10) {
       *     model.set('item.checked', true);
       *   }
       *
       * @method modelForElement
       * @param {HTMLElement} el Element for which to return a template model.
       * @return {Object<Polymer.Base>} Model representing the binding scope for
       *   the element.
       */
      modelForElement(host, el) {
        var model;
        while (el) {
          // An element with a _templateInstance marks the top boundary
          // of a scope; walk up until we find one, and then ensure that
          // its __dataHost matches `this`, meaning this dom-repeat stamped it
          if ((model = el._templateInstance)) {
            // Found an element stamped by another template; keep walking up
            // from its __dataHost
            if (model.__dataHost != host) {
              el = model.__dataHost;
            } else {
              return model;
            }
          } else {
            // Still in a template scope, keep going up until
            // a _templateInstance is found
            el = el.parentNode;
          }
        }
      }
    }

    Polymer.Templatizer = Templatizer;

  })();
(function() {
  'use strict';

  var templatizer = new Polymer.Templatizer();

  class DomRepeat extends Polymer.Element {

    static get template() { return null; }

    static get config() { 

      return {

        /**
         * Fired whenever DOM is added or removed by this template (by
         * default, rendering occurs lazily).  To force immediate rendering, call
         * `render`.
         *
         * @event dom-change
         */

        properties: {

          /**
           * An array containing items determining how many instances of the template
           * to stamp and that that each template instance should bind to.
           */
          items: {
            type: Array
          },

          /**
           * The name of the variable to add to the binding scope for the array
           * element associated with a given template instance.
           */
          as: {
            type: String,
            value: 'item'
          },

          /**
           * The name of the variable to add to the binding scope with the index
           * for the inst.  If `sort` is provided, the index will reflect the
           * sorted order (rather than the original array order).
           */
          indexAs: {
            type: String,
            value: 'index'
          },

          /**
           * The name of the variable to add to the binding scope with the index
           * for the inst.  If `sort` is provided, the index will reflect the
           * sorted order (rather than the original array order).
           */
          itemsIndexAs: {
            type: String,
            value: 'itemsIndex'
          },

          /**
           * A function that should determine the sort order of the items.  This
           * property should either be provided as a string, indicating a method
           * name on the element's host, or else be an actual function.  The
           * function should match the sort function passed to `Array.sort`.
           * Using a sort function has no effect on the underlying `items` array.
           */
          sort: {
            type: Function,
            observer: '_sortChanged'
          },

          /**
           * A function that can be used to filter items out of the view.  This
           * property should either be provided as a string, indicating a method
           * name on the element's host, or else be an actual function.  The
           * function should match the sort function passed to `Array.filter`.
           * Using a filter function has no effect on the underlying `items` array.
           */
          filter: {
            type: Function,
            observer: '_filterChanged'
          },

          /**
           * When using a `filter` or `sort` function, the `observe` property
           * should be set to a space-separated list of the names of item
           * sub-fields that should trigger a re-sort or re-filter when changed.
           * These should generally be fields of `item` that the sort or filter
           * function depends on.
           */
          observe: {
            type: String,
            observer: '_observeChanged'
          },

          /**
           * When using a `filter` or `sort` function, the `delay` property
           * determines a debounce time after a change to observed item
           * properties that must pass before the filter or sort is re-run.
           * This is useful in rate-limiting shuffing of the view when
           * item changes may be frequent.
           */
          delay: Number,

          /**
           * Count of currently rendered items after `filter` (if any) has been applied.
           * If "chunking mode" is enabled, `renderedItemCount` is updated each time a
           * set of template instances is rendered.
           *
           */
          renderedItemCount: {
            type: Number,
            notify: true,
            readOnly: true
          },

          /**
           * Defines an initial count of template instances to render after setting
           * the `items` array, before the next paint, and puts the `dom-repeat`
           * into "chunking mode".  The remaining items will be created and rendered
           * incrementally at each animation frame therof until all instances have
           * been rendered.
           */
          initialCount: {
            type: Number,
            observer: '_initializeChunking'
          },

          /**
           * When `initialCount` is used, this property defines a frame rate to
           * target by throttling the number of instances rendered each frame to
           * not exceed the budget for the target frame rate.  Setting this to a
           * higher number will allow lower latency and higher throughput for
           * things like event handlers, but will result in a longer time for the
           * remaining items to complete rendering.
           */
          targetFramerate: {
            type: Number,
            value: 20
          },

          _targetFrameTime: {
            type: Number,
            computed: '_computeFrameTime(targetFramerate)'
          }

        },

        observers: [
          '_itemsChanged(items.*)'
        ]

      }

    }


    constructor() {
      super();
      this._instances = [];
      this._pool = [];
      this._limit = Infinity;
      this._renderDebouncer = null;
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.__isDetached = true;
      for (var i=0; i<this._instances.length; i++) {
        this._detachInstance(i);
      }
    }

    connectedCallback() {
      super.connectedCallback();
      // only perform attachment if the element was previously detached.
      if (this.__isDetached) {
        this.__isDetached = false;
        var parent = this.parentNode;
        for (var i=0; i<this._instances.length; i++) {
          this._attachInstance(i, parent);
        }
      }
    }

    ensureTemplatized() {
      // Templatizing (generating the instance constructor) needs to wait
      // until ready, since won't have its template content handed back to
      // it until then
      if (!this._ctor) {
        var template = this.template = this.querySelector('template');
        template.__domRepeat = this;
        if (!template) {
          throw new Error('dom-repeat requires a <template> child');
        }
        // Template instance props that should be excluded from forwarding
        var instanceProps = {};
        instanceProps[this.as] = true;
        instanceProps[this.indexAs] = true;
        instanceProps[this.itemsIndexAs] = true;
        this._ctor = templatizer.templatize(template, {
          instanceProps: instanceProps,
          fwdHostPropToInstance: function(template, prop, value) {
            let repeater = template.__domRepeat;
            var i$ = repeater._instances;
            for (var i=0, inst; (i<i$.length) && (inst=i$[i]); i++) {
              inst.forwardProperty(prop, value, template);
            }
          },
          fwdInstancePropToHost: function(inst, prop, value) {
            let repeater = inst.__template.__domRepeat;
            if (Polymer.Path.matches(repeater.as, prop)) {
              let idx = inst[repeater.itemsIndexAs];
              if (prop == repeater.as) {
                repeater.items[idx] = value;
              }
              let path = Polymer.Path.translate(repeater.as, 'items.' + idx, prop);
              repeater.notifyPath(path, value);
            }
          }
        });
      }
    }

    _getRootDataHost() {
      return this.__dataHost._rootDataHost || this.__dataHost;
    }

    _sortChanged(sort) {
      var dataHost = this._getRootDataHost();
      this._sortFn = sort && (typeof sort == 'function' ? sort :
        function() { return dataHost[sort].apply(dataHost, arguments); });
      this._needFullRefresh = true;
      if (this.items) {
        this._debounceRender(this._render);
      }
    }

    _filterChanged(filter) {
      var dataHost = this._getRootDataHost();
      this._filterFn = filter && (typeof filter == 'function' ? filter :
        function() { return dataHost[filter].apply(dataHost, arguments); });
      this._needFullRefresh = true;
      if (this.items) {
        this._debounceRender(this._render);
      }
    }

    _computeFrameTime(rate) {
      return Math.ceil(1000/rate);
    }

    _initializeChunking() {
      if (this.initialCount) {
        this._limit = this.initialCount;
        this._chunkCount = this.initialCount;
        this._lastChunkTime = performance.now();
      }
    }

    _tryRenderChunk() {
      // Debounced so that multiple calls through `_render` between animation
      // frames only queue one new rAF (e.g. array mutation & chunked render)
      if (this.items && this._limit < this.items.length) {
        this._debounceRender(this._requestRenderChunk);
      }
    }

    _requestRenderChunk() {
      requestAnimationFrame(()=>this._renderChunk());
    }

    _renderChunk() {
      // Simple auto chunkSize throttling algorithm based on feedback loop:
      // measure actual time between frames and scale chunk count by ratio
      // of target/actual frame time
      var currChunkTime = performance.now();
      var ratio = this._targetFrameTime / (currChunkTime - this._lastChunkTime);
      this._chunkCount = Math.round(this._chunkCount * ratio) || 1;
      this._limit += this._chunkCount;
      this._lastChunkTime = currChunkTime;
      this._debounceRender(this._render);
    }

    _observeChanged() {
      this._observePaths = this.observe &&
        this.observe.replace('.*', '.').split(' ');
    }

    _itemsChanged(change) {
      if (this.items && !Array.isArray(this.items)) {
        console.warn('dom-repeat expected array for `items`, found', this.items);
      }
      // If path was to an item (e.g. 'items.3' or 'items.3.foo'), forward the
      // path to that instance synchronously (retuns false for non-item paths)
      if (!this._forwardItemPath(change.path, change.value)) {
        // Otherwise, the array was reset ('items') or spliced ('items.splices'),
        // so queue a full refresh
        this._needFullRefresh = true;
        this._initializeChunking();
        this._debounceRender(this._render);
      }
    }

    _checkObservedPaths(path) {
      if (this._observePaths) {
        path = path.substring(path.indexOf('.') + 1);
        var paths = this._observePaths;
        for (var i=0; i<paths.length; i++) {
          if (path.indexOf(paths[i]) === 0) {
            this._needFullRefresh = true;
            this._debounceRender(this._render, this.delay);
            return true;
          }
        }
      }
    }

    _debounceRender(fn, delay) {
      this._renderDebouncer =
        Polymer.Debouncer.debounce(this._renderDebouncer, fn, delay, this);
      Polymer.Templatizer.enqueueDebouncer(this._renderDebouncer);
    }

    /**
     * Forces the element to render its content. Normally rendering is
     * asynchronous to a provoking change. This is done for efficiency so
     * that multiple changes trigger only a single render. The render method
     * should be called if, for example, template rendering is required to
     * validate application state.
     */
    render() {
      // Queue this repeater, then flush all in order
      this._needFullRefresh = true;
      this._debounceRender(this._render);
      Polymer.Templatizer.flush();
    }

    _render() {
      this.ensureTemplatized();
      this._applyFullRefresh();
      // Reset the pool
      // TODO(kschaaf): Reuse pool across turns and nested templates
      // Requires updating hostProps and dealing with the fact that path
      // notifications won't reach instances sitting in the pool, which
      // could result in out-of-sync instances since simply re-setting
      // `item` may not be sufficient if the pooled instance happens to be
      // the same item.
      this._pool.length = 0;
      // Set rendered item count
      this._setRenderedItemCount(this._instances.length);
      // Notify users
      this.dispatchEvent(new CustomEvent('dom-change', {bubbles: true}));
      // Check to see if we need to render more items
      this._tryRenderChunk();
    }

    _applyFullRefresh() {
      const items = this.items || [];
      let isntIdxToItemsIdx = new Array(items.length);
      for (let i=0; i<items.length; i++) {
        isntIdxToItemsIdx[i] = i;
      }
      // Apply user filter
      if (this._filterFn) {
        isntIdxToItemsIdx = isntIdxToItemsIdx.filter((i, idx, array) =>
          this._filterFn(items[i], idx, array));
      }
      // Apply user sort
      if (this._sortFn) {
        isntIdxToItemsIdx.sort((a, b) => this._sortFn(items[a], items[b]));
      }
      // items->inst map kept for item path forwarding
      const itemsIdxToInstIdx = this._itemsIdxToInstIdx = {};
      let instIdx = 0;
      // Generate instances and assign items
      const limit = Math.min(isntIdxToItemsIdx.length, this._limit);
      for (; instIdx<limit; instIdx++) {
        let inst = this._instances[instIdx];
        let itemIdx = isntIdxToItemsIdx[instIdx];
        let item = items[itemIdx];
        itemsIdxToInstIdx[itemIdx] = instIdx;
        if (inst && instIdx < this._limit) {
          inst.forwardProperty(this.as, item);
          inst.forwardProperty(this.indexAs, instIdx);
          inst.forwardProperty(this.itemsIndexAs, itemIdx);
          inst.flushProperties();
        } else {
          this._insertInstance(item, instIdx, itemIdx);
        }
      }
      // Remove any extra instances from previous state
      for (let i=this._instances.length-1; i>=instIdx; i--) {
        this._detachAndRemoveInstance(i);
      }
    }

    _detachInstance(idx) {
      var inst = this._instances[idx];
      //TODO(sorvell): why is this necessary?
      if (inst.children) {
        for (var i=0; i<inst.children.length; i++) {
          var el = inst.children[i];
          inst.root.appendChild(el);
        }
      }
      return inst;
    }

    _attachInstance(idx, parent) {
      var inst = this._instances[idx];
      parent.insertBefore(inst.root, this);
    }

    _detachAndRemoveInstance(idx) {
      var inst = this._detachInstance(idx);
      if (inst) {
        this._pool.push(inst);
      }
      this._instances.splice(idx, 1);
    }

    _stampInstance(item, instIdx, itemIdx) {
      var model = {};
      model[this.as] = item;
      model[this.indexAs] = instIdx;
      model[this.itemsIndexAs] = itemIdx;
      return new this._ctor(this, model);
    }

    _insertInstance(item, instIdx, itemIdx) {
      var inst = this._pool.pop();
      if (inst) {
        // TODO(kschaaf): If the pool is shared across turns, hostProps
        // need to be re-set to reused instances in addition to item
        inst.forwardProperty(this.as, item);
        inst.forwardProperty(this.indexAs, instIdx);
        inst.forwardProperty(this.itemsIndexAs, itemIdx);
      } else {
        inst = this._stampInstance(item, instIdx, itemIdx);
      }
      var beforeRow = this._instances[instIdx + 1];
      var beforeNode = beforeRow ? beforeRow.children[0] : this;
      // TODO(sorvell): remove when fragment patching is auto-magic.
      if (window.ShadyDOM) {
        ShadyDOM.patch(inst.root);
      }
      this.parentNode.insertBefore(inst.root, beforeNode);
      this._instances[instIdx] = inst;
      return inst;
    }

    // Implements extension point from Templatizer mixin
    _showHideChildren(hidden) {
      for (var i=0; i<this._instances.length; i++) {
        this._instances[i]._showHideChildren(hidden);
      }
    }

    // Called as a side effect of a host items.<key>.<path> path change,
    // responsible for notifying item.<path> changes to inst for key
    _forwardItemPath(path, value) {
      if (this._itemsIdxToInstIdx) {
        path = path.slice(6); // 'items.'.length == 6
        var dot = path.indexOf('.');
        var itemsIdx = dot < 0 ? path : path.substring(0, dot);
        var instIdx = this._itemsIdxToInstIdx[itemsIdx];
        var inst = this._instances[instIdx];
        if (inst) {
          path = dot < 0 ? '' : path.substring(dot+1);
          if (!this._checkObservedPaths(path)) {
            inst.forwardProperty(this.as + (path ? '.' + path : ''), value);
            inst.flushProperties();
            return true;
          }        
        }
      }
    }

    /**
     * Returns the item associated with a given element stamped by
     * this `dom-repeat`.
     *
     * Note, to modify sub-properties of the item,
     * `modelForElement(el).set('item.<sub-prop>', value)`
     * should be used.
     *
     * @method itemForElement
     * @param {HTMLElement} el Element for which to return the item.
     * @return {any} Item associated with the element.
     */
    itemForElement(el) {
      var instance = this.modelForElement(el);
      return instance && instance[this.as];
    }

    /**
     * Returns the inst index for a given element stamped by this `dom-repeat`.
     * If `sort` is provided, the index will reflect the sorted order (rather
     * than the original array order).
     *
     * @method indexForElement
     * @param {HTMLElement} el Element for which to return the index.
     * @return {any} Row index associated with the element (note this may
     *   not correspond to the array index if a user `sort` is applied).
     */
    indexForElement(el) {
      var instance = this.modelForElement(el);
      return instance && instance[this.indexAs];
    }

    /**
     * Returns the template "model" associated with a given element, which
     * serves as the binding scope for the template instance the element is
     * contained in. A template model is an instance of `Polymer.Base`, and
     * should be used to manipulate data associated with this template instance.
     *
     * Example:
     *
     *   var model = modelForElement(el);
     *   if (model.index < 10) {
     *     model.set('item.checked', true);
     *   }
     *
     * @method modelForElement
     * @param {HTMLElement} el Element for which to return a template model.
     * @return {Object<Polymer.Base>} Model representing the binding scope for
     *   the element.
     */
    modelForElement(el) {
      return templatizer.modelForElement(this.template, el);
    }

  }

  customElements.define('dom-repeat', DomRepeat);

  Polymer.DomRepeat = DomRepeat;

})();
(function() {

  var templatizer = new Polymer.Templatizer();

  /**
   * Stamps the template iff the `if` property is truthy.
   *
   * When `if` becomes falsey, the stamped content is hidden but not
   * removed from dom. When `if` subsequently becomes truthy again, the content
   * is simply re-shown. This approach is used due to its favorable performance
   * characteristics: the expense of creating template content is paid only
   * once and lazily.
   *
   * Set the `restamp` property to true to force the stamped content to be
   * created / destroyed when the `if` condition changes.
   */
  class DomIf extends Polymer.Element {

    static get template() { return null; }

    static get config() { 

      return {

        /**
         * Fired whenever DOM is added or removed/hidden by this template (by
         * default, rendering occurs lazily).  To force immediate rendering, call
         * `render`.
         *
         * @event dom-change
         */

        properties: {

          /**
           * A boolean indicating whether this template should stamp.
           */
          'if': {
            type: Boolean,
            observer: '_debounceRender'
          },

          /**
           * When true, elements will be removed from DOM and discarded when `if`
           * becomes false and re-created and added back to the DOM when `if`
           * becomes true.  By default, stamped elements will be hidden but left
           * in the DOM when `if` becomes false, which is generally results
           * in better performance.
           */
          restamp: {
            type: Boolean,
            observer: '_debounceRender'
          }

        }

      };

    }

    constructor() {
      super();
      this._renderDebouncer = null;
    }

    _debounceRender() {
      this._renderDebouncer =
        Polymer.Debouncer.debounce(this._renderDebouncer, this._render, null, this);
      Polymer.Templatizer.enqueueDebouncer(this._renderDebouncer);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (!this.parentNode ||
          (this.parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE &&
           !this.parentNode.host)) {
        this._teardownInstance();
      }
    }

    connectedCallback() {
      super.connectedCallback();
      if (this.if) {
        this._debounceRender();
      }
    }

    /**
     * Forces the element to render its content. Normally rendering is
     * asynchronous to a provoking change. This is done for efficiency so
     * that multiple changes trigger only a single render. The render method
     * should be called if, for example, template rendering is required to
     * validate application state.
     */
    render() {
      Polymer.Templatizer.flush();
    }

    _render() {
      if (this.if) {
        this._ensureInstance();
        this._showHideChildren();
      } else if (this.restamp) {
        this._teardownInstance();
      }
      if (!this.restamp && this._instance) {
        this._showHideChildren();
      }
      if (this.if != this._lastIf) {
        this.dispatchEvent(new CustomEvent('dom-change', {bubbles: true}));
        this._lastIf = this.if;
      }
    }

    _ensureInstance() {
      var parentNode = this.parentNode;
      // Guard against element being detached while render was queued
      if (parentNode) {
        if (!this._ctor) {
          var template = this.querySelector('template');
          template.__domIf = this;
          if (!template) {
            throw new Error('dom-if requires a <template> child');
          }
          this._ctor = templatizer.templatize(template, {
            fwdHostPropToInstance: function(host, prop, value) {
              let domif = template.__domIf;
              if (domif._instance) {
                domif._instance.forwardProperty(prop, value, host);
              }
            }
          });
        }
        if (!this._instance) {
          this._instance = new this._ctor(this);
          var root = this._instance.root;
          parentNode.insertBefore(root, this);
        } else {
          var c$ = this._instance.children;
          if (c$ && c$.length) {
            // Detect case where dom-if was re-attached in new position
            var lastChild = this.previousSibling;
            if (lastChild !== c$[c$.length-1]) {
              for (var i=0, n; (i<c$.length) && (n=c$[i]); i++) {
                parentNode.insertBefore(n, this);
              }
            }
          }
        }
      }
    }

    _teardownInstance() {
      if (this._instance) {
        var c$ = this._instance.children;
        if (c$ && c$.length) {
          // use first child parent, for case when dom-if may have been detached
          var parent = c$[0].parentNode;
          for (var i=0, n; (i<c$.length) && (n=c$[i]); i++) {
            parent.removeChild(n);
          }
        }
        this._instance = null;
      }
    }

    _showHideChildren() {
      var hidden = this.__hideTemplateChildren__ || !this.if;
      if (this._instance) {
        this._instance._showHideChildren(hidden);
      }
    }

  }

  customElements.define('dom-if', DomIf);

  Polymer.DomIf = DomIf;

})();
(function() {
  'use strict';
  // NOTE: CustomStyle must be loaded prior to loading Polymer.
  // To support asynchronous loading of custom-style, an async import
  // can be made that loads custom-style and then polymer.
  if (window.CustomStyle) {
    var attr = 'include';
    window.CustomStyle.processHook = function(style) {
      var include = style.getAttribute(attr);
      if (!include) {
        return;
      }
      style.removeAttribute(attr);
      style.textContent = Polymer.StyleGather.cssFromModules(include) + style.textContent;
    };
  }

})();
class TodoItem extends Polymer.Element {
        static get is() { return 'todo-item';}

        static get config() {
            return {
                properties: {
                    todo: {
                        type: Object,
                    }
                }
            }
        }
    }
    customElements.define(TodoItem.is, TodoItem);
class TodoList extends Polymer.Element {
        static get is() { return 'todo-list';}

        static get config() {
            return {
                properties: {
                    todoList: {
                        type: Object,
                    }
                }
            }
        }

        _getArchiveText(archived) {
            if(archived) {
                return "Unarchive";
            }
            return "Archive";
        }

        _toggleArchived() {
            this.set("todoList.archived", !this.todoList.archived);
            this._fireDirty(this.todoList);
        }

        _delete() {
            this._fireDelete(this.todoList.id);
        }

        _fireDelete(id) {
            this.dispatchEvent(new CustomEvent("todo-list-delete", {detail: id}));
        }

        _fireDirty(todoList) {
            this.dispatchEvent(new CustomEvent("todo-list-dirty", {detail: todoList}));
        }

    }
    customElements.define(TodoList.is, TodoList);
class TodoItemInput extends Polymer.Element {
            static get is() { return 'todo-item-input';}

            static get config() {
                return {
                    properties: {
                        todo: {
                            type: Object,
                            value: function() {
                                return {
                                    done: false
                                };
                            }
                        }
                    }
                }
            }

            _marshallTodo() {
                this.dispatchEvent(new CustomEvent("todo-item", {detail: new TodoItemModel(this.todo.content, this.todo.done)}));
            }
        }
        customElements.define(TodoItemInput.is, TodoItemInput);
class TodoListInput extends Polymer.Element {
            static get is() { return 'todo-list-input';}

            static get config() {
                return {
                    properties: {
                        todoList: {
                            type: Object,
                            value: function() {
                                return new TodoListModel();
                            }
                        }
                    }
                }
            }

            _addTodo(e) {
                this.todoList.add(e.detail);
                this.set("todoList", this.todoList);
                this.$.todoInput.todo = new TodoItemModel();
            }

            _saveTodoList() {
                this.dispatchEvent(new CustomEvent("todo-list", {detail: this.todoList}));
            }
            _resetTodoList() {
                this.todoList = new TodoListModel();
            }
        }
        customElements.define(TodoListInput.is, TodoListInput);
class TodoApp extends Polymer.Element {
            static get is() { return 'todo-app';}

            static get config() {
                return {
                    properties: {
                        todoLists: {
                            type: Array
                        }
                    }
                };
            }

            _saveNewTodoList(e) {
                let todoList = e.detail;
                let message = {
                    command: "save",
                    data: [todoList.toJSON()]
                };
                MyWebSocket.onNext(JSON.stringify(message));
                this.saveTodoLists(todoList);
            }

            _publishAll() {
                let message = {
                    command: "save",
                    data: this.todoLists
                };
                MyWebSocket.onNext(JSON.stringify(message));
            }

            _fetchAll() {
                let message = {
                    command: "fetch",
                };
                MyWebSocket.onNext(JSON.stringify(message));
            }

            saveTodoLists(...todoList) {
                this.service.saveTodoLists(...todoList).then(() => {
                    this.$.todoListInput.todoList = new TodoListModel();
                    this._getAllTodos();
                });
            }

            _updateTodoList(e) {
                let todoList = e.detail;
                this.service.updateTodoLists(todoList).then(() => {
                    console.log("Success!");
                },() => {
                    console.log("Failure!");
                });
            }

            _deleteTodoList(e) {
                this.service.deleteTodoList(e.model.item.id).then(() => {
                    this._getAllTodos();
                });
            }

            _getAllTodos() {
                this.service.getAllTodoLists().then(todoLists => {
                    this.todoLists = todoLists;
                });
            }

            constructor() {
                super();
                this.service = new TodoListService("todolist");
                this._getAllTodos();
                observable.subscribe(e => {
                    let message = JSON.parse(e.data);
                    if(message.command == "save") {
                        let todoLists = message.data.filter(t1 => {
                             return !this.todoLists.some(t2 => {
                                 return t1.id == t2.id;
                             });
                        })
                        this.push("todoLists", ...todoLists);
                    }
                });
            }

            connectedCallback() {
                super.connectedCallback();
            }

            disconnectedCallback() {
                super.disconnectedCallback();
            }
        }
        customElements.define(TodoApp.is, TodoApp);