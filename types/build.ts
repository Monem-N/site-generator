// Build configuration types

/**
 * Build configuration
 */
export interface BuildConfig {
  /**
   * Target environment
   */
  target: 'production' | 'development' | 'preview' | string;

  /**
   * Output directory
   */
  outDir: string;

  /**
   * Optimization options
   */
  optimization: {
    /**
     * Enable minification
     */
    minify: boolean;

    /**
     * Enable tree shaking
     */
    treeshaking: boolean;

    /**
     * Enable code splitting
     */
    splitChunks: boolean;
  };

  /**
   * Asset options
   */
  assets: {
    /**
     * Image optimization options
     */
    images: {
      /**
       * Enable image optimization
       */
      optimize: boolean;

      /**
       * Output formats
       */
      formats: string[];
    };

    /**
     * Font optimization options
     */
    fonts: {
      /**
       * Enable font preloading
       */
      preload: boolean;

      /**
       * Font formats to include
       */
      formats: string[];
    };
  };
}
