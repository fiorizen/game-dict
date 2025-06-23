/**
 * イベントハンドリングモジュール
 * アプリケーションの全てのイベントハンドラーを管理
 */

import { gameState, loadGames, loadCategories, loadEntries } from './gameState.js';
import { 
	populateGameSelect, 
	selectFirstGame, 
	populateCategorySelects, 
	renderEntriesTable,
	openGameModal, 
	closeModals, 
	DOM,
	updateImeExportButtonState,
	addNewEntryRow
} from './uiComponents.js';
import { 
	saveNewEntry, 
	deleteEntry, 
	addAutoSaveListeners, 
	addKeyboardNavigationListeners,
	startEditEntry
} from './entryManager.js';
import { showError, showSuccess, setButtonLoading } from './utils.js';

// ゲーム選択変更
export async function onGameChange(event) {
	const gameId = parseInt(event.target.value);
	
	if (!gameId) {
		gameState.setCurrentGame(null);
		gameState.setCurrentEntries([]);
		DOM.currentGameTitle.textContent = "ゲームが選択されていません";
		renderEntriesTable([]);
		updateImeExportButtonState();
		return;
	}

	try {
		const game = await window.electronAPI.games.getById(gameId);
		gameState.setCurrentGame(game);
		gameState.setShouldSortEntries(true);
		
		DOM.currentGameTitle.textContent = game ? game.name : "ゲームが選択されていません";
		
		const entries = await loadEntries(gameId);
		renderEntriesTable(entries);
		updateImeExportButtonState();
		
		// 新しいエントリー行を追加
		addNewEntryRow();
	} catch (error) {
		console.error("Failed to load game:", error);
		showError("ゲームの読み込みに失敗しました");
	}
}

// ゲーム名入力時のコード自動生成
export function onGameNameInput(event) {
	const nameField = event.target;
	const codeField = document.getElementById("game-code");
	
	if (codeField && !codeField.dataset.userModified) {
		// ゲーム名からコードを自動生成
		const code = nameField.value
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "")
			.substring(0, 16);
		codeField.value = code;
	}
}

// ゲームフォーム送信
export async function onGameSubmit(event) {
	event.preventDefault();
	
	const form = event.target;
	const formData = new FormData(form);
	const submitBtn = form.querySelector('button[type="submit"]');
	
	setButtonLoading(submitBtn, true);
	
	try {
		const gameData = {
			name: formData.get("game_name").trim(),
			code: formData.get("game_code").trim(),
		};

		if (!gameData.name || !gameData.code) {
			showError("ゲーム名とコードは必須です");
			return;
		}

		const gameId = form.dataset.gameId;
		let result;

		if (gameId) {
			// 更新
			result = await window.electronAPI.games.update(parseInt(gameId), gameData);
			showSuccess(`ゲーム「${result.name}」を更新しました`);
		} else {
			// 新規作成
			result = await window.electronAPI.games.create(gameData);
			showSuccess(`ゲーム「${result.name}」を追加しました`);
		}

		closeModals();
		
		// ゲーム一覧を再読み込み
		const games = await loadGames();
		populateGameSelect(games);
		
		// 作成/更新したゲームを選択
		DOM.gameSelect.value = result.id;
		DOM.gameSelect.dispatchEvent(new Event("change"));
		
	} catch (error) {
		console.error("Failed to save game:", error);
		showError("ゲームの保存に失敗しました");
	} finally {
		setButtonLoading(submitBtn, false);
	}
}

// ゲーム編集
export async function onEditGame() {
	const currentGame = gameState.getCurrentGame();
	if (!currentGame) {
		showError("編集するゲームが選択されていません");
		return;
	}
	
	openGameModal(currentGame);
}

// ゲーム削除
export async function onDeleteGame() {
	const currentGame = gameState.getCurrentGame();
	if (!currentGame) {
		showError("削除するゲームが選択されていません");
		return;
	}

	try {
		const entryCount = await window.electronAPI.games.getEntryCount(currentGame.id);
		
		if (entryCount > 0) {
			const confirmed = confirm(
				`ゲーム「${currentGame.name}」には${entryCount}個のエントリーがあります。\n` +
				"ゲームを削除すると、関連するエントリーもすべて削除されます。\n" +
				"本当に削除しますか？"
			);
			
			if (!confirmed) return;
			
			await window.electronAPI.games.deleteWithRelatedEntries(currentGame.id);
		} else {
			const confirmed = confirm(`ゲーム「${currentGame.name}」を削除しますか？`);
			if (!confirmed) return;
			
			await window.electronAPI.games.delete(currentGame.id);
		}

		showSuccess(`ゲーム「${currentGame.name}」を削除しました`);
		
		// 自動選択を防止してゲーム一覧を再読み込み
		gameState.setPreventAutoSelection(true);
		const games = await loadGames();
		populateGameSelect(games);
		selectFirstGame(games);
		
	} catch (error) {
		console.error("Failed to delete game:", error);
		showError("ゲームの削除に失敗しました");
	}
}

