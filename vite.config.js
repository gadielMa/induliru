import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'turnos',
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/turnos/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});

