'use strict';

module.exports = {
  env: {
    commonjs: true,
    es6:      true,
    node:     true
  },
  extends: [ '@sapphirecode' ],
  globals: {
    Atomics:           'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: { ecmaVersion: 2018 }
};
