/**
 * Game code validation utilities
 */
/**
 * Validates game code format
 * - Only alphanumeric characters (a-z, A-Z, 0-9)
 * - Maximum 16 characters
 * - Minimum 1 character
 */
export declare function validateGameCode(code: string): {
    valid: boolean;
    error?: string;
};
/**
 * Generates a default game code from game name
 * - Converts to lowercase
 * - Replaces non-alphanumeric with empty string
 * - Truncates to 16 characters
 */
export declare function generateGameCodeFromName(name: string): string;
//# sourceMappingURL=validation.d.ts.map