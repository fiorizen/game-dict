// Global state
let currentGame = null;
let currentEntries = [];
let allCategories = [];
let shouldSortEntries = true; // Track if entries should be sorted (false after adding new entry)
let preventAutoSelection = false; // Flag to prevent auto-selection after game deletion
let lastSelectedCategoryId = null; // 最後に選択されたカテゴリID（起動中のみ保持）

// DOM elements
const gameSelect = document.getElementById("game-select");
const currentGameTitle = document.getElementById("current-game-title");
const addGameBtn = document.getElementById("add-game-btn");
const _editGameBtn = document.getElementById("edit-game-btn");
const _deleteGameBtn = document.getElementById("delete-game-btn");
const addEntryBtn = document.getElementById("add-entry-btn");
const entriesTableContainer = document.getElementById(
	"entries-table-container",
);
const entriesTableBody = document.getElementById("entries-table-body");
const noEntriesMessage = document.getElementById("no-entries-message");

// リファクタリング：フィルター機能の変数
const filterInput = document.getElementById("filter-input");
let currentFilterQuery = "";

// Modal elements
const gameModal = document.getElementById("game-modal");
const gameForm = document.getElementById("game-form");

// Initialize app
document.addEventListener("DOMContentLoaded", async () => {
	// Reset sort flag on app startup
	shouldSortEntries = true;
	await loadGames();
	await loadCategories();
	setupEventListeners();
	setupDataSyncHandlers();
});

// Event listeners
function setupEventListeners() {
	// Game selection
	gameSelect.addEventListener("change", onGameChange);
	addGameBtn.addEventListener("click", () => openGameModal());
	document
		.getElementById("edit-game-btn")
		.addEventListener("click", onEditGame);
	document
		.getElementById("delete-game-btn")
		.addEventListener("click", onDeleteGame);

	// Auto-generate game code from name
	document
		.getElementById("game-name")
		.addEventListener("input", onGameNameInput);

	// Entry management - add entry is always inline now
	addEntryBtn.addEventListener("click", addNewEntryRow);

	// CSV operations
	document
		.getElementById("export-git-csv-btn")
		.addEventListener("click", onExportGitCsv);
	document
		.getElementById("import-csv-btn")
		.addEventListener("click", onImportCsv);

	// IME operations
	document
		.getElementById("import-ime-btn")
		.addEventListener("click", onImportIme);
	document
		.getElementById("export-ime-btn")
		.addEventListener("click", onExportIme);
	document
		.getElementById("export-all-games-btn")
		.addEventListener("click", onExportAllGames);

	// Modal handling
	setupModalHandlers();

	// Keyboard shortcuts
	setupKeyboardShortcuts();

	// リファクタリング：フィルター機能のセットアップ
	setupFilterHandlers();

	// Form submission
	gameForm.addEventListener("submit", onGameSubmit);
}

function setupModalHandlers() {
	// Close modal when clicking close button or outside
	document.querySelectorAll(".modal-close").forEach((btn) => {
		btn.addEventListener("click", closeModals);
	});

	document.querySelectorAll(".modal").forEach((modal) => {
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				closeModals();
			}
		});
	});

	// Cancel buttons
	document
		.getElementById("cancel-game-btn")
		.addEventListener("click", closeModals);

	// Delete game modal buttons
	document
		.getElementById("cancel-delete-game-btn")
		.addEventListener("click", closeModals);
	document
		.getElementById("confirm-delete-game-btn")
		.addEventListener("click", onConfirmDeleteGame);
}

// リファクタリング：フィルター機能のイベントハンドラー
function setupFilterHandlers() {
	if (!filterInput) return;

	filterInput.addEventListener("input", () => {
		currentFilterQuery = filterInput.value.trim();
		applyWordFilter();
	});
}

// リファクタリング：フィルター適用ロジックを関数として抽出
function applyWordFilter() {
	const rows = document.querySelectorAll("#entries-table-body tr");

	rows.forEach((row) => {
		if (row.classList.contains("new-entry")) return; // 新規追加行は無視

		if (!currentFilterQuery) {
			row.style.display = "";
		} else {
			// 三角測量：複数フィールドでの検索（将来の拡張に備える）
			if (matchesFilterQuery(row, currentFilterQuery)) {
				row.style.display = "";
			} else {
				row.style.display = "none";
			}
		}
	});
}

// リファクタリング：マッチング条件を関数として抽出（三角測量で一般化）
function matchesFilterQuery(row, query) {
	if (!query) return true;

	const lowerQuery = query.toLowerCase();

	// 読み列と単語列の両方を検索対象に（三角測量で一般化）
	const readingCell = row.cells[0]; // 読み列
	const wordCell = row.cells[1]; // 単語列

	// 読みでマッチ
	if (readingCell?.textContent.toLowerCase().includes(lowerQuery)) {
		return true;
	}

	// 単語でマッチ
	if (wordCell?.textContent.toLowerCase().includes(lowerQuery)) {
		return true;
	}

	return false;
}

// リファクタリング：フィルター入力にフォーカスする関数
function focusFilterInput() {
	// 現在編集中のエントリがあれば、フォーカス移動前に自動保存を試行
	const editingNewRow = document.querySelector("tr.new-entry");
	if (editingNewRow) {
		attemptAutoSave(editingNewRow);
	}

	const editingExistingRow = document.querySelector("tr.editing");
	if (editingExistingRow) {
		attemptNavigationSave(editingExistingRow);
	}

	if (filterInput) {
		filterInput.focus();
		filterInput.select(); // 全選択でユーザビリティ向上
	}
}

// リファクタリング：フィルターをクリアする関数
function clearFilter() {
	if (filterInput) {
		filterInput.value = "";
		currentFilterQuery = "";
		applyWordFilter();
	}
}

// フォーカス解除関数（Cmd+E）
function clearCurrentFocus() {
	const activeElement = document.activeElement;

	// body以外にフォーカスがある場合のみ処理
	if (activeElement && activeElement !== document.body) {
		activeElement.blur();

		// エントリ編集中の場合は自動保存を試行
		const editingRow = activeElement.closest("tr.new-entry, tr.editing");
		if (editingRow) {
			if (editingRow.classList.contains("new-entry")) {
				attemptAutoSave(editingRow);
			} else if (editingRow.classList.contains("editing")) {
				// 編集中の行については、ナビゲーション保存を試行
				attemptNavigationSave(editingRow);
			}
		}
	}
}

