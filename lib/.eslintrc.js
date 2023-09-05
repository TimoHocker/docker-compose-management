/* eslint-disable */

module.exports = {
  env: {
    commonjs: true,
    es6:      true,
    node:     true
  },
  extends: [ '@sapphirecode/eslint-config-ts' ],
  globals: {
    Atomics:           'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: { ecmaVersion: 2018 },
  rules:         { 
    'no-await-in-loop': 'off',
    'no-console': 'off'
  }
};
