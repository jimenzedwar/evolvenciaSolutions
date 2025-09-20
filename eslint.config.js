import js from '@eslint/js'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
  },
]