// ワード追加ショートカット処理（Cmd+N）
function handleAddEntryShortcut() {
	// 現在編集中の新規エントリ行があれば自動保存を試行
	const editingNewRow = document.querySelector("tr.new-entry");
	if (editingNewRow) {
		attemptAutoSave(editingNewRow);
	}

	// 編集中の既存エントリがあれば保存を試行
	const editingExistingRow = document.querySelector("tr.editing");
	if (editingExistingRow) {
		attemptNavigationSave(editingExistingRow);
	}

	// 検索フィルターをクリア（新規追加にフォーカスするため）
	clearFilter();

	// 新規エントリ追加を実行
	addEntryBtn.click();
}

// Keyboard shortcuts setup
function setupKeyboardShortcuts() {
	document.addEventListener("keydown", (event) => {
		// Skip if IME is composing
		if (event.isComposing) return;

		const activeElement = document.activeElement;
		const isInModal = activeElement?.closest(".modal");

		// Additional modal check: if any modal is visible, skip all shortcuts
		const visibleModals = document.querySelectorAll(
			'.modal[style*="block"], .modal:not([style*="none"])',
		);
		const hasVisibleModal = Array.from(visibleModals).some(
			(modal) =>
				modal.style.display !== "none" &&
				window.getComputedStyle(modal).display !== "none",
		);

		// Skip all shortcuts if inside modal or modal is visible
		if (isInModal || hasVisibleModal) return;

		// Global shortcuts (work everywhere, including input fields)

		// Command+F: Focus filter input (works everywhere)
		if ((event.metaKey || event.ctrlKey) && event.key === "f") {
			event.preventDefault();
			focusFilterInput();
			return;
		}

		// Command/Ctrl + N: Add new word (works everywhere)
		if ((event.metaKey || event.ctrlKey) && event.key === "n") {
			event.preventDefault();

			// Only work if a game is selected
			if (!currentGame) {
				showError("ゲームを選択してから単語を追加してください");
				return;
			}

			// Trigger add entry with autosave support
			handleAddEntryShortcut();
			return;
		}

		// Command/Ctrl + E: Clear focus (works everywhere)
		if ((event.metaKey || event.ctrlKey) && event.key === "e") {
			event.preventDefault();
			clearCurrentFocus();
			return;
		}

		// Context-dependent shortcuts (only work outside input fields)
		const isInInput =
			activeElement &&
			(activeElement.tagName === "INPUT" ||
				activeElement.tagName === "TEXTAREA" ||
				activeElement.tagName === "SELECT" ||
				activeElement.contentEditable === "true");

		// Skip context-dependent shortcuts if in input field
		if (isInInput) return;

		// Command/Ctrl + D: Delete selected/editing entry (context-dependent)
		if ((event.metaKey || event.ctrlKey) && event.key === "d") {
			event.preventDefault();

			// Find currently editing entry
			const editingRow = document.querySelector("tr.editing");
			if (editingRow) {
				const entryId = parseInt(editingRow.dataset.entryId);
				if (entryId) {
					deleteEntry(entryId);
					return;
				}
			}

			// If no editing entry, find selected entry (first in table)
			const firstEntryRow = document.querySelector(
				"#entries-table-body tr:not(.new-entry)",
			);
			if (firstEntryRow) {
				const entryId = parseInt(firstEntryRow.dataset.entryId);
				if (entryId) {
					deleteEntry(entryId);
					return;
				}
			}

			showError("削除する単語が見つかりません");
			return;
		}
	});
}

// Data loading functions
async function loadGames() {
	try {
		const games = await window.electronAPI.games.getAll();
		populateGameSelect(games || []);
	} catch (error) {
		console.error("Failed to load games:", error);
		// Don't show error for empty data on initial load
		populateGameSelect([]);
	}
}

async function loadCategories() {
	try {
		allCategories = await window.electronAPI.categories.getAll();
		populateCategorySelects();
	} catch (error) {
		console.error("Failed to load categories:", error);
		// Don't show error for empty data on initial load
		allCategories = [];
		populateCategorySelects();
	}
}

async function loadEntries(gameId) {
	try {
		// Use sorted or unsorted data based on current state
		if (shouldSortEntries) {
			currentEntries = await window.electronAPI.entries.getByGameId(gameId);
		} else {
			currentEntries =
				await window.electronAPI.entries.getByGameIdUnsorted(gameId);
		}
		renderEntriesTable(currentEntries || []);
		updateImeExportButtonState();
	} catch (error) {
		console.error("Failed to load entries:", error);
		// Don't show error for empty data - just show empty state
		currentEntries = [];
		renderEntriesTable([]);
		updateImeExportButtonState();
	}
}

// UI population functions
function populateGameSelect(games) {
	gameSelect.innerHTML = '<option value="">ゲームを選択...</option>';
	games.forEach((game) => {
		const option = document.createElement("option");
		option.value = game.id;
		option.textContent = game.name;
		gameSelect.appendChild(option);
	});

	// Auto-select first game if available and no game is currently selected
	// Don't auto-select if we're preventing auto-selection (e.g., after deletion)
	if (games.length > 0 && !currentGame && !preventAutoSelection) {
		selectFirstGame(games);
	}
}

// Select first game automatically
async function selectFirstGame(games) {
	if (games.length === 0) return;

	const firstGame = games[0];
	gameSelect.value = firstGame.id.toString();
	await onGameChange();
}

function populateCategorySelects() {
	// No longer needed for modal, but keep function for potential future use
}

// Event handlers
async function onGameChange() {
	// リファクタリング：ゲーム切り替えでフィルターリセット
	clearFilter();

	const gameId = parseInt(gameSelect.value);
	if (gameId) {
		currentGame = gameId;
		const games = await window.electronAPI.games.getAll();
		const selectedGame = games.find((g) => g.id === gameId);
		currentGameTitle.textContent = selectedGame
			? selectedGame.name
			: "Unknown Game";
		addEntryBtn.disabled = false;
		document.getElementById("edit-game-btn").disabled = false;
		document.getElementById("delete-game-btn").disabled = false;
		document.getElementById("import-ime-btn").disabled = false;
		// Reset sort flag when changing games (should sort on game change)
		shouldSortEntries = true;
		await loadEntries(gameId);
	} else {
		currentGame = null;
		currentGameTitle.textContent = "ゲームを選択してください";
		addEntryBtn.disabled = true;
		document.getElementById("edit-game-btn").disabled = true;
		document.getElementById("delete-game-btn").disabled = true;
		document.getElementById("import-ime-btn").disabled = true;
		document.getElementById("export-ime-btn").disabled = true;
		renderEntriesTable([]);
	}
}

