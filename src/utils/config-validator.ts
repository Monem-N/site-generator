/**
 * Validates a configuration object
 * @param {Record<string, unknown>} config - The configuration to validate
 * @returns {{ isValid: boolean, errors: string[] }} Validation result with errors if any
 */
export function validateConfig(config: Record<string, unknown>) {
  const errors: string[] = [];

  // Check if config is an object
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    errors.push('Config must be an object');
    return { isValid: false, errors };
  }

  // Required fields
  if (!config.source) {
    errors.push('Source directory is required');
  } else if (typeof config.source !== 'string') {
    errors.push('Source must be a string');
  }

  if (!config.output) {
    errors.push('Output directory is required');
  } else if (typeof config.output !== 'string') {
    errors.push('Output must be a string');
  }

  // Optional fields with type validation
  if (config.title !== undefined && typeof config.title !== 'string') {
    errors.push('Title must be a string');
  }

  if (config.description !== undefined && typeof config.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (config.theme !== undefined && typeof config.theme !== 'string') {
    errors.push('Theme must be a string');
  }

  if (config.plugins !== undefined) {
    if (!Array.isArray(config.plugins)) {
      errors.push('Plugins must be an array');
    }
  }

  if (config.options !== undefined) {
    if (typeof config.options !== 'object' || Array.isArray(config.options)) {
      errors.push('Options must be an object');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
