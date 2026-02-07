import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ command, mode }) => {
  const isDev = command === "serve";
  const isWatch = process.argv.includes("--watch");
  const isProduction = mode === "production" && !isDev && !isWatch;

  console.log(
    `Build mode: ${mode}, isDev: ${isDev}, isWatch: ${isWatch}, isProduction: ${isProduction}`
  );

  return {
    plugins: [],
    build: {
      lib: {
        entry: "src/index.ts",
        name: "VoiceHireFAQPlugin",
        fileName: (format) => `vh-faq-plugin.${format}.js`,
        formats: ["es", "umd"],
      },
      rollupOptions: {
        external: [],
        output: {
          globals: {},
        },
      },
      // Only minify in production builds
      minify: isProduction ? "terser" : false,
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ["console.log", "console.info"],
            },
            mangle: {
              toplevel: true,
            },
            format: {
              comments: false,
            },
          }
        : undefined,
      // Always generate source maps for debugging
      sourcemap: true,
      // Enable watch mode when requested
      watch: isWatch
        ? {
            include: ["src/**"],
            exclude: ["node_modules/**", "dist/**"],
            clearScreen: false,
          }
        : null,
      // Optimize chunks in production
      chunkSizeWarningLimit: isProduction ? 500 : 1000,
      reportCompressedSize: isProduction,
    },
    server: {
      port: 3000,
      open: true,
      // Watch for changes in source files and dist
      watch: {
        usePolling: true,
        interval: 100,
        ignored: ["!**/node_modules/**"],
      },
    },
    // Ensure TypeScript files are processed
    esbuild: {
      target: "es2020",
      format: "esm",
      // Keep function names in development for better debugging
      keepNames: !isProduction,
    },
    // Clear console on rebuild in watch mode
    clearScreen: false,
    // Define mode for better conditional logic
    define: {
      __DEV__: !isProduction,
    },
  };
});