// Modal functions
function openGameModal(game = null) {
	const title = document.getElementById("game-modal-title");
	const nameInput = document.getElementById("game-name");
	const codeInput = document.getElementById("game-code");

	if (game) {
		title.textContent = "ゲーム編集";
		nameInput.value = game.name;
		codeInput.value = game.code;
		gameForm.dataset.gameId = game.id;
	} else {
		title.textContent = "ゲーム追加";
		nameInput.value = "";
		codeInput.value = "";
		delete gameForm.dataset.gameId;
	}

	gameModal.style.display = "flex";
	nameInput.focus();
}

function closeModals() {
	gameModal.style.display = "none";

	// Close delete game modal if it exists
	const deleteGameModal = document.getElementById("delete-game-modal");
	if (deleteGameModal) {
		deleteGameModal.style.display = "none";
	}
}

// Auto-generate game code from name
function onGameNameInput(e) {
	const name = e.target.value;
	const codeInput = document.getElementById("game-code");

	// Only auto-generate if code field is empty or if we're creating a new game (so user can override)
	if (!codeInput.value.trim() || !gameForm.dataset.gameId) {
		const suggestedCode = generateGameCodeFromName(name);
		codeInput.value = suggestedCode;
	}
}

// Generate game code from name (client-side version)
function generateGameCodeFromName(name) {
	if (!name) return "";

	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "")
		.substring(0, 16);
}

// Form submission handlers
async function onGameSubmit(e) {
	e.preventDefault();

	const name = document.getElementById("game-name").value.trim();
	const code = document.getElementById("game-code").value.trim();

	if (!name || !code) return;

	// Validate code format
	if (!/^[a-zA-Z0-9]+$/.test(code)) {
		showToast("ゲームコードは英数字のみ使用できます", "error");
		return;
	}

	if (code.length > 16) {
		showToast("ゲームコードは16文字以下で入力してください", "error");
		return;
	}

	try {
		const gameId = gameForm.dataset.gameId;
		let newGameId;

		if (gameId) {
			await window.electronAPI.games.update(parseInt(gameId), { name, code });
			newGameId = parseInt(gameId);
		} else {
			const result = await window.electronAPI.games.create({ name, code });
			newGameId = result.id;
		}

		// Close modal first to ensure proper UI state
		closeModals();

		// Reload games list
		await loadGames();

		// Auto-select the newly created/updated game
		if (newGameId) {
			gameSelect.value = newGameId.toString();
			await onGameChange();
		}

		showSuccess(gameId ? "ゲームを更新しました" : "ゲームを追加しました");
	} catch (error) {
		console.error("Failed to save game:", error);
		showError("ゲームの保存に失敗しました");
	}
}

// Add new entry row function
function addNewEntryRow() {
	// Check if there's already a new entry row
	const existingNewRow = entriesTableBody.querySelector(
		'tr[data-is-new="true"]',
	);
	if (existingNewRow) {
		// Focus on the existing new row's reading input
		const readingInput = existingNewRow.querySelector('input[name="reading"]');
		if (readingInput) readingInput.focus();
		return;
	}

	// Add new entry row at the bottom
	const newRow = createNewEntryRow();
	entriesTableBody.appendChild(newRow);
}

function renderEntriesTable(entries) {
	if (!entriesTableBody) return;

	entriesTableBody.innerHTML = "";

	// Show/hide no entries message
	if (!currentGame) {
		noEntriesMessage.style.display = "block";
		entriesTableContainer.querySelector("table").style.display = "none";
		return;
	} else {
		noEntriesMessage.style.display = "none";
		entriesTableContainer.querySelector("table").style.display = "table";
	}

	// Render existing entries
	entries.forEach((entry) => {
		const row = createEntryRow(entry);
		entriesTableBody.appendChild(row);
	});

	// Always add new entry row at the bottom when game is selected
	const newRow = createNewEntryRow();
	entriesTableBody.appendChild(newRow);

	// Apply current filter to maintain filtering state after table re-rendering
	applyWordFilter();
}

function createEntryRow(entry) {
	const row = document.createElement("tr");
	row.dataset.entryId = entry.id;

	const category = allCategories.find((c) => c.id === entry.category_id);
	const categoryName = category ? category.name : "名詞";

	row.innerHTML = `
		<td><span class="entry-value">${escapeHtml(entry.reading)}</span></td>
		<td><span class="entry-value">${escapeHtml(entry.word)}</span></td>
		<td><span class="entry-value">${escapeHtml(categoryName)}</span></td>
		<td><span class="entry-value">${escapeHtml(entry.description || "")}</span></td>
		<td class="entry-actions-inline">
			<button class="btn btn-secondary" onclick="editEntryInline(${entry.id})">編集</button>
			<button class="btn btn-secondary" onclick="deleteEntry(${entry.id})">削除</button>
		</td>
	`;

	return row;
}

function createNewEntryRow() {
	const row = document.createElement("tr");
	row.className = "new-entry";
	row.dataset.isNew = "true";

	// 最後に選択されたカテゴリID、なければ「名詞」をデフォルトに
	const defaultCategoryId =
		lastSelectedCategoryId || allCategories.find((c) => c.name === "名詞")?.id;
	console.log(
		"[DEBUG main.js] 最後に選択されたカテゴリID:",
		lastSelectedCategoryId,
	);
	console.log("[DEBUG main.js] デフォルトカテゴリID:", defaultCategoryId);

	const categoryOptions = allCategories
		.map(
			(cat) =>
				`<option value="${cat.id}" ${cat.id === defaultCategoryId ? "selected" : ""}>${escapeHtml(cat.name)}</option>`,
		)
		.join("");

	row.innerHTML = `
		<td><input type="text" class="entry-input" name="reading" placeholder="よみ" required></td>
		<td><input type="text" class="entry-input" name="word" placeholder="単語" required></td>
		<td>
			<select class="entry-select" name="category" required>
				<option value="">選択...</option>
				${categoryOptions}
			</select>
		</td>
		<td><input type="text" class="entry-input" name="description" placeholder="説明（任意）"></td>
		<td class="entry-actions-inline">
			<button class="btn btn-primary" onclick="saveNewEntry(this)">保存</button>
			<button class="btn btn-secondary" onclick="clearNewEntry(this)">クリア</button>
		</td>
	`;

	// Add auto-save on focusout for the entire row
	addAutoSaveListeners(row);

	// Add keyboard navigation listeners
	addKeyboardNavigationListeners(row);

	// Focus on reading input
	setTimeout(() => {
		const readingInput = row.querySelector('input[name="reading"]');
		if (readingInput) readingInput.focus();
	}, 100);

	return row;
}

