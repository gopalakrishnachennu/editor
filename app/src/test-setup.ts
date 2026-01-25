import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Global LocalStorage Mock
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};

vi.stubGlobal('localStorage', localStorageMock);
