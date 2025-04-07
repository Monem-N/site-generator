"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentGenerator = void 0;
// Core component generator
var ComponentGenerator = /** @class */ (function () {
    function ComponentGenerator(designSystem) {
        this.designSystem = designSystem;
        this.templateRegistry = new Map();
        this.registerDefaultTemplates();
    }
    ComponentGenerator.prototype.registerDefaultTemplates = function () {
        // Register built-in component templates
        this.registerTemplate('section', new SectionTemplate());
        this.registerTemplate('code-block', new CodeBlockTemplate());
        this.registerTemplate('api-endpoint', new APIEndpointTemplate());
        this.registerTemplate('table', new TableTemplate());
        this.registerTemplate('navigation', new NavigationTemplate());
    };
    ComponentGenerator.prototype.registerTemplate = function (type, template) {
        this.templateRegistry.set(type, template);
    };
    ComponentGenerator.prototype.generateComponent = function (contentElement) {
        return __awaiter(this, void 0, void 0, function () {
            var elementType, template, componentCode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('contentElement:', contentElement);
                        elementType = contentElement.type;
                        template = this.templateRegistry.get(elementType);
                        if (!template) {
                            throw new Error("No template registered for element type: ".concat(elementType));
                        }
                        return [4 /*yield*/, template.generate(contentElement, this.designSystem)];
                    case 1:
                        componentCode = _a.sent();
                        return [2 /*return*/, this.applyDesignSystem(componentCode, elementType)];
                }
            });
        });
    };
    ComponentGenerator.prototype.applyDesignSystem = function (componentCode, elementType) {
        var _a, _b;
        // Apply design system styling and components
        if (!this.designSystem)
            return componentCode;
        var dsConfig = (_b = (_a = this.designSystem).getConfigForType) === null || _b === void 0 ? void 0 : _b.call(_a, elementType);
        // Replace placeholder classes with design system classes
        var styledCode = componentCode;
        for (var _i = 0, _c = Object.entries((dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) || {}); _i < _c.length; _i++) {
            var _d = _c[_i], placeholder = _d[0], actualClass = _d[1];
            styledCode = styledCode.replace(new RegExp("{".concat(placeholder, "}"), 'g'), actualClass);
        }
        // Add design system imports if needed
        var imports = this.generateImports((dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.components) || []);
        return "".concat(imports, "\n\n").concat(styledCode);
    };
    ComponentGenerator.prototype.generateImports = function (components) {
        if (components.length === 0)
            return '';
        var importSource = this.designSystem.importPath;
        return "import { ".concat(components.join(', '), " } from '").concat(importSource, "';");
    };
    ComponentGenerator.prototype.generatePage = function (contentModel) {
        return __awaiter(this, void 0, void 0, function () {
            var components, _i, _a, element, component;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        components = [];
                        // Generate individual components
                        if (!(contentModel === null || contentModel === void 0 ? void 0 : contentModel.elements))
                            return [2 /*return*/, ''];
                        _i = 0, _a = contentModel.elements;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        element = _a[_i];
                        return [4 /*yield*/, this.generateComponent(element)];
                    case 2:
                        component = _b.sent();
                        components.push(component);
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: 
                    // Combine into page component
                    return [2 /*return*/, this.assemblePage(components, contentModel.metadata)];
                }
            });
        });
    };
    ComponentGenerator.prototype.assemblePage = function (components, metadata) {
        var _a, _b;
        console.log('metadata:', metadata);
        var pageTitle = metadata.title || 'Generated Page';
        var imports = this.generatePageImports();
        return "\n".concat(imports, "\n\nexport default function ").concat(this.sanitizeComponentName(pageTitle), "() {\n  return (\n    <div className={").concat(((_b = (_a = this.designSystem) === null || _a === void 0 ? void 0 : _a.classNames) === null || _b === void 0 ? void 0 : _b.pageContainer) || '', "}>\n      ").concat(components.join('\n      '), "\n    </div>\n  );\n}\n");
    };
    ComponentGenerator.prototype.generatePageImports = function () {
        var _a, _b;
        if (!this.designSystem)
            return '';
        var baseImports = "import React from 'react';";
        var dsImports = "import { ".concat((_b = (_a = this.designSystem) === null || _a === void 0 ? void 0 : _a.pageComponents) === null || _b === void 0 ? void 0 : _b.join(', '), " } from '").concat(this.designSystem.importPath, "';");
        return "".concat(baseImports, "\n").concat(dsImports);
    };
    ComponentGenerator.prototype.sanitizeComponentName = function (name) {
        // Convert page title to valid component name
        return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]/, 'Page');
    };
    return ComponentGenerator;
}());
exports.ComponentGenerator = ComponentGenerator;
// Template implementations
var SectionTemplate = /** @class */ (function () {
    function SectionTemplate() {
    }
    SectionTemplate.prototype.generate = function (element, designSystem) {
        return __awaiter(this, void 0, void 0, function () {
            var title, level, content, HeadingTag;
            return __generator(this, function (_a) {
                title = element.title, level = element.level, content = element.content;
                HeadingTag = "h".concat(level);
                return [2 /*return*/, "\n<section className=\"{section-container}\">\n  <".concat(HeadingTag, " className=\"{heading-").concat(level, "}\">").concat(title, "</").concat(HeadingTag, ">\n  <div className=\"{content-container}\">\n    ").concat(this.renderContent(content, designSystem), "\n  </div>\n</section>\n")];
            });
        });
    };
    SectionTemplate.prototype.renderContent = function (content, designSystem) {
        // Implementation would render different content types
        return content
            .map(function (item) {
            if (item.type === 'paragraph') {
                return "<p className=\"{paragraph}\">".concat(item.content.join(' '), "</p>");
            }
            // Handle other content types
            return '';
        })
            .join('\n    ');
    };
    return SectionTemplate;
}());
var CodeBlockTemplate = /** @class */ (function () {
    function CodeBlockTemplate() {
    }
    CodeBlockTemplate.prototype.generate = function (element, designSystem) {
        return __awaiter(this, void 0, void 0, function () {
            var language, content;
            return __generator(this, function (_a) {
                language = element.language, content = element.content;
                return [2 /*return*/, "\n<div className=\"{code-block-container}\">\n  <div className=\"{code-block-header}\">\n    <span className=\"{code-language-badge}\">".concat(language, "</span>\n  </div>\n  <pre className=\"{code-pre}\">\n    <code className=\"{code} {code-").concat(language, "}\">\n      ").concat(this.escapeCode(content.join('\n')), "\n    </code>\n  </pre>\n</div>\n")];
            });
        });
    };
    CodeBlockTemplate.prototype.escapeCode = function (code) {
        // Escape HTML special characters
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#039;');
    };
    return CodeBlockTemplate;
}());
var APIEndpointTemplate = /** @class */ (function () {
    function APIEndpointTemplate() {
    }
    APIEndpointTemplate.prototype.generate = function (element, designSystem) {
        return __awaiter(this, void 0, void 0, function () {
            var method, endpoint, parameters, responses;
            return __generator(this, function (_a) {
                method = element.method, endpoint = element.endpoint, parameters = element.parameters, responses = element.responses;
                return [2 /*return*/, "\n<div className=\"{api-endpoint-container}\">\n  <div className=\"{endpoint-header} {method-".concat(method.toLowerCase(), "}\">\n    <span className=\"{http-method}\">").concat(method, "</span>\n    <span className=\"{endpoint-path}\">").concat(endpoint, "</span>\n  </div>\n  <div className=\"{endpoint-body}\">\n    ").concat(this.renderParameters(parameters), "\n    ").concat(this.renderResponses(responses), "\n  </div>\n</div>\n")];
            });
        });
    };
    APIEndpointTemplate.prototype.renderParameters = function (parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }
        return "\n    <div className=\"{parameters-section}\">\n      <h4 className=\"{section-title}\">Parameters</h4>\n      <table className=\"{parameters-table}\">\n        <thead>\n          <tr>\n            <th>Name</th>\n            <th>Type</th>\n            <th>Description</th>\n            <th>Required</th>\n          </tr>\n        </thead>\n        <tbody>\n          ".concat(parameters
            .map(function (param) { return "\n          <tr>\n            <td>".concat(param.name, "</td>\n            <td>").concat(param.type, "</td>\n            <td>").concat(param.description, "</td>\n            <td>").concat(param.required ? 'Yes' : 'No', "</td>\n          </tr>\n          "); })
            .join(''), "\n      </table>\n    </div>\n    ");
    };
    APIEndpointTemplate.prototype.renderResponses = function (responses) {
        var _this = this;
        if (!responses || Object.keys(responses).length === 0) {
            return '';
        }
        return "\n    <div className=\"{responses-section}\">\n      <h4 className=\"{section-title}\">Responses</h4>\n      <div className=\"{responses-container}\">\n        ".concat(Object.entries(responses)
            .map(function (_a) {
            var code = _a[0], response = _a[1];
            return "\n        <div className=\"{response-item} {response-".concat(_this.getResponseClass(code), "}\">\n          <div className=\"{response-code}\">").concat(code, "</div>\n          <div className=\"{response-description}\">").concat(response.description, "</div>\n        </div>\n        ");
        })
            .join(''), "\n      </div>\n    </div>\n    ");
    };
    APIEndpointTemplate.prototype.getResponseClass = function (code) {
        var codeNum = parseInt(code, 10);
        if (codeNum < 300)
            return 'success';
        if (codeNum < 400)
            return 'redirect';
        if (codeNum < 500)
            return 'client-error';
        return 'server-error';
    };
    return APIEndpointTemplate;
}());
var TableTemplate = /** @class */ (function () {
    function TableTemplate() {
    }
    TableTemplate.prototype.generate = function (element, designSystem) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, rows;
            return __generator(this, function (_a) {
                headers = element.headers, rows = element.rows;
                return [2 /*return*/, "\n<div className=\"{table-container}\">\n  <table className=\"{table}\">\n    <thead>\n      <tr>\n        ".concat(headers
                        .map(function (header) { return "<th className=\"{table-header}\">".concat(header, "</th>"); })
                        .join('\n        '), "\n      </tr>\n    </thead>\n    <tbody>\n      ").concat(rows
                        .map(function (row) { return "\n      <tr className=\"{table-row}\">\n        ".concat(row.map(function (cell) { return "<td className=\"{table-cell}\">".concat(cell, "</td>"); }).join('\n        '), "\n      </tr>\n      "); })
                        .join('\n      '), "\n    </tbody>\n  </table>\n</div>\n")];
            });
        });
    };
    return TableTemplate;
}());
var NavigationTemplate = /** @class */ (function () {
    function NavigationTemplate() {
    }
    NavigationTemplate.prototype.generate = function (element, designSystem) {
        return __awaiter(this, void 0, void 0, function () {
            var items;
            var _this = this;
            return __generator(this, function (_a) {
                items = element.items;
                return [2 /*return*/, "\n<nav className=\"{navigation-container}\">\n  <ul className=\"{nav-list}\">\n    ".concat(items
                        .map(function (item) { return "\n    <li className=\"{nav-item}\">\n      <a href=\"".concat(item.path, "\" className=\"{nav-link}").concat(item.active ? ' {nav-link-active}' : '', "\">\n        ").concat(item.label, "\n      </a>\n      ").concat(item.children ? _this.renderSubItems(item.children) : '', "\n    </li>\n    "); })
                        .join('\n    '), "\n  </ul>\n</nav>\n")];
            });
        });
    };
    NavigationTemplate.prototype.renderSubItems = function (items) {
        return "\n    <ul className=\"{nav-sublist}\">\n      ".concat(items
            .map(function (item) { return "\n      <li className=\"{nav-subitem}\">\n        <a href=\"".concat(item.path, "\" className=\"{nav-sublink}").concat(item.active ? ' {nav-sublink-active}' : '', "\">\n          ").concat(item.label, "\n        </a>\n      </li>\n      "); })
            .join('\n      '), "\n    </ul>\n    ");
    };
    return NavigationTemplate;
}());
// Test
function testComponentGenerator() {
    return __awaiter(this, void 0, void 0, function () {
        var designSystem, componentGenerator, contentElement, contentModel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    designSystem = {
                        importPath: 'test',
                        classNames: {
                            pageContainer: 'test'
                        }
                    };
                    componentGenerator = new ComponentGenerator(designSystem);
                    contentElement = {
                        type: 'section',
                        title: 'Test Section',
                        level: 1,
                        content: []
                    };
                    return [4 /*yield*/, componentGenerator.generateComponent(contentElement)];
                case 1:
                    _a.sent();
                    contentModel = {
                        elements: [contentElement],
                        metadata: {
                            title: 'Test Page'
                        }
                    };
                    return [4 /*yield*/, componentGenerator.generatePage(contentModel)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
testComponentGenerator();
