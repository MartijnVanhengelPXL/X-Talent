import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// "base" moet overeenkomen met de naam van je GitHub-repository,
// anders vindt GitHub Pages je bestanden niet.
export default defineConfig({
  plugins: [vue()],
  base: '/X-Talent/',
})
