/**
 * UI コンポーネントモジュール
 * DOM操作、テーブル描画、モーダル管理などのUI関連機能
 */

import { gameState } from './gameState.js';
import { escapeHtml } from './utils.js';

// DOM要素のキャッシュ
export const DOM = {
	gameSelect: document.getElementById("game-select"),
	currentGameTitle: document.getElementById("current-game-title"),
	addGameBtn: document.getElementById("add-game-btn"),
	editGameBtn: document.getElementById("edit-game-btn"),
	deleteGameBtn: document.getElementById("delete-game-btn"),
	addEntryBtn: document.getElementById("add-entry-btn"),
	entriesTableContainer: document.getElementById("entries-table-container"),
	entriesTableBody: document.getElementById("entries-table-body"),
	noEntriesMessage: document.getElementById("no-entries-message"),
	gameModal: document.getElementById("game-modal"),
	gameForm: document.getElementById("game-form"),
	exportImeBtn: document.getElementById("export-ime-btn"),
	importImeBtn: document.getElementById("import-ime-btn")
};

// ゲーム選択UI更新
export function populateGameSelect(games) {
	const gameSelect = DOM.gameSelect;
	gameSelect.innerHTML = '<option value="">ゲームを選択してください</option>';
	
	games.forEach((game) => {
		const option = document.createElement("option");
		option.value = game.id;
		option.textContent = game.name;
		gameSelect.appendChild(option);
	});
}

export function selectFirstGame(games) {
	if (games.length > 0 && !gameState.getPreventAutoSelection()) {
		DOM.gameSelect.value = games[0].id;
		DOM.gameSelect.dispatchEvent(new Event("change"));
	}
	gameState.setPreventAutoSelection(false);
}

// カテゴリ選択UI更新
export function populateCategorySelects() {
	const categories = gameState.getAllCategories();
	const selects = document.querySelectorAll("select[name='category_id']");
	
	selects.forEach((select) => {
		const currentValue = select.value;
		select.innerHTML = "";
		
		categories.forEach((category) => {
			const option = document.createElement("option");
			option.value = category.id;
			option.textContent = category.name;
			if (category.id == currentValue) {
				option.selected = true;
			}
			select.appendChild(option);
		});
	});
}

// エントリーテーブル描画の最適化
export function renderEntriesTable(entries) {
	const tableBody = DOM.entriesTableBody;
	const noEntriesMessage = DOM.noEntriesMessage;
	
	if (!entries || entries.length === 0) {
		tableBody.innerHTML = "";
		noEntriesMessage.style.display = "block";
		return;
	}

	noEntriesMessage.style.display = "none";
	
	// 既存の行をクリア
	tableBody.innerHTML = "";
	
	// DocumentFragmentを使用してパフォーマンスを向上
	const fragment = document.createDocumentFragment();
	
	entries.forEach((entry) => {
		const row = createEntryRow(entry);
		fragment.appendChild(row);
	});
	
	tableBody.appendChild(fragment);
}

// エントリー行作成（最適化済み）
export function createEntryRow(entry) {
	const category = gameState.getCategoryById(entry.category_id);
	const row = document.createElement("tr");
	row.dataset.entryId = entry.id;
	
	row.innerHTML = `
		<td class="category-cell">${escapeHtml(category?.name || "")}</td>
		<td class="reading-cell">${escapeHtml(entry.reading)}</td>
		<td class="word-cell">${escapeHtml(entry.word)}</td>
		<td class="description-cell">${escapeHtml(entry.description || "")}</td>
		<td class="actions-cell">
			<button type="button" class="btn btn-sm btn-outline edit-btn">編集</button>
			<button type="button" class="btn btn-sm btn-outline btn-danger delete-btn">削除</button>
		</td>
	`;
	
	return row;
}

// 新しいエントリー行作成（最適化済み）
export function createNewEntryRow() {
	const categories = gameState.getAllCategories();
	const row = document.createElement("tr");
	row.className = "new-entry-row";
	
	// カテゴリオプション作成
	const categoryOptions = categories.map(category => 
		`<option value="${category.id}"${category.name === "名詞" ? " selected" : ""}>${escapeHtml(category.name)}</option>`
	).join("");
	
	row.innerHTML = `
		<td class="category-cell">
			<select name="category_id" class="form-control form-control-sm" required>
				${categoryOptions}
			</select>
		</td>
		<td class="reading-cell">
			<input type="text" name="reading" class="form-control form-control-sm" 
				   placeholder="読み" required autocomplete="off">
		</td>
		<td class="word-cell">
			<input type="text" name="word" class="form-control form-control-sm" 
				   placeholder="単語" required autocomplete="off">
		</td>
		<td class="description-cell">
			<input type="text" name="description" class="form-control form-control-sm" 
				   placeholder="説明（任意）" autocomplete="off">
		</td>
		<td class="actions-cell">
			<button type="button" class="btn btn-sm btn-primary save-btn">保存</button>
			<button type="button" class="btn btn-sm btn-outline cancel-btn">キャンセル</button>
		</td>
	`;
	
	return row;
}

