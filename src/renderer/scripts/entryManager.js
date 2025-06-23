/**
 * エントリー管理モジュール
 * エントリーのCRUD操作、バリデーション、自動保存機能
 */

import { gameState } from "./gameState.js";
import {
	addEntryToTable,
	createEditRow,
	DOM,
	populateCategorySelects,
	removeEntryFromTable,
	updateEntryInTable,
} from "./uiComponents.js";
import {
	getRowFormData,
	setButtonLoading,
	showError,
	showSuccess,
	validateEntryData,
} from "./utils.js";

// 自動保存のデバウンシング
let autoSaveTimeout = null;
const AUTO_SAVE_DELAY = 1000; // 1秒

// エントリー保存
export async function saveNewEntry(formData) {
	try {
		const validation = validateEntryData(formData);
		if (!validation.isValid) {
			showError(validation.errors.join("、"));
			return false;
		}

		const currentGame = gameState.getCurrentGame();
		if (!currentGame) {
			showError("ゲームが選択されていません");
			return false;
		}

		// 重複チェック
		if (
			gameState.isDuplicateEntry(
				formData.reading,
				formData.word,
				formData.category_id,
			)
		) {
			showError("同じ読み・単語・カテゴリの組み合わせが既に存在します");
			return false;
		}

		const entryData = {
			game_id: currentGame.id,
			category_id: parseInt(formData.category_id),
			reading: formData.reading,
			word: formData.word,
			description: formData.description || undefined,
		};

		const newEntry = await window.electronAPI.entries.create(entryData);

		// 状態とUIを更新
		gameState.addEntry(newEntry);
		gameState.setShouldSortEntries(false); // 新規追加後はソートしない
		addEntryToTable(newEntry);

		showSuccess(`「${newEntry.word}」を追加しました`);
		return true;
	} catch (error) {
		console.error("Failed to save entry:", error);
		showError("エントリーの保存に失敗しました");
		return false;
	}
}

// エントリー更新
export async function updateEntry(entryId, formData) {
	try {
		const validation = validateEntryData(formData);
		if (!validation.isValid) {
			showError(validation.errors.join("、"));
			return false;
		}

		// 重複チェック（自分自身は除外）
		if (
			gameState.isDuplicateEntry(
				formData.reading,
				formData.word,
				formData.category_id,
				entryId,
			)
		) {
			showError("同じ読み・単語・カテゴリの組み合わせが既に存在します");
			return false;
		}

		const updateData = {
			category_id: parseInt(formData.category_id),
			reading: formData.reading,
			word: formData.word,
			description: formData.description || undefined,
		};

		const updatedEntry = await window.electronAPI.entries.update(
			entryId,
			updateData,
		);

		// 状態とUIを更新
		gameState.updateEntry(entryId, updatedEntry);
		updateEntryInTable(entryId, updatedEntry);

		showSuccess(`「${updatedEntry.word}」を更新しました`);
		return true;
	} catch (error) {
		console.error("Failed to update entry:", error);
		showError("エントリーの更新に失敗しました");
		return false;
	}
}

// エントリー削除
export async function deleteEntry(entryId) {
	try {
		const entries = gameState.getCurrentEntries();
		const entry = entries.find((e) => e.id === entryId);
		if (!entry) {
			showError("エントリーが見つかりません");
			return false;
		}

		const confirmed = confirm(`「${entry.word}」を削除しますか？`);
		if (!confirmed) return false;

		await window.electronAPI.entries.delete(entryId);

		// 状態とUIを更新
		gameState.removeEntry(entryId);
		removeEntryFromTable(entryId);

		showSuccess(`「${entry.word}」を削除しました`);
		return true;
	} catch (error) {
		console.error("Failed to delete entry:", error);
		showError("エントリーの削除に失敗しました");
		return false;
	}
}

