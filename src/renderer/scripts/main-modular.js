/**
 * メインエントリーポイント - モジュール化版
 * アプリケーションの初期化と各モジュールの統合を管理
 */

import { gameState, loadGames, loadCategories } from './gameState.js';
import { 
	populateGameSelect, 
	selectFirstGame, 
	populateCategorySelects, 
	closeModals,
	openGameModal,
	DOM,
	addNewEntryRow
} from './uiComponents.js';
import { 
	onGameChange,
	onGameNameInput,
	onGameSubmit,
	onEditGame,
	onDeleteGame,
	onExportGitCsv,
	onImportCsv,
	onImportIme,
	onExportIme,
	handleTableEvents,
	setupDataSyncHandlers
} from './eventHandlers.js';
import { 
	addAutoSaveListeners, 
	addKeyboardNavigationListeners 
} from './entryManager.js';

// アプリケーション初期化
document.addEventListener("DOMContentLoaded", async () => {
	try {
		// 状態をリセット
		gameState.reset();
		
		// データを読み込み
		await loadCategories();
		const games = await loadGames();
		
		// UIを初期化
		populateGameSelect(games);
		populateCategorySelects();
		selectFirstGame(games);
		
		// イベントリスナーを設定
		setupEventListeners();
		setupDataSyncHandlers();
		
		console.log("Application initialized successfully");
	} catch (error) {
		console.error("Failed to initialize application:", error);
	}
});

// イベントリスナー設定
function setupEventListeners() {
	// ゲーム関連
	DOM.gameSelect.addEventListener("change", onGameChange);
	DOM.addGameBtn.addEventListener("click", () => openGameModal());
	DOM.editGameBtn.addEventListener("click", onEditGame);
	DOM.deleteGameBtn.addEventListener("click", onDeleteGame);
	
	// ゲームフォーム
	document.getElementById("game-name").addEventListener("input", onGameNameInput);
	
	// ゲームコードの手動変更検知
	document.getElementById("game-code").addEventListener("input", (e) => {
		e.target.dataset.userModified = "true";
	});
	
	DOM.gameForm.addEventListener("submit", onGameSubmit);
	
	// エントリー管理
	DOM.addEntryBtn.addEventListener("click", addNewEntryRow);
	
	// エントリーテーブルのイベント委譲
	DOM.entriesTableBody.addEventListener("click", handleTableEvents);
	
	// 新しいエントリー行のイベント処理
	DOM.entriesTableBody.addEventListener("DOMNodeInserted", (event) => {
		const insertedNode = event.target;
		if (insertedNode.nodeType === Node.ELEMENT_NODE) {
			if (insertedNode.classList.contains("new-entry-row")) {
				addAutoSaveListeners(insertedNode);
				addKeyboardNavigationListeners(insertedNode);
			} else if (insertedNode.classList.contains("edit-entry-row")) {
				const entryId = parseInt(insertedNode.dataset.entryId);
				addAutoSaveListeners(insertedNode, entryId);
				addKeyboardNavigationListeners(insertedNode);
			}
		}
	});
	
	// CSV操作
	document.getElementById("export-git-csv-btn").addEventListener("click", onExportGitCsv);
	document.getElementById("import-csv-btn").addEventListener("click", onImportCsv);
	
	// IME操作
	DOM.importImeBtn.addEventListener("click", onImportIme);
	DOM.exportImeBtn.addEventListener("click", onExportIme);
	
	// モーダル処理
	setupModalHandlers();
}

// モーダルイベントハンドラー設定
function setupModalHandlers() {
	// モーダルクローズボタン
	document.querySelectorAll(".modal-close").forEach((btn) => {
		btn.addEventListener("click", closeModals);
	});

	// モーダル背景クリック
	document.querySelectorAll(".modal").forEach((modal) => {
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				closeModals();
			}
		});
	});

	// キャンセルボタン
	document.getElementById("cancel-game-btn").addEventListener("click", closeModals);
	
	// ESCキーでモーダルを閉じる
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			closeModals();
		}
	});
}

// グローバルエラーハンドラー
window.addEventListener("error", (event) => {
	console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
	console.error("Unhandled promise rejection:", event.reason);
});

// デバッグ用（開発環境のみ）
if (process.env.NODE_ENV === "development") {
	// デバッグ用のグローバル変数を公開
	window.debugAPI = {
		gameState,
		DOM,
		utils: {
			loadGames,
			loadCategories,
			populateGameSelect,
			populateCategorySelects
		}
	};
}

console.log("Main module loaded successfully");