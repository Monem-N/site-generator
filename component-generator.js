"use strict";
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentGenerator = void 0;
class ComponentGenerator {
    constructor(designSystem) {
        this.designSystem = designSystem;
        this.templateRegistry = new Map();
        this.registerDefaultTemplates();
    }
    registerDefaultTemplates() {
        // Register built-in component templates
        this.registerTemplate('section', new SectionTemplate());
        this.registerTemplate('code-block', new CodeBlockTemplate());
        this.registerTemplate('api-endpoint', new APIEndpointTemplate());
        this.registerTemplate('table', new TableTemplate());
        this.registerTemplate('navigation', new NavigationTemplate());
    }
    registerTemplate(type, template) {
        this.templateRegistry.set(type, template);
    }
    async generateComponent(contentElement) {
        console.log('contentElement:', contentElement);
        const elementType = contentElement.type;
        const template = this.templateRegistry.get(elementType);
        if (!template) {
            throw new Error(`No template registered for element type: ${elementType}`);
        }
        // Generate component based on content model and design system
        const componentCode = await template.generate(contentElement, this.designSystem);
        return this.applyDesignSystem(componentCode, elementType);
    }
    applyDesignSystem(componentCode, elementType) {
        var _a, _b;
        // Apply design system styling and components
        if (!this.designSystem)
            return componentCode;
        const dsConfig = (_b = (_a = this.designSystem).getConfigForType) === null || _b === void 0 ? void 0 : _b.call(_a, elementType);
        // Replace placeholder classes with design system classes
        let styledCode = componentCode;
        for (const [placeholder, actualClass] of Object.entries((dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) || {})) {
            styledCode = styledCode.replace(new RegExp(`{${placeholder}}`, 'g'), actualClass);
        }
        // Add design system imports if needed
        const imports = this.generateImports((dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.components) || []);
        return `${imports}\n\n${styledCode}`;
    }
    generateImports(components) {
        if (components.length === 0)
            return '';
        const importSource = this.designSystem.importPath;
        return `import { ${components.join(', ')} } from '${importSource}';`;
    }
    async generatePage(contentModel) {
        const components = [];
        // Generate individual components
        if (!(contentModel === null || contentModel === void 0 ? void 0 : contentModel.elements))
            return '';
        for (const element of contentModel.elements) {
            const component = await this.generateComponent(element);
            components.push(component);
        }
        // Combine into page component
        return this.assemblePage(components, contentModel.metadata);
    }
    assemblePage(components, metadata) {
        var _a, _b;
        console.log('metadata:', metadata);
        const pageTitle = metadata.title || 'Generated Page';
        const imports = this.generatePageImports();
        return `
${imports}

export default function ${this.sanitizeComponentName(pageTitle)}() {
  return (
    <div className={${((_b = (_a = this.designSystem) === null || _a === void 0 ? void 0 : _a.classNames) === null || _b === void 0 ? void 0 : _b.pageContainer) || ''}}>
      ${components.join('\n      ')}
    </div>
  );
}
`;
    }
    generatePageImports() {
        var _a, _b;
        if (!this.designSystem)
            return '';
        const baseImports = `import React from 'react';`;
        const dsImports = `import { ${(_b = (_a = this.designSystem) === null || _a === void 0 ? void 0 : _a.pageComponents) === null || _b === void 0 ? void 0 : _b.join(', ')} } from '${this.designSystem.importPath}';`;
        return `${baseImports}\n${dsImports}`;
    }
    sanitizeComponentName(name) {
        // Convert page title to valid component name
        return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]/, 'Page');
    }
}
exports.ComponentGenerator = ComponentGenerator;
class SectionTemplate {
    async generate(element, designSystem) {
        var _a, _b, _c, _d;
        const { title, level, content } = element;
        const dsConfig = (_a = designSystem === null || designSystem === void 0 ? void 0 : designSystem.getConfigForType) === null || _a === void 0 ? void 0 : _a.call(designSystem, 'section');
        // Determine heading level
        const HeadingTag = `h${level}`;
        return `
<section className="${((_b = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _b === void 0 ? void 0 : _b.sectionContainer) || ''}">
  <${HeadingTag} className="${((_c = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _c === void 0 ? void 0 : _c[`heading${level}`]) || ''}">${title}</${HeadingTag}>
  <div className="${((_d = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _d === void 0 ? void 0 : _d.contentContainer) || ''}">
    ${this.renderContent(content, dsConfig)}
  </div>
</section>
`;
    }
    renderContent(content, dsConfig) {
        return content
            .map(item => {
            var _a;
            if (item.type === 'paragraph') {
                return `<p className="${((_a = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _a === void 0 ? void 0 : _a.paragraph) || ''}">${item.content.join(' ')}</p>`;
            }
            // Handle other content types
            return '';
        })
            .join('\n    ');
    }
}
class CodeBlockTemplate {
    async generate(element, designSystem) {
        const { language, content } = element;
        return `
<div className="{code-block-container}">
  <div className="{code-block-header}">
    <span className="{code-language-badge}">${language}</span>
  </div>
  <pre className="{code-pre}">
    <code className="{code} {code-${language}}">
      ${this.escapeCode(content.join('\n'))}
    </code>
  </pre>
</div>
`;
    }
    escapeCode(code) {
        // Escape HTML special characters
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
class APIEndpointTemplate {
    async generate(element, designSystem) {
        var _a, _b, _c, _d, _e, _f, _g;
        const { method, endpoint, parameters, responses } = element;
        const dsConfig = (_a = designSystem === null || designSystem === void 0 ? void 0 : designSystem.getConfigForType) === null || _a === void 0 ? void 0 : _a.call(designSystem, 'api-endpoint');
        return `
<div className="${((_b = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _b === void 0 ? void 0 : _b.apiEndpointContainer) || ''}">
  <div className="${((_c = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _c === void 0 ? void 0 : _c.endpointHeader) || ''} ${((_d = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _d === void 0 ? void 0 : _d[`method${method.toLowerCase()}`]) || ''}">
    <span className="${((_e = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _e === void 0 ? void 0 : _e.httpMethod) || ''}">${method}</span>
    <span className="${((_f = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _f === void 0 ? void 0 : _f.endpointPath) || ''}">${endpoint}</span>
  </div>
  <div className="${((_g = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _g === void 0 ? void 0 : _g.endpointBody) || ''}">
    ${this.renderParameters(parameters, designSystem)}
    ${this.renderResponses(responses, designSystem)}
  </div>
</div>
`;
    }
    renderParameters(parameters, designSystem) {
        var _a, _b, _c, _d;
        const dsConfig = (_a = designSystem === null || designSystem === void 0 ? void 0 : designSystem.getConfigForType) === null || _a === void 0 ? void 0 : _a.call(designSystem, 'api-endpoint');
        if (!parameters || parameters.length === 0) {
            return '';
        }
        return `
    <div className="${((_b = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _b === void 0 ? void 0 : _b.parametersSection) || ''}">
      <h4 className="${((_c = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _c === void 0 ? void 0 : _c.sectionTitle) || ''}">Parameters</h4>
      <table className="${((_d = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _d === void 0 ? void 0 : _d.parametersTable) || ''}">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
          </tr>
        </thead>
        <tbody>
          ${parameters
            .map(param => `
          <tr>
            <td>${param.name}</td>
            <td>${param.type}</td>
            <td>${param.description}</td>
            <td>${param.required ? 'Yes' : 'No'}</td>
          </tr>
          `)
            .join('')}
      </table>
    </div>
    `;
    }
    renderResponses(responses, designSystem) {
        var _a, _b, _c, _d;
        const dsConfig = (_a = designSystem === null || designSystem === void 0 ? void 0 : designSystem.getConfigForType) === null || _a === void 0 ? void 0 : _a.call(designSystem, 'api-endpoint');
        if (!responses || Object.keys(responses).length === 0) {
            return '';
        }
        return `
    <div className="${((_b = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _b === void 0 ? void 0 : _b.responsesSection) || ''}">
      <h4 className="${((_c = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _c === void 0 ? void 0 : _c.sectionTitle) || ''}">Responses</h4>
      <div className="${((_d = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _d === void 0 ? void 0 : _d.responsesContainer) || ''}">
        ${Object.entries(responses)
            .map(([code, response]) => `
        <div className="{response-item} {response-${this.getResponseClass(code)}}">
          <div className="{response-code}">${code}</div>
          <div className="{response-description}">${response.description}</div>
        </div>
        `)
            .join('')}
      </div>
    </div>
    `;
    }
    getResponseClass(code) {
        const codeNum = parseInt(code, 10);
        if (codeNum < 300)
            return 'success';
        if (codeNum < 400)
            return 'redirect';
        if (codeNum < 500)
            return 'client-error';
        return 'server-error';
    }
}
class TableTemplate {
    async generate(element, designSystem) {
        var _a, _b, _c;
        const { headers, rows } = element;
        const dsConfig = (_a = designSystem === null || designSystem === void 0 ? void 0 : designSystem.getConfigForType) === null || _a === void 0 ? void 0 : _a.call(designSystem, 'table');
        return `
<div className="${((_b = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _b === void 0 ? void 0 : _b.tableContainer) || ''}">
  <table className="${((_c = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _c === void 0 ? void 0 : _c.table) || ''}">
    <thead>
      <tr>
        ${headers
            .map((header) => { var _a; return `<th className="${((_a = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _a === void 0 ? void 0 : _a.tableHeader) || ''}">${header}</th>`; })
            .join('\n        ')}
      </tr>
    </thead>
    <tbody>
      ${rows
            .map((row) => {
            var _a;
            return `
      <tr className="${((_a = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _a === void 0 ? void 0 : _a.tableRow) || ''}">
        ${row.map((cell) => { var _a; return `<td className="${((_a = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _a === void 0 ? void 0 : _a.tableCell) || ''}">${cell}</td>`; }).join('\n        ')}
      </tr>
      `;
        })
            .join('\n      ')}
    </tbody>
  </table>
</div>
`;
    }
}
class NavigationTemplate {
    async generate(element, designSystem) {
        var _a, _b, _c;
        const { items } = element;
        const dsConfig = (_a = designSystem === null || designSystem === void 0 ? void 0 : designSystem.getConfigForType) === null || _a === void 0 ? void 0 : _a.call(designSystem, 'navigation');
        return `
<nav className="${((_b = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _b === void 0 ? void 0 : _b.navigationContainer) || ''}">
  <ul className="${((_c = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _c === void 0 ? void 0 : _c.navList) || ''}">
    ${items
            .map((item) => {
            var _a, _b, _c;
            return `
    <li className="${((_a = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _a === void 0 ? void 0 : _a.navItem) || ''}">
      <a href="${item.path}" className="${((_b = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _b === void 0 ? void 0 : _b.navLink) || ''}${item.active ? ' ' + (((_c = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _c === void 0 ? void 0 : _c.navLinkActive) || '') : ''}">
        ${item.label}
      </a>
      ${item.children ? this.renderSubItems(item.children, dsConfig) : ''}
    </li>
    `;
        })
            .join('\n    ')}
  </ul>
</nav>
`;
    }
    renderSubItems(items, dsConfig) {
        var _a;
        return `
    <ul className="${((_a = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _a === void 0 ? void 0 : _a.navSublist) || ''}">
      ${items
            .map((item) => {
            var _a, _b, _c;
            return `
      <li className="${((_a = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _a === void 0 ? void 0 : _a.navSubitem) || ''}">
        <a href="${item.path}" className="${((_b = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _b === void 0 ? void 0 : _b.navSublink) || ''}${item.active ? ' ' + (((_c = dsConfig === null || dsConfig === void 0 ? void 0 : dsConfig.classMapping) === null || _c === void 0 ? void 0 : _c.navSublinkActive) || '') : ''}">
          ${item.label}
        </a>
      </li>
      `;
        })
            .join('\n      ')}
    </ul>
    `;
    }
}
// Test
async function testComponentGenerator() {
    const designSystem = {
        type: 'custom',
        importPath: 'test',
        classNames: {
            pageContainer: 'test'
        }
    };
    const componentGenerator = new ComponentGenerator(designSystem);
    const contentElement = {
        type: 'section',
        title: 'Test Section',
        level: 1,
        content: []
    };
    await componentGenerator.generateComponent(contentElement);
    const contentModel = {
        id: 'test',
        contentType: 'page',
        title: 'Test Page',
        slug: 'test-page',
        content: 'test content',
        metadata: {
            createdAt: '2024-04-07',
            updatedAt: '2024-04-07',
            locale: 'en-US'
        },
        fields: {},
        elements: [contentElement]
    };
    await componentGenerator.generatePage(contentModel);
}
testComponentGenerator();
