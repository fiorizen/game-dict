/**
 * ゲーム状態管理モジュール
 * アプリケーションの状態とデータ読み込みを管理
 */

import { CategoryLookup, DuplicateChecker, showError } from './utils.js';

// 状態管理クラス
class GameStateManager {
	constructor() {
		this.currentGame = null;
		this.currentEntries = [];
		this.allCategories = [];
		this.shouldSortEntries = true;
		this.preventAutoSelection = false;
		
		// パフォーマンス最適化用
		this.categoryLookup = new CategoryLookup();
		this.duplicateChecker = new DuplicateChecker();
	}

	// ゲーム状態
	setCurrentGame(game) {
		this.currentGame = game;
	}

	getCurrentGame() {
		return this.currentGame;
	}

	// エントリー状態
	setCurrentEntries(entries) {
		this.currentEntries = entries;
		this.duplicateChecker.buildFromEntries(entries);
	}

	getCurrentEntries() {
		return this.currentEntries;
	}

	addEntry(entry) {
		this.currentEntries.push(entry);
		this.duplicateChecker.addEntry(entry.reading, entry.word, entry.category_id);
	}

	removeEntry(entryId) {
		const index = this.currentEntries.findIndex(e => e.id === entryId);
		if (index !== -1) {
			const entry = this.currentEntries[index];
			this.duplicateChecker.removeEntry(entry.reading, entry.word, entry.category_id);
			this.currentEntries.splice(index, 1);
		}
	}

	updateEntry(entryId, updatedData) {
		const index = this.currentEntries.findIndex(e => e.id === entryId);
		if (index !== -1) {
			const oldEntry = this.currentEntries[index];
			this.duplicateChecker.removeEntry(oldEntry.reading, oldEntry.word, oldEntry.category_id);
			
			this.currentEntries[index] = { ...oldEntry, ...updatedData };
			const newEntry = this.currentEntries[index];
			this.duplicateChecker.addEntry(newEntry.reading, newEntry.word, newEntry.category_id);
		}
	}

	// カテゴリ状態
	setAllCategories(categories) {
		this.allCategories = categories;
		this.categoryLookup.buildFromCategories(categories);
	}

	getAllCategories() {
		return this.allCategories;
	}

	getCategoryById(id) {
		return this.categoryLookup.getCategory(id);
	}

	// 重複チェック
	isDuplicateEntry(reading, word, categoryId, excludeEntryId = null) {
		if (excludeEntryId) {
			// 編集時は該当エントリーを除外してチェック
			return this.currentEntries.some(entry => 
				entry.id !== excludeEntryId &&
				entry.reading === reading &&
				entry.word === word &&
				entry.category_id === parseInt(categoryId)
			);
		}
		return this.duplicateChecker.isDuplicate(reading, word, parseInt(categoryId));
	}

	// ソート設定
	setShouldSortEntries(should) {
		this.shouldSortEntries = should;
	}

	getShouldSortEntries() {
		return this.shouldSortEntries;
	}

	// 自動選択防止フラグ
	setPreventAutoSelection(prevent) {
		this.preventAutoSelection = prevent;
	}

	getPreventAutoSelection() {
		return this.preventAutoSelection;
	}

	// 状態リセット
	reset() {
		this.currentGame = null;
		this.currentEntries = [];
		this.shouldSortEntries = true;
		this.preventAutoSelection = false;
		this.duplicateChecker.buildFromEntries([]);
	}
}

// シングルトンインスタンス
const gameState = new GameStateManager();

// データ読み込み関数
export async function loadGames() {
	try {
		const games = await window.electronAPI.games.getAll();
		return games;
	} catch (error) {
		console.error("Failed to load games:", error);
		showError("ゲーム一覧の読み込みに失敗しました");
		return [];
	}
}

export async function loadCategories() {
	try {
		const categories = await window.electronAPI.categories.getAll();
		gameState.setAllCategories(categories);
		return categories;
	} catch (error) {
		console.error("Failed to load categories:", error);
		showError("カテゴリ一覧の読み込みに失敗しました");
		return [];
	}
}

export async function loadEntries(gameId) {
	if (!gameId) {
		gameState.setCurrentEntries([]);
		return [];
	}

	try {
		const entries = gameState.getShouldSortEntries()
			? await window.electronAPI.entries.getByGameId(gameId)
			: await window.electronAPI.entries.getByGameIdUnsorted(gameId);
		
		gameState.setCurrentEntries(entries);
		return entries;
	} catch (error) {
		console.error("Failed to load entries:", error);
		showError("エントリー一覧の読み込みに失敗しました");
		gameState.setCurrentEntries([]);
		return [];
	}
}

// ゲーム状態管理のエクスポート
export { gameState };