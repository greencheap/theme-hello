/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./app/components/theme/node-hero.vue");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./app/components/theme/node-hero.vue":
/*!********************************************!*\
  !*** ./app/components/theme/node-hero.vue ***!
  \********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _node_hero_vue_vue_type_template_id_6c375ee2___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node-hero.vue?vue&type=template&id=6c375ee2& */ \"./app/components/theme/node-hero.vue?vue&type=template&id=6c375ee2&\");\n/* harmony import */ var _node_hero_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node-hero.vue?vue&type=script&lang=js& */ \"./app/components/theme/node-hero.vue?vue&type=script&lang=js&\");\n/* empty/unused harmony star reexport *//* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ \"./node_modules/vue-loader/lib/runtime/componentNormalizer.js\");\n\n\n\n\n\n/* normalize component */\n\nvar component = Object(_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"])(\n  _node_hero_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_1__[\"default\"],\n  _node_hero_vue_vue_type_template_id_6c375ee2___WEBPACK_IMPORTED_MODULE_0__[\"render\"],\n  _node_hero_vue_vue_type_template_id_6c375ee2___WEBPACK_IMPORTED_MODULE_0__[\"staticRenderFns\"],\n  false,\n  null,\n  null,\n  null\n  \n)\n\n/* hot reload */\nif (false) { var api; }\ncomponent.options.__file = \"app/components/theme/node-hero.vue\"\n/* harmony default export */ __webpack_exports__[\"default\"] = (component.exports);\n\n//# sourceURL=webpack:///./app/components/theme/node-hero.vue?");

/***/ }),

/***/ "./app/components/theme/node-hero.vue?vue&type=script&lang=js&":
/*!*********************************************************************!*\
  !*** ./app/components/theme/node-hero.vue?vue&type=script&lang=js& ***!
  \*********************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _node_modules_babel_loader_lib_index_js_node_modules_vue_loader_lib_index_js_vue_loader_options_node_hero_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../node_modules/babel-loader/lib!../../../node_modules/vue-loader/lib??vue-loader-options!./node-hero.vue?vue&type=script&lang=js& */ \"./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js?!./app/components/theme/node-hero.vue?vue&type=script&lang=js&\");\n/* empty/unused harmony star reexport */ /* harmony default export */ __webpack_exports__[\"default\"] = (_node_modules_babel_loader_lib_index_js_node_modules_vue_loader_lib_index_js_vue_loader_options_node_hero_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__[\"default\"]); \n\n//# sourceURL=webpack:///./app/components/theme/node-hero.vue?");

/***/ }),

/***/ "./app/components/theme/node-hero.vue?vue&type=template&id=6c375ee2&":
/*!***************************************************************************!*\
  !*** ./app/components/theme/node-hero.vue?vue&type=template&id=6c375ee2& ***!
  \***************************************************************************/
/*! exports provided: render, staticRenderFns */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_node_hero_vue_vue_type_template_id_6c375ee2___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../node_modules/vue-loader/lib??vue-loader-options!./node-hero.vue?vue&type=template&id=6c375ee2& */ \"./node_modules/vue-loader/lib/loaders/templateLoader.js?!./node_modules/vue-loader/lib/index.js?!./app/components/theme/node-hero.vue?vue&type=template&id=6c375ee2&\");\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, \"render\", function() { return _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_node_hero_vue_vue_type_template_id_6c375ee2___WEBPACK_IMPORTED_MODULE_0__[\"render\"]; });\n\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, \"staticRenderFns\", function() { return _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_node_hero_vue_vue_type_template_id_6c375ee2___WEBPACK_IMPORTED_MODULE_0__[\"staticRenderFns\"]; });\n\n\n\n//# sourceURL=webpack:///./app/components/theme/node-hero.vue?");

/***/ }),