// インライン編集行作成
export function createEditRow(entry) {
	const categories = gameState.getAllCategories();
	const category = gameState.getCategoryById(entry.category_id);
	const row = document.createElement("tr");
	row.className = "edit-entry-row";
	row.dataset.entryId = entry.id;
	
	// カテゴリオプション作成
	const categoryOptions = categories.map(cat => 
		`<option value="${cat.id}"${cat.id === entry.category_id ? " selected" : ""}>${escapeHtml(cat.name)}</option>`
	).join("");
	
	row.innerHTML = `
		<td class="category-cell">
			<select name="category_id" class="form-control form-control-sm" required>
				${categoryOptions}
			</select>
		</td>
		<td class="reading-cell">
			<input type="text" name="reading" class="form-control form-control-sm" 
				   value="${escapeHtml(entry.reading)}" required autocomplete="off">
		</td>
		<td class="word-cell">
			<input type="text" name="word" class="form-control form-control-sm" 
				   value="${escapeHtml(entry.word)}" required autocomplete="off">
		</td>
		<td class="description-cell">
			<input type="text" name="description" class="form-control form-control-sm" 
				   value="${escapeHtml(entry.description || "")}" autocomplete="off">
		</td>
		<td class="actions-cell">
			<button type="button" class="btn btn-sm btn-primary save-edit-btn">保存</button>
			<button type="button" class="btn btn-sm btn-outline cancel-edit-btn">キャンセル</button>
		</td>
	`;
	
	return row;
}

// 新しいエントリー行を追加
export function addNewEntryRow() {
	// 既存の新規エントリー行や編集行をチェック
	const existingNewRow = DOM.entriesTableBody.querySelector(".new-entry-row");
	const existingEditRow = DOM.entriesTableBody.querySelector(".edit-entry-row");
	
	if (existingNewRow || existingEditRow) {
		return; // 既に入力行が存在する場合は何もしない
	}

	const newRow = createNewEntryRow();
	DOM.entriesTableBody.insertBefore(newRow, DOM.entriesTableBody.firstChild);
	
	// 最初の入力フィールドにフォーカス
	const firstInput = newRow.querySelector("input[name='reading']");
	if (firstInput) {
		firstInput.focus();
	}
}

// モーダル管理
export function openGameModal(game = null) {
	const modal = DOM.gameModal;
	const form = DOM.gameForm;
	const titleElement = modal.querySelector(".modal-title");
	
	if (game) {
		titleElement.textContent = "ゲーム編集";
		form.elements.game_name.value = game.name;
		form.elements.game_code.value = game.code;
		form.dataset.gameId = game.id;
	} else {
		titleElement.textContent = "新しいゲーム追加";
		form.reset();
		delete form.dataset.gameId;
	}
	
	modal.style.display = "block";
	setTimeout(() => form.elements.game_name.focus(), 100);
}

export function closeModals() {
	document.querySelectorAll(".modal").forEach((modal) => {
		modal.style.display = "none";
	});
}

// IME出力ボタンの状態更新
export function updateImeExportButtonState() {
	const currentGame = gameState.getCurrentGame();
	const currentEntries = gameState.getCurrentEntries();
	const exportBtn = DOM.exportImeBtn;
	
	if (exportBtn) {
		exportBtn.disabled = !currentGame || !currentEntries || currentEntries.length === 0;
	}
}

// インクリメンタル更新のためのユーティリティ
export function addEntryToTable(entry) {
	const newRow = createEntryRow(entry);
	const tableBody = DOM.entriesTableBody;
	
	// ソートが有効な場合は適切な位置に挿入
	if (gameState.getShouldSortEntries()) {
		let insertPosition = null;
		const rows = tableBody.querySelectorAll("tr:not(.new-entry-row):not(.edit-entry-row)");
		
		for (const row of rows) {
			const rowReading = row.querySelector(".reading-cell").textContent;
			if (entry.reading < rowReading) {
				insertPosition = row;
				break;
			}
		}
		
		if (insertPosition) {
			tableBody.insertBefore(newRow, insertPosition);
		} else {
			tableBody.appendChild(newRow);
		}
	} else {
		// 新規追加の場合は先頭に追加
		const firstRow = tableBody.querySelector("tr:not(.new-entry-row):not(.edit-entry-row)");
		if (firstRow) {
			tableBody.insertBefore(newRow, firstRow);
		} else {
			tableBody.appendChild(newRow);
		}
	}
	
	// no-entries メッセージを非表示
	DOM.noEntriesMessage.style.display = "none";
}

export function removeEntryFromTable(entryId) {
	const row = DOM.entriesTableBody.querySelector(`tr[data-entry-id="${entryId}"]`);
	if (row) {
		row.remove();
	}
	
	// エントリーがなくなった場合はメッセージを表示
	const remainingRows = DOM.entriesTableBody.querySelectorAll("tr:not(.new-entry-row):not(.edit-entry-row)");
	if (remainingRows.length === 0) {
		DOM.noEntriesMessage.style.display = "block";
	}
}

export function updateEntryInTable(entryId, updatedEntry) {
	const row = DOM.entriesTableBody.querySelector(`tr[data-entry-id="${entryId}"]`);
	if (row) {
		const newRow = createEntryRow(updatedEntry);
		newRow.dataset.entryId = entryId;
		row.replaceWith(newRow);
	}
}