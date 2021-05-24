import { nodeResolve } from '@rollup/plugin-node-resolve'
import pkg from './package.json'

export default {
  input: pkg.input,
  plugins: [
    nodeResolve()
  ],
  external: [
    'vue'
  ],
  output: [
    {
      file: pkg.main,
      name: 'Pony',
      format: 'umd',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es'
    }
  ]
}