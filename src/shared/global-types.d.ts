/**
 * グローバルオブジェクトの型定義
 */

interface MainAppInstance {
	requestForceClose(): void;
	getMainWindow(): Electron.BrowserWindow | null;
	getAutoSaveManager(): {
		start(): void;
		stop(): void;
		getStatus(): {
			enabled: boolean;
			skipUntilAcknowledged: boolean;
			lastSaveTime: string | null;
			nextSaveTime: string | null;
		};
		acknowledgeSkip(): void;
	};
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
