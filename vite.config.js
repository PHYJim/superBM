import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // for debug
    // STOP scrambling variable names and removing spaces
    minify: false, 
    // Add Source Maps (Use 'inline' for extensions to avoid file path errors)
    sourcemap: 'inline',
    
    rollupOptions: {
      input: {
        // Entry Point 1: The Popup HTML
        popup: resolve(__dirname, 'src/popup/popup.html'),
        // Entry Point 2: The Background Script
        background: resolve(__dirname, 'src/background.js')
      },
      output: {
        // Keep file names simple (no random hashes)
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});