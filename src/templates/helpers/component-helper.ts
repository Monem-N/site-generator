import * as Handlebars from 'handlebars';
import { DesignSystem } from '../../../types/design.js';

/**
 * Options for the component helper
 */
interface ComponentHelperOptions {
  /**
   * The design system to use
   */
  designSystem?: DesignSystem;

  /**
   * Additional attributes to add to the component
   */
  attributes?: Record<string, unknown>;

  /**
   * The component type
   */
  type: string;

  /**
   * The component name
   */
  name?: string;

  /**
   * The component variant
   */
  variant?: string;

  /**
   * The component size
   */
  size?: string;

  /**
   * The component color
   */
  color?: string;

  /**
   * The component state
   */
  state?: string;

  /**
   * The component content
   */
  content?: string;

  /**
   * Additional CSS classes to add to the component
   */
  className?: string;

  /**
   * The component ID
   */
  id?: string;
}

/**
 * Register the component helper with Handlebars
 */
export function registerComponentHelper(handlebars: typeof Handlebars): void {
  handlebars.registerHelper(
    'component',
    function (options: Handlebars.HelperOptions & { hash: ComponentHelperOptions }) {
      const {
        designSystem,
        type,
        name,
        variant,
        size,
        color,
        state,
        content,
        className,
        id,
        attributes,
      } = options.hash;

      // Get the component configuration from the design system
      const componentConfig = designSystem?.getConfigForType(type) || {
        classMapping: {},
        components: [],
      };

      // Build the component class names
      const classNames = [];

      // Add the base class for the component type
      if (componentConfig.classMapping.base) {
        classNames.push(componentConfig.classMapping.base);
      }

      // Add variant class if specified
      if (variant && componentConfig.classMapping.variants?.[variant]) {
        classNames.push(componentConfig.classMapping.variants[variant]);
      }

      // Add size class if specified
      if (size && componentConfig.classMapping.sizes?.[size]) {
        classNames.push(componentConfig.classMapping.sizes[size]);
      }

      // Add color class if specified
      if (color && componentConfig.classMapping.colors?.[color]) {
        classNames.push(componentConfig.classMapping.colors[color]);
      }

      // Add state class if specified
      if (state && componentConfig.classMapping.states?.[state]) {
        classNames.push(componentConfig.classMapping.states[state]);
      }

      // Add custom class if specified
      if (className) {
        classNames.push(className);
      }

      // Build the component attributes
      const componentAttributes: Record<string, string> = {
        class: classNames.join(' '),
      };

      // Add ID if specified
      if (id) {
        componentAttributes.id = id;
      }

      // Add data attributes for component type and name
      componentAttributes['data-component'] = type;
      if (name) {
        componentAttributes['data-name'] = name;
      }

      // Add additional attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          componentAttributes[key] = String(value);
        });
      }

      // Build the component HTML
      let html = `<div`;

      // Add attributes
      Object.entries(componentAttributes).forEach(([key, value]) => {
        html += ` ${key}="${value}"`;
      });

      // Add content
      html += '>';
      html += content || options.fn(this);
      html += '</div>';

      return new Handlebars.SafeString(html);
    }
  );
}

/**
 * Register all template helpers
 */
export function registerAllHelpers(handlebars: typeof Handlebars): void {
  registerComponentHelper(handlebars);
}