/***/ "./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js?!./app/components/theme/node-hero.vue?vue&type=script&lang=js&":
/*!*******************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib??vue-loader-options!./app/components/theme/node-hero.vue?vue&type=script&lang=js& ***!
  \*******************************************************************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\n//\nlet settings = {\n  section: {\n    label: 'Content'\n  },\n  inject: ['$components'],\n  props: ['node', 'roles', 'form'],\n\n  data() {\n    return {\n      page: {\n        data: {\n          title: true\n        }\n      }\n    };\n  },\n\n  created() {\n    _.extend(this.$options.components, this.$components);\n  },\n\n  mounted() {\n    if (!this.node.id) this.node.status = 1;\n  },\n\n  events: {\n    'save:node': function (event, data) {\n      data.page = this.page;\n\n      if (!this.node.title) {\n        this.node.title = this.page.title;\n      }\n    }\n  },\n  watch: {\n    'node.data.defaults.id': {\n      handler(id) {\n        if (id) {\n          this.$http.get('api/site/page{/id}', {\n            params: {\n              id\n            }\n          }).then(function (res) {\n            this.$set(this, 'page', res.data);\n          });\n        }\n      },\n\n      immediate: true\n    }\n  }\n};\n/* harmony default export */ __webpack_exports__[\"default\"] = (settings);\nwindow.Site.components['page.settings'] = settings;\n\n//# sourceURL=webpack:///./app/components/theme/node-hero.vue?./node_modules/babel-loader/lib!./node_modules/vue-loader/lib??vue-loader-options");

/***/ }),

/***/ "./node_modules/vue-loader/lib/loaders/templateLoader.js?!./node_modules/vue-loader/lib/index.js?!./app/components/theme/node-hero.vue?vue&type=template&id=6c375ee2&":
/*!*********************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib??vue-loader-options!./app/components/theme/node-hero.vue?vue&type=template&id=6c375ee2& ***!
  \*********************************************************************************************************************************************************************************************************/
