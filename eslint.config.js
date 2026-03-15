import eslint from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      // File naming: PascalCase for components, camelCase for everything else
      'check-file/filename-naming-convention': [
        'error',
        {
          // Components use PascalCase (App.tsx and all .tsx in components/)
          '**/src/App.tsx': 'PASCAL_CASE',
          '**/src/components/**/*.tsx': 'PASCAL_CASE',
          // Non-component files use camelCase
          '**/src/hooks/*.{ts,tsx}': 'CAMEL_CASE',
          '**/src/services/**/*.ts': 'CAMEL_CASE',
          '**/src/shared/*.ts': 'CAMEL_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
      // Folder naming: camelCase
      'check-file/folder-naming-convention': [
        'error',
        { '**/src/**/': 'CAMEL_CASE' },
      ],
    },
  },
  {
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        // Default for variables: camelCase or UPPER_CASE
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allowDouble',
        },
        // Functions: camelCase or PascalCase (for React components)
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        // Types & Interfaces: PascalCase
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        // Parameters: camelCase
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],
    },
  },
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Import organization
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'type',
          ],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      // Prefer logger utility over console.*
      'no-console': 'warn',
      // Enforce self-closing tags when no children
      'react/self-closing-comp': 'error',
      // Prevent unnecessary curly braces in JSX
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    },
  },
  {
    files: ['src/services/**/*.ts', 'src/hooks/**/*.{ts,tsx}', 'src/shared/**/*.ts'],
    plugins: {
      jsdoc,
    },
    rules: {
      // Require JSDoc on exported function declarations in services, hooks, and shared
      'jsdoc/require-jsdoc': ['warn', {
        require: {
          FunctionDeclaration: false,
          MethodDefinition: false,
          ClassDeclaration: false,
        },
        contexts: [
          'ExportNamedDeclaration > FunctionDeclaration',
        ],
        checkConstructors: false,
      }],
      // Require @param tags for function parameters
      'jsdoc/require-param': 'warn',
      'jsdoc/require-param-description': 'warn',
    },
  },
  {
    ignores: ['dist/', 'src-tauri/'],
  }
);
