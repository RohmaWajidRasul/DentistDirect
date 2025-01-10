import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true, // Use global `describe`, `it`, etc.
        environment: 'node', // Use Node.js environment
        coverage: {
            provider: 'c8', // Use c8 for coverage
            reporter: ['text', 'lcov'], // Coverage reports
        },
        mockReset: true, // Automatically reset mocks between tests
    },
});
