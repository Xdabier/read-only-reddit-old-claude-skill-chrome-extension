import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    files: ['mcp-server/**/*.js', 'extension/test/**/*.js', 'scripts/**/*.js', '*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['extension/src/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.webextensions } },
  },
];
