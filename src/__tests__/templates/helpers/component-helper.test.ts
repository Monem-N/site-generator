import * as Handlebars from 'handlebars';
import { registerComponentHelper } from '../../../templates/helpers/component-helper.js';
import { DesignSystem } from '../../../../types/design.js';

describe('Component Helper', () => {
  let handlebars: typeof Handlebars;
  let mockDesignSystem: DesignSystem;

  beforeEach(() => {
    // Create a new Handlebars instance
    handlebars = Handlebars.create();

    // Register the component helper
    registerComponentHelper(handlebars);

    // Create a mock design system
    mockDesignSystem = {
      type: 'custom',
      name: 'Test Design System',
      importPath: '@/test-design-system',
      classNames: {
        container: 'test-container',
        heading1: 'test-heading-1',
        heading2: 'test-heading-2',
      },
      getConfigForType: jest.fn().mockImplementation((type: string) => {
        if (type === 'button') {
          return {
            classMapping: {
              base: 'btn',
              variants: {
                primary: 'btn-primary',
                secondary: 'btn-secondary',
              },
              sizes: {
                small: 'btn-sm',
                large: 'btn-lg',
              },
              colors: {
                red: 'btn-red',
                blue: 'btn-blue',
              },
              states: {
                disabled: 'btn-disabled',
                active: 'btn-active',
              },
            },
            components: [],
          };
        }
        return {
          classMapping: {},
          components: [],
        };
      }),
    };
  });

  test('should render a basic component', () => {
    // Compile a template with the component helper
    const template = handlebars.compile('{{#component type="div" content="Hello, world!"}}');

    // Render the template
    const result = template({});

    // Verify the result
    expect(result).toBe('<div class="" data-component="div">Hello, world!</div>');
  });

  test('should render a component with design system classes', () => {
    // Compile a template with the component helper
    const template = handlebars.compile(
      '{{#component type="button" variant="primary" size="large" color="blue" state="active" designSystem=designSystem}}'
    );

    // Render the template
    const result = template({ designSystem: mockDesignSystem });

    // Verify the result
    expect(result).toBe(
      '<div class="btn btn-primary btn-lg btn-blue btn-active" data-component="button"></div>'
    );
  });

  test('should render a component with custom attributes', () => {
    // Compile a template with the component helper
    const template = handlebars.compile(
      '{{#component type="button" id="my-button" className="custom-class" attributes=(hash disabled="true" "data-test"="test")}}'
    );

    // Render the template
    const result = template({});

    // Verify the result
    expect(result).toBe(
      '<div class="custom-class" id="my-button" data-component="button" disabled="true" data-test="test"></div>'
    );
  });

  test('should render a component with content from the block', () => {
    // Compile a template with the component helper
    const template = handlebars.compile('{{#component type="button"}}Click me{{/component}}');

    // Render the template
    const result = template({});

    // Verify the result
    expect(result).toBe('<div class="" data-component="button">Click me</div>');
  });

  test('should render a component with content from the hash', () => {
    // Compile a template with the component helper
    const template = handlebars.compile('{{#component type="button" content="Click me"}}');

    // Render the template
    const result = template({});

    // Verify the result
    expect(result).toBe('<div class="" data-component="button">Click me</div>');
  });

  test('should render a component with a name', () => {
    // Compile a template with the component helper
    const template = handlebars.compile('{{#component type="button" name="submit-button"}}');

    // Render the template
    const result = template({});

    // Verify the result
    expect(result).toBe('<div class="" data-component="button" data-name="submit-button"></div>');
  });

  test('should handle missing design system gracefully', () => {
    // Compile a template with the component helper
    const template = handlebars.compile(
      '{{#component type="button" variant="primary" size="large"}}'
    );

    // Render the template
    const result = template({});

    // Verify the result
    expect(result).toBe('<div class="" data-component="button"></div>');
  });
});
