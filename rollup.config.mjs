import path from 'path';
import fs from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import clean from 'rollup-plugin-clear';
import cleanup from 'rollup-plugin-cleanup';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import { visualizer } from 'rollup-plugin-visualizer';
import postcssLess from 'postcss-less';

const build = () => {
  const config = {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.min.js',
        format: 'umd',
        sourcemap: true,
        name: 'fabricWarpvas',
        globals: {
          fabric: 'fabric',
        },
      },
      {
        file: 'dist/index.esm.js',
        format: 'es',
        sourcemap: true,
      },
    ],
    external: ['fabric'],
    plugins: [
      clean({ targets: ['dist'] }),
      resolve(),
      commonjs(),
      json(),
      typescript({
        exclude: ['docs/**/*', 'jest.config.ts'],
      }),
      babel({
        babelHelpers: 'bundled',
      }),
      cleanup({
        comments: 'none',
      }),
      terser(),
    ],
    onwarn: (warning, warn) => {
      if (warning.code === 'CIRCULAR_DEPENDENCY') return;
      warn(warning);
    },
  };
  if (process.env.NODE_ENV === 'production' && !process.env.ROLLUP_WATCH) {
    config.plugins.push(visualizer());
  }
  return config;
};

const build_modes = () => {
  const modeBaseDir = 'src/modes';
  const files = fs.readdirSync(path.resolve(modeBaseDir));
  const inputs = files.reduce((map, file) => {
    const entranceFile = `${modeBaseDir}/${file}`;
    if (fs.existsSync(path.join(process.cwd(), entranceFile))) {
      map[`${file}`] = entranceFile;
    }
    return map;
  }, {});
  return {
    input: inputs,
    output: [
      {
        dir: 'modes',
        format: 'es',
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name.replace('.class.ts', '');
          return `${name}.esm.js`;
        },
        sourcemap: true,
      },
      {
        dir: 'modes',
        format: 'cjs',
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name.replace('.class.ts', '');
          return `${name}.js`;
        },
        sourcemap: true,
        exports: 'named',
      },
    ],
    external: ['fabric'],
    plugins: [
      clean({ targets: ['modes'] }),
      resolve(),
      commonjs(),
      json(),
      typescript({
        declaration: false,
        outDir: './modes',
      }),
      babel({
        babelHelpers: 'bundled',
      }),
      cleanup({
        comments: 'none',
      }),
      terser(),
    ],
    onwarn: (warning, warn) => {
      if (warning.code === 'CIRCULAR_DEPENDENCY') return;
      warn(warning);
    },
  };
};

const build_serve = () => {
  const config = {
    input: 'docs/index.tsx',
    output: [
      {
        file: 'docs/index.js',
        format: 'iife',
        globals: {
          fabric: 'fabric',
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    ],
    external: ['fabric', 'react', 'react-dom'],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env.BROWSER': JSON.stringify(true),
      }),
      commonjs(),
      json(),
      typescript({
        declaration: false,
      }),
      postcss({
        syntax: postcssLess,
        namedExports: (id) => id.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase()),
        extensions: ['.css', '.less'],
        minimize: true,
        modules: true,
      }),
      babel({
        babelHelpers: 'bundled',
      }),
    ],
    onwarn: (warning, warn) => {
      if (warning.code === 'CIRCULAR_DEPENDENCY') return;
      warn(warning);
    },
  };
  if (process.env.ROLLUP_WATCH) {
    config.plugins.push(
      serve({
        open: true,
        contentBase: 'docs/',
        verbose: true,
      }),
      livereload({
        watch: ['docs'],
        verbose: false,
      }),
    );
  }
  return config;
};

const configs = {
  base: build(),
  theme: build_modes(),
  serve: process.env.NODE_ENV === 'development' ? build_serve() : undefined,
};

export default Object.values(configs).filter(Boolean);