function addAutoSaveListeners(row) {
	const inputs = row.querySelectorAll("input, select");
	let saveTimeout;

	inputs.forEach((input) => {
		input.addEventListener("blur", () => {
			// Clear any existing timeout
			if (saveTimeout) {
				clearTimeout(saveTimeout);
			}

			// Set a short delay to allow other focusout events to complete
			// Use shorter delay for description field (last field)
			const isDescriptionField = input.name === "description";
			const delay = isDescriptionField ? 300 : 200;

			saveTimeout = setTimeout(() => {
				attemptAutoSave(row);
			}, delay);
		});

		// Cancel auto-save if user focuses back into input fields (but not buttons)
		input.addEventListener("focus", () => {
			if (saveTimeout) {
				clearTimeout(saveTimeout);
				saveTimeout = null;
			}
		});

		// Special handling for description field - trigger save on Enter key
		if (input.name === "description") {
			input.addEventListener("keydown", (e) => {
				// IME変換確定のEnterで誤って保存しない
				if (e.isComposing) return;
				if (e.key === "Enter") {
					e.preventDefault();
					// Clear timeout and immediately save
					if (saveTimeout) {
						clearTimeout(saveTimeout);
					}
					attemptAutoSave(row);
				}
			});
		}
	});

	// Add focusout listener to the entire row to catch any remaining cases
	row.addEventListener("focusout", (_e) => {
		// Only handle if the new focus target is completely outside the row
		setTimeout(() => {
			const activeElement = document.activeElement;
			const isStillInRow = row.contains(activeElement);

			if (!isStillInRow) {
				// Clear any existing timeout and save immediately
				if (saveTimeout) {
					clearTimeout(saveTimeout);
				}
				attemptAutoSave(row);
			}
		}, 100);
	});
}

// Keyboard navigation for entry rows
function addKeyboardNavigationListeners(row) {
	const inputs = row.querySelectorAll("input, select");

	inputs.forEach((input) => {
		input.addEventListener("keydown", (e) => {
			// Skip if IME is composing
			if (e.isComposing) return;

			if (e.key === "ArrowUp" || e.key === "ArrowDown") {
				e.preventDefault();
				handleVerticalNavigation(row, e.key === "ArrowDown");
			}
		});
	});
}

// Handle vertical navigation (↑↓ keys)
async function handleVerticalNavigation(currentRow, isDownward) {
	// First attempt to save current row
	const saveResult = await attemptNavigationSave(currentRow);

	// If save failed (validation error), stay in current row
	if (saveResult === false) {
		return;
	}

	const allRows = Array.from(entriesTableBody.querySelectorAll("tr"));
	const currentIndex = allRows.indexOf(currentRow);

	let targetRow;

	if (isDownward) {
		// Move down: next row or create new one
		if (currentIndex < allRows.length - 1) {
			targetRow = allRows[currentIndex + 1];
		} else {
			// At bottom - create new entry row
			const newRow = createNewEntryRow();
			entriesTableBody.appendChild(newRow);
			targetRow = newRow;
		}
	} else {
		// Move up: previous row (don't go above first row)
		if (currentIndex > 0) {
			targetRow = allRows[currentIndex - 1];
		} else {
			return; // Stay at first row
		}
	}

	// Focus on reading input of target row
	if (targetRow) {
		const readingInput = targetRow.querySelector('input[name="reading"]');
		if (readingInput) {
			readingInput.focus();
		}
	}
}

// Navigation-specific save function
/**
 * ナビゲーション保存用のバリデーション処理
 */
async function validateNavigationSave(row, formData) {
	// Validate required fields
	if (!formData.reading || !formData.word || !formData.category) {
		showValidationError(row, "読み、単語、カテゴリは必須です");
		return false;
	}

	// Check for duplicate reading+word combination
	const isDuplicate = await checkDuplicateEntry(formData, row);
	if (isDuplicate) {
		showValidationError(
			row,
			"この読み・単語の組み合わせは既に登録されています",
		);
		return false;
	}

	return true;
}

async function attemptNavigationSave(row) {
	if (!row || !currentGame) return false;

	// Check if already saving to prevent duplicate saves
	if (row.dataset.navigating === "true") {
		return true; // Already processing, skip
	}

	const formData = getRowFormData(row);

	// Skip empty rows
	if (!formData.reading && !formData.word) {
		return true;
	}

	// バリデーション処理を分離
	const validationResult = await validateNavigationSave(row, formData);
	if (!validationResult) {
		return false;
	}

	// Set navigation flag to prevent duplicate saves
	row.dataset.navigating = "true";

	try {
		if (row.dataset.isNew) {
			// Cancel any pending auto-save
			row.dataset.saving = "false";

			// Save new entry
			const data = {
				game_id: currentGame,
				category_id: parseInt(formData.category),
				reading: formData.reading,
				word: formData.word,
				description: formData.description || null,
			};

			await window.electronAPI.entries.create(data);

			// 最後に選択されたカテゴリを記憶
			lastSelectedCategoryId = parseInt(formData.category);
			console.log(
				"[DEBUG main.js] カテゴリIDを記憶しました:",
				lastSelectedCategoryId,
			);

			// Disable sorting for the reload to keep new entry at bottom
			shouldSortEntries = false;

			await loadEntries(currentGame);
		} else if (row.classList.contains("editing")) {
			// Save edited entry
			const entryId = parseInt(row.dataset.entryId);
			const data = {
				game_id: currentGame,
				category_id: parseInt(formData.category),
				reading: formData.reading,
				word: formData.word,
				description: formData.description || null,
			};

			await window.electronAPI.entries.update(entryId, data);
			await loadEntries(currentGame);
		}

		return true;
	} catch (error) {
		console.error("Error saving entry during navigation:", error);
		showValidationError(row, "保存に失敗しました");
		return false;
	} finally {
		// Clear navigation flag
		row.dataset.navigating = "false";
	}
}

// Show validation error for navigation
function showValidationError(row, message) {
	// Remove any existing error messages
	clearValidationErrors();

	// Create error message element
	const errorDiv = document.createElement("div");
	errorDiv.className = "validation-error";
	errorDiv.textContent = message;
	errorDiv.style.cssText = `
		color: #dc3545;
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 4px;
		padding: 8px 12px;
		margin: 4px 0;
		font-size: 0.875rem;
		position: absolute;
		z-index: 1000;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	`;

	// Position error message near the row
	const firstCell = row.querySelector("td");
	if (firstCell) {
		firstCell.style.position = "relative";
		firstCell.appendChild(errorDiv);

		// Auto-remove error message after 3 seconds
		setTimeout(() => {
			clearValidationErrors();
		}, 3000);
	}
}

// Clear validation error messages
function clearValidationErrors() {
	const errorMessages = document.querySelectorAll(".validation-error");
	errorMessages.forEach((msg) => msg.remove());
}

