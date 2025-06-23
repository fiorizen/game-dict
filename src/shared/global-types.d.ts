/**
 * グローバルオブジェクトの型定義
 */

interface MainAppInstance {
	requestForceClose(): void;
}

declare global {
	var mainAppInstance: MainAppInstance | undefined;
	var app: Electron.App | undefined;
}

// Explicit global namespace for better compatibility
declare namespace globalThis {
	var mainAppInstance: MainAppInstance | undefined;
	var app: Electron.App | undefined;
}
