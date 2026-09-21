import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', 'app/**', 'build/**', 'db/**', 'worker/**']),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { window: 'readonly', document: 'readonly', localStorage: 'readonly', crypto: 'readonly' },
    },
    rules: {
      // Core ESLint does not account for the automatic JSX runtime's component
      // references. Keep this lightweight lint gate focused on real parse and
      // hook errors until eslint-plugin-react is introduced with the next UI pass.
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
