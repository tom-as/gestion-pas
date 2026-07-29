import type { Config } from 'jest';
import { resolve } from 'path';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: resolve(__dirname, 'tsconfig.test.json') }],
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@gestion-pas/types$': resolve(__dirname, '../../packages/types/src/index.ts'),
  },
  testTimeout: 30000,
};

export default config;