// Check for duplicate reading+word combination
async function checkDuplicateEntry(formData, currentRow) {
	if (!currentEntries) return false;

	// Get current entry ID if editing
	const currentEntryId = currentRow.dataset.entryId
		? parseInt(currentRow.dataset.entryId)
		: null;

	// Check if reading+word combination already exists (excluding current entry)
	const duplicate = currentEntries.find((entry) => {
		return (
			entry.id !== currentEntryId &&
			entry.reading === formData.reading &&
			entry.word === formData.word
		);
	});

	return !!duplicate;
}

async function attemptAutoSave(row) {
	// Only auto-save if this is a new entry row
	if (!row.dataset.isNew) return;

	// Check if already saving or navigating to prevent duplicate saves
	if (row.dataset.saving === "true" || row.dataset.navigating === "true") {
		return;
	}

	// Check if focus has moved outside of this row
	const activeElement = document.activeElement;
	const isStillInRow = row.contains(activeElement);

	// Don't auto-save if focus is still in row, unless it's on action buttons
	if (isStillInRow) {
		// Allow auto-save if focus moved to action buttons (save/clear)
		const isOnActionButton = activeElement?.closest(".entry-actions-inline");
		if (!isOnActionButton) {
			// User is still editing this row, don't auto-save
			return;
		}
	}

	const formData = getRowFormData(row);

	// Only auto-save if there's actual content to save
	if (!formData.reading && !formData.word) {
		return; // Nothing to save
	}

	// Validate the data before saving
	if (!validateEntryDataSilent(formData)) {
		return; // Invalid data, don't auto-save
	}

	// Check for duplicate reading+word combination
	const isDuplicate = await checkDuplicateEntry(formData, row);
	if (isDuplicate) {
		return; // Duplicate entry, don't auto-save
	}

	// Mark as saving and disable save button
	row.dataset.saving = "true";
	const saveButton = row.querySelector('button[onclick*="saveNewEntry"]');
	if (saveButton) {
		saveButton.disabled = true;
		saveButton.textContent = "保存中...";
	}

	try {
		const data = {
			game_id: currentGame,
			category_id: parseInt(formData.category),
			reading: formData.reading,
			word: formData.word,
			description: formData.description || null,
		};

		await window.electronAPI.entries.create(data);

		// 最後に選択されたカテゴリを記憶
		lastSelectedCategoryId = parseInt(formData.category);
		console.log(
			"[DEBUG main.js] カテゴリIDを記憶しました (auto-save):",
			lastSelectedCategoryId,
		);

		// Mark the row as saved
		row.classList.remove("new-entry");
		row.classList.add("auto-saved");

		// Disable sorting for the reload to keep new entry at bottom
		shouldSortEntries = false;

		// Reload entries
		await loadEntries(currentGame);

		// Re-render table with new entry row for continued input
		renderEntriesTable(currentEntries || []);

		showSuccess("単語を自動保存しました");
	} catch (error) {
		console.error("Auto-save failed:", error);
		// Re-enable save button on error
		row.dataset.saving = "false";
		if (saveButton) {
			saveButton.disabled = false;
			saveButton.textContent = "保存";
		}
		// Don't show error for auto-save failures to avoid interrupting user flow
	}
}

// Entry management functions

// Inline editing action functions
async function _saveNewEntry(button) {
	const row = button.closest("tr");

	// Check if already saving or navigating to prevent duplicate saves
	if (row.dataset.saving === "true" || row.dataset.navigating === "true") {
		return;
	}

	const formData = getRowFormData(row);

	if (!validateEntryData(formData, row)) {
		return;
	}

	// Check for duplicate reading+word combination
	const isDuplicate = await checkDuplicateEntry(formData, row);
	if (isDuplicate) {
		showError("この読み・単語の組み合わせは既に登録されています");
		return;
	}

	// Mark as saving and disable save button
	row.dataset.saving = "true";
	button.disabled = true;
	button.textContent = "保存中...";

	try {
		const data = {
			game_id: currentGame,
			category_id: parseInt(formData.category),
			reading: formData.reading,
			word: formData.word,
			description: formData.description || null,
		};

		await window.electronAPI.entries.create(data);

		// 最後に選択されたカテゴリを記憶
		lastSelectedCategoryId = parseInt(formData.category);
		console.log(
			"[DEBUG main.js] カテゴリIDを記憶しました (Enter key):",
			lastSelectedCategoryId,
		);

		// Disable sorting for the reload to keep new entry at bottom
		shouldSortEntries = false;

		// Reload entries
		await loadEntries(currentGame);

		// Re-render table with new entry row for continued input
		renderEntriesTable(currentEntries || []);

		showSuccess("単語を追加しました");
	} catch (error) {
		console.error("Failed to save entry:", error);
		// Re-enable save button on error
		row.dataset.saving = "false";
		button.disabled = false;
		button.textContent = "保存";
		showError("単語の保存に失敗しました");
	}
}

async function _editEntryInline(entryId) {
	const entry = currentEntries.find((e) => e.id === entryId);
	if (!entry) return;

	const row = document.querySelector(`tr[data-entry-id="${entryId}"]`);
	if (!row) return;

	const _category = allCategories.find((c) => c.id === entry.category_id);
	const categoryOptions = allCategories
		.map(
			(cat) =>
				`<option value="${cat.id}" ${cat.id === entry.category_id ? "selected" : ""}>${escapeHtml(cat.name)}</option>`,
		)
		.join("");

	row.className = "editing";
	row.innerHTML = `
		<td><input type="text" class="entry-input" name="reading" value="${escapeHtml(entry.reading)}" required></td>
		<td><input type="text" class="entry-input" name="word" value="${escapeHtml(entry.word)}" required></td>
		<td>
			<select class="entry-select" name="category" required>
				<option value="">選択...</option>
				${categoryOptions}
			</select>
		</td>
		<td><input type="text" class="entry-input" name="description" value="${escapeHtml(entry.description || "")}"></td>
		<td class="entry-actions-inline">
			<button class="btn btn-primary" onclick="saveEditedEntry(this, ${entryId})">保存</button>
			<button class="btn btn-secondary" onclick="cancelEditEntry(this, ${entryId})">キャンセル</button>
		</td>
	`;

	// Add keyboard navigation listeners
	addKeyboardNavigationListeners(row);
}