// 自動保存機能
export function attemptAutoSave(row, entryId = null) {
	// 既存のタイムアウトをクリア
	if (autoSaveTimeout) {
		clearTimeout(autoSaveTimeout);
	}

	autoSaveTimeout = setTimeout(async () => {
		try {
			const formData = getRowFormData(row);

			// 必須フィールドの簡単なチェック
			if (!formData.reading || !formData.word || !formData.category_id) {
				return; // 不完全なデータは保存しない
			}

			if (entryId) {
				// 更新
				await updateEntry(entryId, formData);

				// 編集行を通常行に戻す
				const entries = gameState.getCurrentEntries();
				const entry = entries.find((e) => e.id === entryId);
				if (entry) {
					updateEntryInTable(entryId, entry);
				}
			} else {
				// 新規作成
				const success = await saveNewEntry(formData);
				if (success) {
					// 新規エントリー行を削除
					row.remove();
					// 新しい入力行を追加
					addNewEntryRow();
				}
			}
		} catch (error) {
			console.error("Auto-save failed:", error);
		}
	}, AUTO_SAVE_DELAY);
}

// フォーカスアウト時の保存
export function attemptNavigationSave(row, entryId = null) {
	return new Promise((resolve) => {
		// 少し遅延させてフォーカスの移動先を確認
		setTimeout(async () => {
			const activeElement = document.activeElement;
			const isStillInRow = row.contains(activeElement);

			if (!isStillInRow) {
				try {
					const formData = getRowFormData(row);

					// データが入力されていない場合は削除
					if (!formData.reading && !formData.word) {
						if (row.classList.contains("new-entry-row")) {
							row.remove();
						} else if (row.classList.contains("edit-entry-row")) {
							// 編集をキャンセルして元の行に戻す
							const entries = gameState.getCurrentEntries();
							const entry = entries.find((e) => e.id === entryId);
							if (entry) {
								updateEntryInTable(entryId, entry);
							}
						}
						resolve();
						return;
					}

					// 必須フィールドのチェック
					if (!formData.reading || !formData.word || !formData.category_id) {
						resolve();
						return;
					}

					if (entryId) {
						// 更新
						const success = await updateEntry(entryId, formData);
						if (success) {
							const entries = gameState.getCurrentEntries();
							const entry = entries.find((e) => e.id === entryId);
							if (entry) {
								updateEntryInTable(entryId, entry);
							}
						}
					} else {
						// 新規作成
						const success = await saveNewEntry(formData);
						if (success) {
							row.remove();
						}
					}
				} catch (error) {
					console.error("Navigation save failed:", error);
				}
			}
			resolve();
		}, 150);
	});
}

// エントリー行のイベントリスナー設定
export function addAutoSaveListeners(row, entryId = null) {
	const inputs = row.querySelectorAll("input, select, textarea");

	inputs.forEach((input) => {
		// 入力時の自動保存
		input.addEventListener("input", () => {
			attemptAutoSave(row, entryId);
		});

		// フォーカスアウト時の保存
		input.addEventListener("blur", () => {
			attemptNavigationSave(row, entryId);
		});

		// Enterキーでの保存
		input.addEventListener("keydown", async (e) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();

				const formData = getRowFormData(row);
				const validation = validateEntryData(formData);

				if (!validation.isValid) {
					showError(validation.errors.join("、"));
					return;
				}

				if (entryId) {
					const success = await updateEntry(entryId, formData);
					if (success) {
						const entries = gameState.getCurrentEntries();
						const entry = entries.find((e) => e.id === entryId);
						if (entry) {
							updateEntryInTable(entryId, entry);
						}
					}
				} else {
					const success = await saveNewEntry(formData);
					if (success) {
						row.remove();
						addNewEntryRow();
					}
				}
			}
		});
	});

	// 保存ボタン
	const saveBtn = row.querySelector(".save-btn, .save-edit-btn");
	if (saveBtn) {
		saveBtn.addEventListener("click", async () => {
			setButtonLoading(saveBtn, true);

			try {
				const formData = getRowFormData(row);

				if (entryId) {
					const success = await updateEntry(entryId, formData);
					if (success) {
						const entries = gameState.getCurrentEntries();
						const entry = entries.find((e) => e.id === entryId);
						if (entry) {
							updateEntryInTable(entryId, entry);
						}
					}
				} else {
					const success = await saveNewEntry(formData);
					if (success) {
						row.remove();
						addNewEntryRow();
					}
				}
			} finally {
				setButtonLoading(saveBtn, false);
			}
		});
	}

	// キャンセルボタン
	const cancelBtn = row.querySelector(".cancel-btn, .cancel-edit-btn");
	if (cancelBtn) {
		cancelBtn.addEventListener("click", () => {
			if (row.classList.contains("new-entry-row")) {
				row.remove();
			} else if (row.classList.contains("edit-entry-row") && entryId) {
				// 編集をキャンセルして元の行に戻す
				const entries = gameState.getCurrentEntries();
				const entry = entries.find((e) => e.id === entryId);
				if (entry) {
					updateEntryInTable(entryId, entry);
				}
			}
		});
	}
}

