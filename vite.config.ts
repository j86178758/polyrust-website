import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { projectName } from './src/site/content'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'project-name',
      transformIndexHtml: (html) => html.replaceAll('__PROJECT_NAME__', projectName),
    },
  ],
})
