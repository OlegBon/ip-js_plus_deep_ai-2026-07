// In jest.setup.ts
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

Object.assign(global, { TextEncoder, TextDecoder });
