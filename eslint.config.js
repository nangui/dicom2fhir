import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['**/dist/**', '**/coverage/**', 'data/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['apps/api/**/*.ts', '**/*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },

  // Boundary: the browser bundle may only know api's types, never its runtime
  // (that is where ANTHROPIC_API_KEY lives). Tests may run the api in-process.
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', 'apps/web/src/test/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@dicom2fhir/api', '@dicom2fhir/api/*'],
              allowTypeImports: true,
              message: 'web may only `import type` from api: runtime code and secrets stay server-side.',
            },
          ],
        },
      ],
    },
  },

  // Boundary: core is pure TS, shared by browser and server, framework-free.
  {
    files: ['packages/core/src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'hono', '@hono/*', '@trpc/*', 'node:*', '@dicom2fhir/api*', '@dicom2fhir/web*'],
              message: 'core must stay framework-free and runtime-agnostic.',
            },
          ],
        },
      ],
    },
  },
)
