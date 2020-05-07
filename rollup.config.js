import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'umd',
    name: 'unstoppableChat'
  },
  plugins: [resolve()]
};
