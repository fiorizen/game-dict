/**
 * Game code validation utilities
 */

/**
 * Validates game code format
 * - Only alphanumeric characters (a-z, A-Z, 0-9)
 * - Maximum 16 characters
 * - Minimum 1 character
 */
export function validateGameCode(code: string): { valid: boolean; error?: string } {
	if (!code) {
		return { valid: false, error: "Game code is required" };
	}

	if (code.length === 0) {
		return { valid: false, error: "Game code cannot be empty" };
	}

	if (code.length > 16) {
		return { valid: false, error: "Game code must be 16 characters or less" };
	}

	// Check if code contains only alphanumeric characters
	const alphanumericRegex = /^[a-zA-Z0-9]+$/;
	if (!alphanumericRegex.test(code)) {
		return { valid: false, error: "Game code must contain only letters and numbers" };
	}

	return { valid: true };
}

/**
 * Generates a default game code from game name
 * - Converts to lowercase
 * - Replaces non-alphanumeric with empty string
 * - Truncates to 16 characters
 */
export function generateGameCodeFromName(name: string): string {
	if (!name) {
		return "";
	}

	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "")
		.substring(0, 16);
}