/*! exports provided: render, staticRenderFns */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"render\", function() { return render; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"staticRenderFns\", function() { return staticRenderFns; });\nvar render = function() {\n  var _vm = this\n  var _h = _vm.$createElement\n  var _c = _vm._self._c || _h\n  return _c(\n    \"div\",\n    {\n      staticClass: \"pk-grid-large pk-width-sidebar-large uk-form-stacked\",\n      attrs: { \"uk-grid\": \"\" }\n    },\n    [\n      _c(\"div\", { staticClass: \"pk-width-content\" }, [\n        _c(\n          \"div\",\n          { staticClass: \"uk-margin\" },\n          [\n            _c(\"label\", { staticClass: \"uk-form-label\" }, [\n              _vm._v(_vm._s(_vm._f(\"trans\")(\"Title\")))\n            ]),\n            _vm._v(\" \"),\n            _c(\"v-input\", {\n              attrs: {\n                name: \"page[title]\",\n                type: \"text\",\n                rules: \"required\",\n                view: \"class: uk-input uk-form-large\",\n                placeholder: \"Enter Title\",\n                message: \"Title cannot be blank.\"\n              },\n              model: {\n                value: _vm.page.title,\n                callback: function($$v) {\n                  _vm.$set(_vm.page, \"title\", $$v)\n                },\n                expression: \"page.title\"\n              }\n            })\n          ],\n          1\n        ),\n        _vm._v(\" \"),\n        _c(\n          \"div\",\n          { staticClass: \"uk-margin\" },\n          [\n            _c(\"label\", { staticClass: \"uk-form-label\" }, [\n              _vm._v(_vm._s(_vm._f(\"trans\")(\"Content\")))\n            ]),\n            _vm._v(\" \"),\n            _c(\"v-editor\", {\n              attrs: { options: { markdown: _vm.page.data.markdown } },\n              model: {\n                value: _vm.page.content,\n                callback: function($$v) {\n                  _vm.$set(_vm.page, \"content\", $$v)\n                },\n                expression: \"page.content\"\n              }\n            }),\n            _vm._v(\" \"),\n            _c(\"div\", { staticClass: \"uk-margin-small-top\" }, [\n              _c(\"label\", [\n                _c(\"input\", {\n                  directives: [\n                    {\n                      name: \"model\",\n                      rawName: \"v-model\",\n                      value: _vm.page.data.markdown,\n                      expression: \"page.data.markdown\"\n                    }\n                  ],\n                  staticClass: \"uk-checkbox\",\n                  attrs: { type: \"checkbox\" },\n                  domProps: {\n                    checked: Array.isArray(_vm.page.data.markdown)\n                      ? _vm._i(_vm.page.data.markdown, null) > -1\n                      : _vm.page.data.markdown\n                  },\n                  on: {\n                    change: function($event) {\n                      var $$a = _vm.page.data.markdown,\n                        $$el = $event.target,\n                        $$c = $$el.checked ? true : false\n                      if (Array.isArray($$a)) {\n                        var $$v = null,\n                          $$i = _vm._i($$a, $$v)\n                        if ($$el.checked) {\n                          $$i < 0 &&\n                            _vm.$set(\n                              _vm.page.data,\n                              \"markdown\",\n                              $$a.concat([$$v])\n                            )\n                        } else {\n                          $$i > -1 &&\n                            _vm.$set(\n                              _vm.page.data,\n                              \"markdown\",\n                              $$a.slice(0, $$i).concat($$a.slice($$i + 1))\n                            )\n                        }\n                      } else {\n                        _vm.$set(_vm.page.data, \"markdown\", $$c)\n                      }\n                    }\n                  }\n                }),\n                _vm._v(\" \"),\n                _c(\"span\", { staticClass: \"uk-margin-small-left\" }, [\n                  _vm._v(_vm._s(_vm._f(\"trans\")(\"Enable Markdown\")))\n                ])\n              ])\n            ])\n          ],\n          1\n        )\n      ]),\n      _vm._v(\" \"),\n      _c(\"div\", { staticClass: \"pk-width-sidebar\" }, [\n        _c(\"div\", { staticClass: \"uk-panel\" }, [\n          _c(\"div\", { staticClass: \"uk-margin\" }, [\n            _c(\n              \"label\",\n              {\n                staticClass: \"uk-form-label\",\n                attrs: { for: \"form-menu-title\" }\n              },\n              [_vm._v(_vm._s(_vm._f(\"trans\")(\"Menu Title\")))]\n            ),\n            _vm._v(\" \"),\n            _c(\"div\", { staticClass: \"uk-form-controls\" }, [\n              _c(\"input\", {\n                directives: [\n                  {\n                    name: \"model\",\n                    rawName: \"v-model\",\n                    value: _vm.node.title,\n                    expression: \"node.title\"\n                  }\n                ],\n                staticClass: \"uk-form-width-large uk-input\",\n                attrs: { id: \"form-menu-title\", type: \"text\", name: \"title\" },\n                domProps: { value: _vm.node.title },\n                on: {\n                  input: function($event) {\n                    if ($event.target.composing) {\n                      return\n                    }\n                    _vm.$set(_vm.node, \"title\", $event.target.value)\n                  }\n                }\n              })\n            ])\n          ]),\n          _vm._v(\" \"),\n          _c(\"div\", { staticClass: \"uk-margin\" }, [\n            _c(\n              \"label\",\n              { staticClass: \"uk-form-label\", attrs: { for: \"form-slug\" } },\n              [_vm._v(_vm._s(_vm._f(\"trans\")(\"Slug\")))]\n            ),\n            _vm._v(\" \"),\n            _c(\"div\", { staticClass: \"uk-form-controls\" }, [\n              _c(\"input\", {\n                directives: [\n                  {\n                    name: \"model\",\n                    rawName: \"v-model\",\n                    value: _vm.node.slug,\n                    expression: \"node.slug\"\n                  }\n                ],\n                staticClass: \"uk-form-width-large uk-input\",\n                attrs: { id: \"form-slug\", type: \"text\" },\n                domProps: { value: _vm.node.slug },\n                on: {\n                  input: function($event) {\n                    if ($event.target.composing) {\n                      return\n                    }\n                    _vm.$set(_vm.node, \"slug\", $event.target.value)\n                  }\n                }\n              })\n            ])\n          ]),\n          _vm._v(\" \"),\n          _c(\"div\", { staticClass: \"uk-margin\" }, [\n            _c(\n              \"label\",\n              { staticClass: \"uk-form-label\", attrs: { for: \"form-status\" } },\n              [_vm._v(_vm._s(_vm._f(\"trans\")(\"Status\")))]\n            ),\n            _vm._v(\" \"),\n            _c(\"div\", { staticClass: \"uk-form-controls\" }, [\n              _c(\n                \"select\",\n                {\n                  directives: [\n                    {\n                      name: \"model\",\n                      rawName: \"v-model\",\n                      value: _vm.node.status,\n                      expression: \"node.status\"\n                    }\n                  ],\n                  staticClass: \"uk-form-width-large uk-select\",\n                  attrs: { id: \"form-status\" },\n                  on: {\n                    change: function($event) {\n                      var $$selectedVal = Array.prototype.filter\n                        .call($event.target.options, function(o) {\n                          return o.selected\n                        })\n                        .map(function(o) {\n                          var val = \"_value\" in o ? o._value : o.value\n                          return val\n                        })\n                      _vm.$set(\n                        _vm.node,\n                        \"status\",\n                        $event.target.multiple\n                          ? $$selectedVal\n                          : $$selectedVal[0]\n                      )\n                    }\n                  }\n                },\n                [\n                  _c(\"option\", { attrs: { value: \"0\" } }, [\n                    _vm._v(\n                      \"\\n                            \" +\n                        _vm._s(_vm._f(\"trans\")(\"Disabled\")) +\n                        \"\\n                        \"\n                    )\n                  ]),\n                  _vm._v(\" \"),\n                  _c(\"option\", { attrs: { value: \"1\" } }, [\n                    _vm._v(\n                      \"\\n                            \" +\n                        _vm._s(_vm._f(\"trans\")(\"Enabled\")) +\n                        \"\\n                        \"\n                    )\n                  ])\n                ]\n              )\n            ])\n          ]),\n          _vm._v(\" \"),\n          _c(\"div\", { staticClass: \"uk-margin\" }, [\n            _c(\"label\", { staticClass: \"uk-form-label\" }, [\n              _vm._v(_vm._s(_vm._f(\"trans\")(\"Restrict Access\")))\n            ]),\n            _vm._v(\" \"),\n            _c(\n              \"div\",\n              { staticClass: \"uk-form-controls uk-form-controls-text\" },\n              _vm._l(_vm.roles, function(role) {\n                return _c(\n                  \"div\",\n                  { key: role.id, staticClass: \"uk-margin-small\" },\n                  [\n                    _c(\"label\", [\n                      _c(\"input\", {\n                        directives: [\n                          {\n                            name: \"model\",\n                            rawName: \"v-model.number\",\n                            value: _vm.node.roles,\n                            expression: \"node.roles\",\n                            modifiers: { number: true }\n                          }\n                        ],\n                        staticClass: \"uk-checkbox\",\n                        attrs: { type: \"checkbox\" },\n                        domProps: {\n                          value: role.id,\n                          checked: Array.isArray(_vm.node.roles)\n                            ? _vm._i(_vm.node.roles, role.id) > -1\n                            : _vm.node.roles\n                        },\n                        on: {\n                          change: function($event) {\n                            var $$a = _vm.node.roles,\n                              $$el = $event.target,\n                              $$c = $$el.checked ? true : false\n                            if (Array.isArray($$a)) {\n                              var $$v = _vm._n(role.id),\n                                $$i = _vm._i($$a, $$v)\n                              if ($$el.checked) {\n                                $$i < 0 &&\n                                  _vm.$set(_vm.node, \"roles\", $$a.concat([$$v]))\n                              } else {\n                                $$i > -1 &&\n                                  _vm.$set(\n                                    _vm.node,\n                                    \"roles\",\n                                    $$a.slice(0, $$i).concat($$a.slice($$i + 1))\n                                  )\n                              }\n                            } else {\n                              _vm.$set(_vm.node, \"roles\", $$c)\n                            }\n                          }\n                        }\n                      }),\n                      _vm._v(\" \"),\n                      _c(\"span\", { staticClass: \"uk-margin-small-left\" }, [\n                        _vm._v(_vm._s(role.name))\n                      ])\n                    ])\n                  ]\n                )\n              }),\n              0\n            )\n          ]),\n          _vm._v(\" \"),\n          _c(\"div\", { staticClass: \"uk-margin\" }, [\n            _c(\"label\", { staticClass: \"uk-form-label\" }, [\n              _vm._v(_vm._s(_vm._f(\"trans\")(\"Menu\")))\n            ]),\n            _vm._v(\" \"),\n            _c(\n              \"div\",\n              { staticClass: \"uk-form-controls uk-form-controls-text\" },\n              [\n                _c(\"label\", [\n                  _c(\"input\", {\n                    directives: [\n                      {\n                        name: \"model\",\n                        rawName: \"v-model\",\n                        value: _vm.node.data.menu_hide,\n                        expression: \"node.data.menu_hide\"\n                      }\n                    ],\n                    staticClass: \"uk-checkbox\",\n                    attrs: { type: \"checkbox\", value: \"center-content\" },\n                    domProps: {\n                      checked: Array.isArray(_vm.node.data.menu_hide)\n                        ? _vm._i(_vm.node.data.menu_hide, \"center-content\") > -1\n                        : _vm.node.data.menu_hide\n                    },\n                    on: {\n                      change: function($event) {\n                        var $$a = _vm.node.data.menu_hide,\n                          $$el = $event.target,\n                          $$c = $$el.checked ? true : false\n                        if (Array.isArray($$a)) {\n                          var $$v = \"center-content\",\n                            $$i = _vm._i($$a, $$v)\n                          if ($$el.checked) {\n                            $$i < 0 &&\n                              _vm.$set(\n                                _vm.node.data,\n                                \"menu_hide\",\n                                $$a.concat([$$v])\n                              )\n                          } else {\n                            $$i > -1 &&\n                              _vm.$set(\n                                _vm.node.data,\n                                \"menu_hide\",\n                                $$a.slice(0, $$i).concat($$a.slice($$i + 1))\n                              )\n                          }\n                        } else {\n                          _vm.$set(_vm.node.data, \"menu_hide\", $$c)\n                        }\n                      }\n                    }\n                  }),\n                  _vm._v(\" \"),\n                  _c(\"span\", { staticClass: \"uk-margin-small-left\" }, [\n                    _vm._v(_vm._s(_vm._f(\"trans\")(\"Hide in menu\")))\n                  ])\n                ])\n              ]\n            )\n          ])\n        ])\n      ])\n    ]\n  )\n}\nvar staticRenderFns = []\nrender._withStripped = true\n\n\n\n//# sourceURL=webpack:///./app/components/theme/node-hero.vue?./node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/vue-loader/lib??vue-loader-options");