// CSV エクスポート
export async function onExportGitCsv() {
	const exportBtn = document.getElementById("export-git-csv-btn");
	setButtonLoading(exportBtn, true, "エクスポート中...");
	
	try {
		const result = await window.electronAPI.csv.exportToGitCsv();
		if (result.success) {
			showSuccess(`CSVファイルをエクスポートしました（${result.files.length}ファイル）`);
		} else {
			showError("CSVエクスポートに失敗しました");
		}
	} catch (error) {
		console.error("Failed to export CSV:", error);
		showError("CSVエクスポートに失敗しました");
	} finally {
		setButtonLoading(exportBtn, false);
	}
}

// CSV インポート
export async function onImportCsv() {
	try {
		const result = await window.electronAPI.files.showOpenDialog({
			title: "CSVファイルを選択",
			filters: [{ name: "CSVファイル", extensions: ["csv"] }],
			properties: ["openFile"],
		});

		if (result.canceled) return;

		const filePath = result.filePaths[0];
		const importBtn = document.getElementById("import-csv-btn");
		setButtonLoading(importBtn, true, "インポート中...");

		try {
			await window.electronAPI.csv.importFromCsv(filePath);
			showSuccess("CSVファイルをインポートしました");
			
			// データを再読み込み
			await refreshAllData();
		} finally {
			setButtonLoading(importBtn, false);
		}
	} catch (error) {
		console.error("Failed to import CSV:", error);
		showError("CSVインポートに失敗しました");
	}
}

// IME インポート
export async function onImportIme() {
	const currentGame = gameState.getCurrentGame();
	if (!currentGame) {
		showError("インポート先のゲームを選択してください");
		return;
	}

	try {
		const result = await window.electronAPI.files.showOpenDialog({
			title: "IMEテキストファイルを選択",
			filters: [{ name: "テキストファイル", extensions: ["txt"] }],
			properties: ["openFile"],
		});

		if (result.canceled) return;

		const filePath = result.filePaths[0];
		const importBtn = DOM.importImeBtn;
		setButtonLoading(importBtn, true, "インポート中...");

		try {
			const importResult = await window.electronAPI.ime.importFromImeTxt(currentGame.id, filePath);
			
			if (importResult.errors && importResult.errors.length > 0) {
				showError(`インポートエラー: ${importResult.errors.join(", ")}`);
				return;
			}

			const message = `インポート完了: ${importResult.imported}個追加、${importResult.skipped}個スキップ`;
			showSuccess(message);
			
			// エントリーを再読み込み
			const entries = await loadEntries(currentGame.id);
			renderEntriesTable(entries);
			updateImeExportButtonState();
		} finally {
			setButtonLoading(importBtn, false);
		}
	} catch (error) {
		console.error("Failed to import IME:", error);
		showError("IMEインポートに失敗しました");
	}
}

// IME エクスポート
export async function onExportIme() {
	const currentGame = gameState.getCurrentGame();
	if (!currentGame) {
		showError("エクスポートするゲームを選択してください");
		return;
	}

	const exportBtn = DOM.exportImeBtn;
	setButtonLoading(exportBtn, true, "エクスポート中...");

	try {
		const result = await window.electronAPI.ime.exportToMicrosoftIme(currentGame.id);
		
		if (result.success) {
			showSuccess(`IME辞書ファイルをエクスポートしました: ${result.filePath}`);
		} else {
			showError("IMEエクスポートに失敗しました");
		}
	} catch (error) {
		console.error("Failed to export IME:", error);
		showError("IMEエクスポートに失敗しました");
	} finally {
		setButtonLoading(exportBtn, false);
	}
}

// エントリーテーブルのイベント処理
export function handleTableEvents(event) {
	const target = event.target;
	const row = target.closest("tr");
	
	if (target.classList.contains("edit-btn")) {
		const entryId = parseInt(row.dataset.entryId);
		startEditEntry(entryId);
	} else if (target.classList.contains("delete-btn")) {
		const entryId = parseInt(row.dataset.entryId);
		deleteEntry(entryId);
	}
}

// 全データの再読み込み
async function refreshAllData() {
	try {
		// カテゴリを再読み込み
		await loadCategories();
		populateCategorySelects();
		
		// ゲームを再読み込み
		const games = await loadGames();
		populateGameSelect(games);
		
		// 現在のゲームのエントリーを再読み込み
		const currentGame = gameState.getCurrentGame();
		if (currentGame) {
			const entries = await loadEntries(currentGame.id);
			renderEntriesTable(entries);
			updateImeExportButtonState();
		}
	} catch (error) {
		console.error("Failed to refresh data:", error);
		showError("データの再読み込みに失敗しました");
	}
}

// データ同期ダイアログのセットアップ
export function setupDataSyncHandlers() {
	// データ同期ダイアログの表示
	window.electronAPI.onShowDataSyncDialog((status) => {
		showDataSyncDialog(status);
	});

	// 終了同期ダイアログの表示
	window.electronAPI.onShowExitSyncDialog((status) => {
		showExitSyncDialog(status);
	});
}

// データ同期ダイアログ表示
function showDataSyncDialog(status) {
	// データ同期ダイアログの実装
	// 元のコードから移植
	console.log("Data sync dialog:", status);
}

// 終了同期ダイアログ表示
function showExitSyncDialog(status) {
	// 終了同期ダイアログの実装
	// 元のコードから移植
	console.log("Exit sync dialog:", status);
}