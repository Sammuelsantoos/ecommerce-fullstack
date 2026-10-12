import { jest } from '@jest/globals';

// Em ESM o global `jest` não existe: usamos @jest/globals e este helper
// para criar mocks sem fricção de tipagem.
export type AnyMock = ReturnType<typeof mockFn>;
export const mockFn = () => jest.fn<(...args: any[]) => any>();