/***/ }),

/***/ "./node_modules/vue-loader/lib/runtime/componentNormalizer.js":
/*!********************************************************************!*\
  !*** ./node_modules/vue-loader/lib/runtime/componentNormalizer.js ***!
  \********************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return normalizeComponent; });\n/* globals __VUE_SSR_CONTEXT__ */\n\n// IMPORTANT: Do NOT use ES2015 features in this file (except for modules).\n// This module is a runtime utility for cleaner component module output and will\n// be included in the final webpack user bundle.\n\nfunction normalizeComponent (\n  scriptExports,\n  render,\n  staticRenderFns,\n  functionalTemplate,\n  injectStyles,\n  scopeId,\n  moduleIdentifier, /* server only */\n  shadowMode /* vue-cli only */\n) {\n  // Vue.extend constructor export interop\n  var options = typeof scriptExports === 'function'\n    ? scriptExports.options\n    : scriptExports\n\n  // render functions\n  if (render) {\n    options.render = render\n    options.staticRenderFns = staticRenderFns\n    options._compiled = true\n  }\n\n  // functional template\n  if (functionalTemplate) {\n    options.functional = true\n  }\n\n  // scopedId\n  if (scopeId) {\n    options._scopeId = 'data-v-' + scopeId\n  }\n\n  var hook\n  if (moduleIdentifier) { // server build\n    hook = function (context) {\n      // 2.3 injection\n      context =\n        context || // cached call\n        (this.$vnode && this.$vnode.ssrContext) || // stateful\n        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional\n      // 2.2 with runInNewContext: true\n      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {\n        context = __VUE_SSR_CONTEXT__\n      }\n      // inject component styles\n      if (injectStyles) {\n        injectStyles.call(this, context)\n      }\n      // register component module identifier for async chunk inferrence\n      if (context && context._registeredComponents) {\n        context._registeredComponents.add(moduleIdentifier)\n      }\n    }\n    // used by ssr in case component is cached and beforeCreate\n    // never gets called\n    options._ssrRegister = hook\n  } else if (injectStyles) {\n    hook = shadowMode\n      ? function () { injectStyles.call(this, this.$root.$options.shadowRoot) }\n      : injectStyles\n  }\n\n  if (hook) {\n    if (options.functional) {\n      // for template-only hot-reload because in that case the render fn doesn't\n      // go through the normalizer\n      options._injectStyles = hook\n      // register for functional component in vue file\n      var originalRender = options.render\n      options.render = function renderWithStyleInjection (h, context) {\n        hook.call(context)\n        return originalRender(h, context)\n      }\n    } else {\n      // inject component registration as beforeCreate hook\n      var existing = options.beforeCreate\n      options.beforeCreate = existing\n        ? [].concat(existing, hook)\n        : [hook]\n    }\n  }\n\n  return {\n    exports: scriptExports,\n    options: options\n  }\n}\n\n\n//# sourceURL=webpack:///./node_modules/vue-loader/lib/runtime/componentNormalizer.js?");

/***/ })

/******/ });