// キーボードナビゲーション
export function addKeyboardNavigationListeners(row) {
	const inputs = row.querySelectorAll("input, select");

	inputs.forEach((input, index) => {
		input.addEventListener("keydown", (e) => {
			if (e.key === "Tab" && !e.shiftKey && index === inputs.length - 1) {
				// 最後のフィールドでTabを押した場合、新しい行を追加
				e.preventDefault();
				addNewEntryRow();
			} else if (e.key === "ArrowDown") {
				handleVerticalNavigation(input, "down");
			} else if (e.key === "ArrowUp") {
				handleVerticalNavigation(input, "up");
			}
		});
	});
}

// 垂直ナビゲーション処理
function handleVerticalNavigation(currentInput, direction) {
	const currentRow = currentInput.closest("tr");
	const currentCellIndex = Array.from(currentRow.children).indexOf(
		currentInput.closest("td"),
	);

	let targetRow;
	if (direction === "down") {
		targetRow = currentRow.nextElementSibling;
	} else {
		targetRow = currentRow.previousElementSibling;
	}

	if (targetRow) {
		const targetCell = targetRow.children[currentCellIndex];
		const targetInput = targetCell?.querySelector("input, select");
		if (targetInput) {
			targetInput.focus();
		}
	}
}

// エントリー編集の開始
export function startEditEntry(entryId) {
	const entries = gameState.getCurrentEntries();
	const entry = entries.find((e) => e.id === entryId);
	if (!entry) return;

	// 既存の編集行があれば削除
	const existingEditRow = DOM.entriesTableBody.querySelector(".edit-entry-row");
	if (existingEditRow) {
		const existingEntryId = existingEditRow.dataset.entryId;
		const existingEntry = entries.find((e) => e.id === existingEntryId);
		if (existingEntry) {
			updateEntryInTable(parseInt(existingEntryId), existingEntry);
		}
	}

	// 既存の新規エントリー行があれば削除
	const existingNewRow = DOM.entriesTableBody.querySelector(".new-entry-row");
	if (existingNewRow) {
		existingNewRow.remove();
	}

	// 編集行を作成
	const currentRow = DOM.entriesTableBody.querySelector(
		`tr[data-entry-id="${entryId}"]`,
	);
	if (currentRow) {
		const editRow = createEditRow(entry);
		currentRow.replaceWith(editRow);

		// カテゴリセレクトを更新
		populateCategorySelects();

		// イベントリスナーを追加
		addAutoSaveListeners(editRow, entryId);
		addKeyboardNavigationListeners(editRow);

		// 最初のインプットにフォーカス
		const firstInput = editRow.querySelector("input[name='reading']");
		if (firstInput) {
			firstInput.focus();
			firstInput.select();
		}
	}
}