async function _saveEditedEntry(button, entryId) {
	const row = button.closest("tr");
	const formData = getRowFormData(row);

	if (!validateEntryData(formData, row)) {
		return;
	}

	// Check for duplicate reading+word combination
	const isDuplicate = await checkDuplicateEntry(formData, row);
	if (isDuplicate) {
		showError("この読み・単語の組み合わせは既に登録されています");
		return;
	}

	try {
		const data = {
			game_id: currentGame,
			category_id: parseInt(formData.category),
			reading: formData.reading,
			word: formData.word,
			description: formData.description || null,
		};

		await window.electronAPI.entries.update(entryId, data);

		// Reload entries
		await loadEntries(currentGame);

		// Re-render table
		renderEntriesTable(currentEntries || []);

		showSuccess("単語を更新しました");
	} catch (error) {
		console.error("Failed to update entry:", error);
		showError("単語の更新に失敗しました");
	}
}

function _cancelEditEntry(_button, _entryId) {
	// Re-render table to cancel editing
	renderEntriesTable(currentEntries || []);
}

function _clearNewEntry(button) {
	const row = button.closest("tr");
	row.querySelectorAll("input").forEach((input) => {
		input.value = "";
	});
	row.querySelector("select").selectedIndex = 1; // Select "名詞"

	const readingInput = row.querySelector('input[name="reading"]');
	if (readingInput) readingInput.focus();
}

function getRowFormData(row) {
	return {
		reading: row.querySelector('input[name="reading"]').value.trim(),
		word: row.querySelector('input[name="word"]').value.trim(),
		category: row.querySelector('select[name="category"]').value,
		description: row.querySelector('input[name="description"]').value.trim(),
	};
}

function validateEntryData(data, row) {
	let isValid = true;

	// Clear previous errors
	row.querySelectorAll(".entry-input, .entry-select").forEach((input) => {
		input.classList.remove("error");
	});

	// Validate required fields
	if (!data.reading) {
		row.querySelector('input[name="reading"]').classList.add("error");
		isValid = false;
	}

	if (!data.word) {
		row.querySelector('input[name="word"]').classList.add("error");
		isValid = false;
	}

	if (!data.category) {
		row.querySelector('select[name="category"]').classList.add("error");
		isValid = false;
	}

	if (!isValid) {
		showError("必須項目を入力してください");
	}

	return isValid;
}

function validateEntryDataSilent(data) {
	// Silent validation for auto-save (no UI feedback)
	return !!(data.reading && data.word && data.category);
}

// Public function for entry deletion (used by keyboard shortcuts and UI)
function deleteEntry(entryId) {
	_deleteEntry(entryId);
}

async function _deleteEntry(entryId) {
	if (!confirm("この単語を削除しますか？")) return;

	try {
		await window.electronAPI.entries.delete(entryId);
		await loadEntries(currentGame);
		showSuccess("単語を削除しました");
	} catch (error) {
		console.error("Failed to delete entry:", error);
		showError("単語の削除に失敗しました");
	}
}

// CSV operation handlers
async function onExportGitCsv() {
	try {
		const result = await window.electronAPI.csv.exportToGitCsv();

		if (result.success && result.files) {
			const fileCount = result.files.length;
			const exportDir =
				result.files.length > 0
					? result.files[0].substring(0, result.files[0].lastIndexOf("/"))
					: "";

			showSuccess(
				`Git管理用CSVを${fileCount}個のファイルで出力しました: ${exportDir}`,
			);
		}
	} catch (error) {
		console.error("Git CSV export failed:", error);
		showError(`Git管理用CSV出力に失敗しました: ${error.message}`);
	}
}

async function onImportCsv() {
	try {
		const result = await window.electronAPI.files.showOpenDialog({
			title: "インポートするCSVファイルを選択",
			filters: [{ name: "CSV Files", extensions: ["csv"] }],
			properties: ["openFile"],
		});

		if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
			return;
		}

		const filePath = result.filePaths[0];
		const importResult = await window.electronAPI.csv.importFromCsv(filePath);

		if (importResult.success) {
			showSuccess("CSVファイルのインポートが完了しました");
			// Reset sort flag on CSV import
			shouldSortEntries = true;
			// Reload data
			await loadGames();
			await loadCategories();
			if (currentGame) {
				await loadEntries(currentGame);
			}
		}
	} catch (error) {
		console.error("CSV import failed:", error);
		showError(`CSVインポートに失敗しました: ${error.message}`);
	}
}

// Utility functions
function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

function showSuccess(message) {
	showToast(message, "success");
}

function showToast(message, type = "success") {
	// Calculate position to avoid overlapping with existing toasts
	const existingToasts = document.querySelectorAll(".toast");
	let bottomOffset = 20;
	existingToasts.forEach((existingToast) => {
		const rect = existingToast.getBoundingClientRect();
		bottomOffset = Math.max(bottomOffset, window.innerHeight - rect.top + 10);
	});

	const toast = document.createElement("div");
	toast.className = `toast toast-${type}`;
	toast.textContent = message;

	const backgroundColor = type === "success" ? "#4CAF50" : "#f44336";
	const duration = type === "success" ? 3000 : 5000;

	toast.style.cssText = `
		position: fixed;
		bottom: ${bottomOffset}px;
		right: 20px;
		background: ${backgroundColor};
		color: white;
		padding: 12px 20px;
		border-radius: 4px;
		z-index: 10000;
		font-size: 14px;
		box-shadow: 0 2px 5px rgba(0,0,0,0.2);
		transition: all 0.3s ease;
		opacity: 0;
		transform: translateX(100%);
	`;
	document.body.appendChild(toast);

	// Animate in
	requestAnimationFrame(() => {
		toast.style.opacity = "1";
		toast.style.transform = "translateX(0)";
	});

	// Auto-remove after duration
	setTimeout(() => {
		if (toast.parentNode) {
			toast.style.opacity = "0";
			toast.style.transform = "translateX(100%)";
			setTimeout(() => {
				if (toast.parentNode) {
					toast.parentNode.removeChild(toast);
				}
			}, 300);
		}
	}, duration);
}

function showError(message) {
	showToast(message, "error");
}

// CSV Import completion handler
async function refreshDataAfterCsvImport() {
	try {
		// Reload games and categories
		await loadGames();
		await loadCategories();

		// If a game was selected before, try to reload its entries
		if (currentGame) {
			await loadEntries(currentGame);
		}

		console.log("Data refresh after CSV import completed");
	} catch (error) {
		console.error("Failed to refresh data after CSV import:", error);
	}
}

