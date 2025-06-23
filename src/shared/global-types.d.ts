/**
 * グローバルオブジェクトの型定義
 */

interface MainAppInstance {
	requestForceClose(): void;
}

declare global {
	namespace NodeJS {
		interface Global {
			mainAppInstance?: MainAppInstance;
			app?: Electron.App;
		}
	}

	var mainAppInstance: MainAppInstance | undefined;
	var app: Electron.App | undefined;
}
