import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['crawler/index.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node18',
  clean: true,
})