// Data Sync Handlers
function setupDataSyncHandlers() {
	// Listen for data sync dialog request from main process
	if (window.electronAPI?.dataSync?.onShowDialog) {
		window.electronAPI.dataSync.onShowDialog((status) => {
			showDataSyncDialog(status);
		});
	} else {
		console.warn("Data sync IPC listener not available");
	}

	// Listen for CSV import completion notification
	if (window.electronAPI?.dataSync?.onCsvImportCompleted) {
		window.electronAPI.dataSync.onCsvImportCompleted(async () => {
			console.log("CSV import completed, refreshing data...");
			await refreshDataAfterCsvImport();
		});
	} else {
		console.warn("CSV import completion listener not available");
	}

	// Listen for exit sync dialog request from main process
	if (window.electronAPI?.exitSync?.onShowDialog) {
		window.electronAPI.exitSync.onShowDialog((status) => {
			showExitSyncDialog(status);
		});
	} else {
		console.warn("Exit sync IPC listener not available");
	}
}

async function showDataSyncDialog(status) {
	try {
		// Get conflict message from main process
		const conflictData =
			await window.electronAPI.dataSync.getConflictMessage(status);

		const modal = document.getElementById("data-sync-modal");
		const title = document.getElementById("data-sync-modal-title");
		const message = document.getElementById("data-sync-message");
		const options = document.getElementById("data-sync-options");

		// Set title and message
		title.textContent = conflictData.title;
		message.textContent = conflictData.message;

		// Clear previous options
		options.innerHTML = "";

		// Create option buttons
		conflictData.options.forEach((option) => {
			const optionDiv = document.createElement("div");
			optionDiv.className = "data-sync-option";
			optionDiv.innerHTML = `
				<button class="btn btn-primary data-sync-choice-btn" 
						data-action="${option.action}">
					${option.label}
				</button>
				<p class="option-description">${option.description}</p>
			`;
			options.appendChild(optionDiv);
		});

		// Add event listeners to choice buttons
		options.querySelectorAll(".data-sync-choice-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const action = e.target.dataset.action;
				handleDataSyncChoice(action);
			});
		});

		// Show modal
		modal.style.display = "block";
	} catch (error) {
		console.error("Failed to show data sync dialog:", error);
		showError("データ同期ダイアログの表示に失敗しました");
	}
}

async function handleDataSyncChoice(action) {
	const modal = document.getElementById("data-sync-modal");

	try {
		// Disable all buttons during processing
		const buttons = modal.querySelectorAll(".data-sync-choice-btn");
		buttons.forEach((btn) => {
			btn.disabled = true;
			btn.textContent = "処理中...";
		});

		// Execute user choice
		const result = await window.electronAPI.dataSync.performUserChoice({
			action: action,
			confirmed: true,
		});

		if (result.success) {
			showSuccess("データ同期が完了しました");
			// Reset sort flag on data sync
			shouldSortEntries = true;
			// Reload data to reflect changes
			await loadGames();
			await loadCategories();
			if (currentGame) {
				await loadEntries(currentGame);
			}
		} else {
			showError(`データ同期に失敗しました: ${result.error}`);
		}
	} catch (error) {
		console.error("Data sync choice failed:", error);
		showError(`データ同期処理に失敗しました: ${error.message}`);
	} finally {
		// Close modal
		modal.style.display = "none";
	}
}

// Exit Sync Handlers
async function showExitSyncDialog(status) {
	try {
		// Get exit message from main process
		const exitData = await window.electronAPI.exitSync.getExitMessage(status);

		const modal = document.getElementById("exit-sync-modal");
		const title = document.getElementById("exit-sync-modal-title");
		const message = document.getElementById("exit-sync-message");
		const options = document.getElementById("exit-sync-options");

		// Set title and message
		title.textContent = exitData.title;
		message.textContent = exitData.message;

		// Clear previous options
		options.innerHTML = "";

		// Create option buttons
		exitData.options.forEach((option) => {
			const optionDiv = document.createElement("div");
			optionDiv.className = "exit-sync-option";
			optionDiv.innerHTML = `
				<button class="btn btn-primary exit-sync-choice-btn" 
						data-action="${option.action}">
					${option.label}
				</button>
				<p class="option-description">${option.description}</p>
			`;
			options.appendChild(optionDiv);
		});

		// Add event listeners to choice buttons
		options.querySelectorAll(".exit-sync-choice-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const action = e.target.dataset.action;
				handleExitSyncChoice(action);
			});
		});

		// Show modal
		modal.style.display = "block";
	} catch (error) {
		console.error("Failed to show exit sync dialog:", error);
		showError("終了時データ同期ダイアログの表示に失敗しました");
		// Force close if dialog fails
		forceCloseApp();
	}
}

async function handleExitSyncChoice(action) {
	const modal = document.getElementById("exit-sync-modal");

	try {
		// Disable all buttons during processing
		const buttons = modal.querySelectorAll(".exit-sync-choice-btn");
		buttons.forEach((btn) => {
			btn.disabled = true;
			btn.textContent = "処理中...";
		});

		// Execute user choice
		const result = await window.electronAPI.exitSync.performUserChoice({
			action: action,
			confirmed: true,
		});

		if (result.success) {
			if (action === "export_csv") {
				showSuccess("データをCSVに保存しました");
				await window.electronAPI.exitSync.markLastExportTime();
			}
		} else {
			showError(`データ処理に失敗しました: ${result.error}`);
		}
	} catch (error) {
		console.error("Exit sync choice failed:", error);
		showError(`終了処理に失敗しました: ${error.message}`);
	} finally {
		// Close modal and force close app
		modal.style.display = "none";
		forceCloseApp();
	}
}

async function forceCloseApp() {
	// Request main process to force close the app
	try {
		if (window.electronAPI?.app?.forceClose) {
			await window.electronAPI.app.forceClose();
		} else {
			// Fallback
			setTimeout(() => {
				window.close();
			}, 100);
		}
	} catch (error) {
		console.error("Force close failed:", error);
		// Fallback
		setTimeout(() => {
			window.close();
		}, 100);
	}
}

// IME operation handlers
async function onImportIme() {
	if (!currentGame) {
		showError("ゲームが選択されていません");
		return;
	}

	try {
		const result = await window.electronAPI.files.showOpenDialog({
			title: "インポートするIME辞書ファイルを選択",
			filters: [{ name: "Text Files", extensions: ["txt"] }],
			properties: ["openFile"],
		});

		if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
			return;
		}

		const filePath = result.filePaths[0];

		// Show loading state
		const importBtn = document.getElementById("import-ime-btn");
		const originalText = importBtn.textContent;
		importBtn.disabled = true;
		importBtn.textContent = "インポート中...";

		try {
			const importResult = await window.electronAPI.ime.importFromImeTxt(
				currentGame,
				filePath,
			);

			if (importResult.errors && importResult.errors.length > 0) {
				// Show validation errors
				const errorMessage = `ファイル形式に問題があります:\\n${importResult.errors.join("\\n")}`;
				showError(errorMessage);
				return;
			}

			// Show success with details
			let message = `インポートが完了しました:`;
			if (importResult.imported > 0) {
				message += ` ${importResult.imported}件を追加`;
			}
			if (importResult.skipped > 0) {
				message += `, ${importResult.skipped}件をスキップ（重複）`;
			}

			showSuccess(message);

			// Reload entries to show imported data
			shouldSortEntries = true;
			await loadEntries(currentGame);
		} finally {
			// Restore button state
			importBtn.disabled = false;
			importBtn.textContent = originalText;
		}
	} catch (error) {
		console.error("IME import failed:", error);
		showError(`IME辞書インポートに失敗しました: ${error.message}`);
	}
}

