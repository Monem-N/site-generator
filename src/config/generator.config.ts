// Define the structure for a single custom format entry
export interface CustomFormatConfig {
  parser: (content: string) => unknown | string; // Specify the parser type explicitly
  // Add any other properties expected in a custom format config
  // options?: Record<string, unknown>;
}

// Ensure the customFormats property uses this type
export interface ParserConfig {
  plugins?: unknown[]; // Replace `any[]` with `unknown[]` for stricter typing
  customFormats?: {
    [formatName: string]: CustomFormatConfig; // Use the specific type here
  };
}

// Make sure WebsiteGeneratorConfig uses the updated ParserConfig
export interface WebsiteGeneratorConfig {
  // ...other properties...
  parser: ParserConfig;
  // ...other properties...
}
