declare const _default: {
    clearMocks: boolean;
    collectCoverage: boolean;
    collectCoverageFrom: string[];
    coverageDirectory: string;
    coverageProvider: string;
    coverageThreshold: {
        global: {
            branches: number;
            functions: number;
            lines: number;
            statements: number;
        };
    };
    extensionsToTreatAsEsm: string[];
    moduleFileExtensions: string[];
    testEnvironment: string;
    testMatch: string[];
    transform: {
        '^.+\\.m?[tj]sx?$': (string | {
            tsconfig: {
                target: string;
                module: string;
            };
        })[];
    };
    transformIgnorePatterns: string[];
    verbose: boolean;
};
export default _default;