async function onExportIme() {
	if (!currentGame) {
		showError("ゲームが選択されていません");
		return;
	}

	try {
		const result =
			await window.electronAPI.ime.exportToMicrosoftIme(currentGame);

		if (result.success && result.filePath) {
			showSuccess(`IME辞書ファイルを出力しました: ${result.filePath}`);
		}
	} catch (error) {
		console.error("IME export failed:", error);
		showError(`IME辞書出力に失敗しました: ${error.message}`);
	}
}

async function onExportAllGames() {
	try {
		const result = await window.electronAPI.ime.exportAllGamesToMicrosoftIme();

		if (result.success) {
			let message = `全ゲーム辞書を出力しました: ${result.filePath}`;
			if (result.stats) {
				message += `\n統計: 総エントリ ${result.stats.totalEntries}件, ユニーク ${result.stats.uniqueEntries}件, 重複除外 ${result.stats.duplicatesRemoved}件`;
			}
			if (result.duplicatesFilePath) {
				message += `\n重複除外リスト: ${result.duplicatesFilePath}`;
			}
			showSuccess(message);
		}
	} catch (error) {
		console.error("All games export failed:", error);
		showError(`全ゲーム辞書出力に失敗しました: ${error.message}`);
	}
}

// Update IME export button state based on entries
function updateImeExportButtonState() {
	const imeExportBtn = document.getElementById("export-ime-btn");
	if (!imeExportBtn) return;

	// Enable IME export button only if there are entries and a game is selected
	const hasEntries = currentEntries && currentEntries.length > 0;
	const hasGame = currentGame !== null;

	imeExportBtn.disabled = !(hasEntries && hasGame);
}

// Game management functions
async function onEditGame() {
	if (!currentGame) {
		showError("ゲームが選択されていません");
		return;
	}

	try {
		const games = await window.electronAPI.games.getAll();
		const selectedGame = games.find((g) => g.id === currentGame);
		if (!selectedGame) {
			showError("選択されたゲームが見つかりません");
			return;
		}

		openGameModal(selectedGame);
	} catch (error) {
		console.error("Failed to load game for editing:", error);
		showError(`ゲーム情報の読み込みに失敗しました: ${error.message}`);
	}
}

async function onDeleteGame() {
	if (!currentGame) {
		showError("ゲームが選択されていません");
		return;
	}

	try {
		const games = await window.electronAPI.games.getAll();
		const selectedGame = games.find((g) => g.id === currentGame);
		if (!selectedGame) {
			showError("選択されたゲームが見つかりません");
			return;
		}

		// Get entry count for this game
		const entryCount =
			await window.electronAPI.games.getEntryCount(currentGame);

		// Show delete confirmation modal
		showDeleteGameModal(selectedGame, entryCount);
	} catch (error) {
		console.error("Failed to prepare game deletion:", error);
		showError(`削除準備に失敗しました: ${error.message}`);
	}
}

function showDeleteGameModal(game, entryCount) {
	const modal = document.getElementById("delete-game-modal");
	const gameNameSpan = document.getElementById("delete-game-name");
	const entriesCountSpan = document.getElementById("delete-entries-count");
	const entriesMessage = document.getElementById("delete-entries-message");

	gameNameSpan.textContent = game.name;
	entriesCountSpan.textContent = entryCount;

	// Hide entries message if no entries
	if (entryCount === 0) {
		entriesMessage.style.display = "none";
	} else {
		entriesMessage.style.display = "block";
	}

	// Store game ID for deletion
	modal.dataset.gameId = game.id;

	modal.style.display = "flex";
}

async function onConfirmDeleteGame() {
	const modal = document.getElementById("delete-game-modal");
	const gameId = parseInt(modal.dataset.gameId);

	if (!gameId) {
		showError("削除対象のゲームが特定できません");
		return;
	}

	try {
		// Disable buttons during deletion
		const confirmBtn = document.getElementById("confirm-delete-game-btn");
		const cancelBtn = document.getElementById("cancel-delete-game-btn");

		confirmBtn.disabled = true;
		confirmBtn.textContent = "削除中...";
		cancelBtn.disabled = true;

		// Execute deletion
		const result =
			await window.electronAPI.games.deleteWithRelatedEntries(gameId);

		if (result.deletedGame) {
			const deletedEntries = result.deletedEntries;
			let message = "ゲームを削除しました";
			if (deletedEntries > 0) {
				message += `（関連する単語${deletedEntries}件も削除）`;
			}
			showSuccess(message);

			// Clear current selection and reload games
			currentGame = null;
			preventAutoSelection = true; // Prevent auto-selection after deletion
			await loadGames();
			// Force clear selection and update UI - don't auto-select after deletion
			gameSelect.value = "";
			currentGameTitle.textContent = "ゲームを選択してください";
			document.getElementById("edit-game-btn").disabled = true;
			document.getElementById("delete-game-btn").disabled = true;
			document.getElementById("add-entry-btn").disabled = true;
			document.getElementById("import-ime-btn").disabled = true;
			document.getElementById("export-ime-btn").disabled = true;
			renderEntriesTable([]);
			preventAutoSelection = false; // Reset flag after UI update
		} else {
			showError("ゲームの削除に失敗しました");
		}
	} catch (error) {
		console.error("Game deletion failed:", error);
		showError(`ゲーム削除に失敗しました: ${error.message}`);
	} finally {
		// Re-enable buttons and close modal
		const confirmBtn = document.getElementById("confirm-delete-game-btn");
		const cancelBtn = document.getElementById("cancel-delete-game-btn");

		confirmBtn.disabled = false;
		confirmBtn.textContent = "削除実行";
		cancelBtn.disabled = false;

		modal.style.display = "none";
	}
}

// Global functions for HTML onclick handlers
globalThis.editEntryInline = _editEntryInline;
globalThis.saveNewEntry = _saveNewEntry;
globalThis.saveEditedEntry = _saveEditedEntry;
globalThis.clearNewEntry = _clearNewEntry;
globalThis.cancelEditEntry = _cancelEditEntry;
