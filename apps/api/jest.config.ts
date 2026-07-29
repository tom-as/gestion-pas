import type { Config } from 'jest';
import { resolve } from 'path';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: resolve(__dirname, 'tsconfig.test.json') }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@gestion-pas/types$': resolve(__dirname, '../../packages/types/src/index.ts'),
  },
};

export default config;
