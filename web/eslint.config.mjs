import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [{ ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'] }, ...nextCoreWebVitals, ...nextTypescript, { rules: { '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }] } }];

export default config;
