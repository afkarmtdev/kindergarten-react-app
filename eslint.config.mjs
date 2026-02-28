import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['frontend/src/**/*.{ts,tsx}', 'backend/src/**/*.ts', 'packages/**/*.ts'],
    rules: {
      // TypeScript compiler already enforces this via noUnusedLocals / noUnusedParameters
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // React-specific rules only for the frontend
    files: ['frontend/src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  }
)
