import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for DHIS2 app deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'utils-vendor': ['html2canvas', 'lucide-react'],
          // App chunks
          'charts': [
            './src/components/Chart1.tsx',
            './src/components/Chart2.tsx',
            './src/components/Chart3.tsx',
            './src/components/Chart4.tsx',
            './src/components/Chart5.tsx',
            './src/components/Chart6.tsx',
            './src/components/Chart7.tsx',
            './src/components/Chart8.tsx',
            './src/components/Chart9.tsx'
          ],
          'services': [
            './src/services/dhis2Service.ts',
            './src/services/dataProcessingService.ts',
            './src/services/dataTransformationService.ts'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
