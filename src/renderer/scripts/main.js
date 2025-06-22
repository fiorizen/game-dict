// Global state
let currentGame = null;
let currentEntries = [];
let allCategories = [];
let shouldSortEntries = true;  // Track if entries should be sorted (false after adding new entry)

// DOM elements
const gameSelect = document.getElementById("game-select");
const currentGameTitle = document.getElementById("current-game-title");
const addGameBtn = document.getElementById("add-game-btn");
const addEntryBtn = document.getElementById("add-entry-btn");
const entriesTableContainer = document.getElementById("entries-table-container");
const entriesTableBody = document.getElementById("entries-table-body");
const noEntriesMessage = document.getElementById("no-entries-message");

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
	
	// Auto-generate game code from name
	document.getElementById("game-name").addEventListener("input", onGameNameInput);

	// Entry management - add entry is always inline now
	addEntryBtn.addEventListener("click", addNewEntryRow);

	// CSV operations
	document.getElementById("export-git-csv-btn").addEventListener("click", onExportGitCsv);
	document.getElementById("import-csv-btn").addEventListener("click", onImportCsv);
	
	// IME operations
	document.getElementById("export-ime-btn").addEventListener("click", onExportIme);


	// Modal handling
	setupModalHandlers();

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
			currentEntries = await window.electronAPI.entries.getByGameIdUnsorted(gameId);
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
	if (games.length > 0 && !currentGame) {
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
	const gameId = parseInt(gameSelect.value);
	if (gameId) {
		currentGame = gameId;
		const games = await window.electronAPI.games.getAll();
		const selectedGame = games.find((g) => g.id === gameId);
		currentGameTitle.textContent = selectedGame
			? selectedGame.name
			: "Unknown Game";
		addEntryBtn.disabled = false;
		// Reset sort flag when changing games (should sort on game change)
		shouldSortEntries = true;
		await loadEntries(gameId);
	} else {
		currentGame = null;
		currentGameTitle.textContent = "ゲームを選択してください";
		addEntryBtn.disabled = true;
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
	const existingNewRow = entriesTableBody.querySelector('tr[data-is-new="true"]');
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
	entries.forEach(entry => {
		const row = createEntryRow(entry);
		entriesTableBody.appendChild(row);
	});
	
	// Always add new entry row at the bottom when game is selected
	const newRow = createNewEntryRow();
	entriesTableBody.appendChild(newRow);
}

function createEntryRow(entry) {
	const row = document.createElement("tr");
	row.dataset.entryId = entry.id;
	
	const category = allCategories.find(c => c.id === entry.category_id);
	const categoryName = category ? category.name : "Unknown";
	
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
	
	const categoryOptions = allCategories.map(cat => 
		`<option value="${cat.id}" ${cat.name === "名詞" ? "selected" : ""}>${escapeHtml(cat.name)}</option>`
	).join("");
	
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
	
	// Focus on reading input
	setTimeout(() => {
		const readingInput = row.querySelector('input[name="reading"]');
		if (readingInput) readingInput.focus();
	}, 100);
	
	return row;
}

function addAutoSaveListeners(row) {
	const inputs = row.querySelectorAll('input, select');
	let saveTimeout;
	
	inputs.forEach(input => {
		input.addEventListener('blur', () => {
			// Clear any existing timeout
			if (saveTimeout) {
				clearTimeout(saveTimeout);
			}
			
			// Set a short delay to allow other focusout events to complete
			// Use shorter delay for description field (last field)
			const isDescriptionField = input.name === 'description';
			const delay = isDescriptionField ? 300 : 200;
			
			saveTimeout = setTimeout(() => {
				attemptAutoSave(row);
			}, delay);
		});
		
		// Cancel auto-save if user focuses back into input fields (but not buttons)
		input.addEventListener('focus', () => {
			if (saveTimeout) {
				clearTimeout(saveTimeout);
				saveTimeout = null;
			}
		});
		
		// Special handling for description field - trigger save on Enter key
		if (input.name === 'description') {
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
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
	row.addEventListener('focusout', (e) => {
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

async function attemptAutoSave(row) {
	// Only auto-save if this is a new entry row
	if (!row.dataset.isNew) return;
	
	// Check if already saving to prevent duplicate saves
	if (row.dataset.saving === 'true') {
		return;
	}
	
	// Check if focus has moved outside of this row
	const activeElement = document.activeElement;
	const isStillInRow = row.contains(activeElement);
	
	// Don't auto-save if focus is still in row, unless it's on action buttons
	if (isStillInRow) {
		// Allow auto-save if focus moved to action buttons (save/clear)
		const isOnActionButton = activeElement && activeElement.closest('.entry-actions-inline');
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
	
	// Mark as saving and disable save button
	row.dataset.saving = 'true';
	const saveButton = row.querySelector('button[onclick*="saveNewEntry"]');
	if (saveButton) {
		saveButton.disabled = true;
		saveButton.textContent = '保存中...';
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
		
		// Mark the row as saved
		row.classList.remove('new-entry');
		row.classList.add('auto-saved');
		
		// Reload entries
		await loadEntries(currentGame);
		
		// Re-render table with new entry row for continued input
		renderEntriesTable(currentEntries || []);
		
		showSuccess("単語を自動保存しました");
	} catch (error) {
		console.error("Auto-save failed:", error);
		// Re-enable save button on error
		row.dataset.saving = 'false';
		if (saveButton) {
			saveButton.disabled = false;
			saveButton.textContent = '保存';
		}
		// Don't show error for auto-save failures to avoid interrupting user flow
	}
}

// Entry management functions

// Inline editing action functions
async function saveNewEntry(button) {
	const row = button.closest("tr");
	
	// Check if already saving to prevent duplicate saves
	if (row.dataset.saving === 'true') {
		return;
	}
	
	const formData = getRowFormData(row);
	
	if (!validateEntryData(formData, row)) {
		return;
	}
	
	// Mark as saving and disable save button
	row.dataset.saving = 'true';
	button.disabled = true;
	button.textContent = '保存中...';
	
	try {
		const data = {
			game_id: currentGame,
			category_id: parseInt(formData.category),
			reading: formData.reading,
			word: formData.word,
			description: formData.description || null,
		};
		
		await window.electronAPI.entries.create(data);
		
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
		row.dataset.saving = 'false';
		button.disabled = false;
		button.textContent = '保存';
		showError("単語の保存に失敗しました");
	}
}

async function editEntryInline(entryId) {
	const entry = currentEntries.find(e => e.id === entryId);
	if (!entry) return;
	
	const row = document.querySelector(`tr[data-entry-id="${entryId}"]`);
	if (!row) return;
	
	const category = allCategories.find(c => c.id === entry.category_id);
	const categoryOptions = allCategories.map(cat => 
		`<option value="${cat.id}" ${cat.id === entry.category_id ? "selected" : ""}>${escapeHtml(cat.name)}</option>`
	).join("");
	
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
}

async function saveEditedEntry(button, entryId) {
	const row = button.closest("tr");
	const formData = getRowFormData(row);
	
	if (!validateEntryData(formData, row)) {
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

function cancelEditEntry(button, entryId) {
	// Re-render table to cancel editing
	renderEntriesTable(currentEntries || []);
}

function clearNewEntry(button) {
	const row = button.closest("tr");
	row.querySelectorAll("input").forEach(input => input.value = "");
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
	row.querySelectorAll(".entry-input, .entry-select").forEach(input => {
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


async function deleteEntry(entryId) {
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
			const exportDir = result.files.length > 0 ? 
				result.files[0].substring(0, result.files[0].lastIndexOf('/')) : '';
			
			showSuccess(`Git管理用CSVを${fileCount}個のファイルで出力しました: ${exportDir}`);
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
	// 簡潔なサクセストースト表示（3秒で自動消去）
	const toast = document.createElement('div');
	toast.className = 'toast toast-success';
	toast.textContent = message;
	toast.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: #4CAF50;
		color: white;
		padding: 12px 20px;
		border-radius: 4px;
		z-index: 10000;
		font-size: 14px;
		box-shadow: 0 2px 5px rgba(0,0,0,0.2);
	`;
	document.body.appendChild(toast);
	
	// 3秒後に自動削除
	setTimeout(() => {
		if (toast.parentNode) {
			toast.parentNode.removeChild(toast);
		}
	}, 3000);
}

function showError(message) {
	// エラートースト表示（5秒で自動消去）
	const toast = document.createElement('div');
	toast.className = 'toast toast-error';
	toast.textContent = message;
	toast.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: #f44336;
		color: white;
		padding: 12px 20px;
		border-radius: 4px;
		z-index: 10000;
		font-size: 14px;
		box-shadow: 0 2px 5px rgba(0,0,0,0.2);
	`;
	document.body.appendChild(toast);
	
	// 5秒後に自動削除
	setTimeout(() => {
		if (toast.parentNode) {
			toast.parentNode.removeChild(toast);
		}
	}, 5000);
}

// Data Sync Handlers
function setupDataSyncHandlers() {
	// Listen for data sync dialog request from main process
	if (window.electronAPI && window.electronAPI.dataSync && window.electronAPI.dataSync.onShowDialog) {
		window.electronAPI.dataSync.onShowDialog((status) => {
			showDataSyncDialog(status);
		});
	} else {
		console.warn('Data sync IPC listener not available');
	}

	// Listen for exit sync dialog request from main process
	if (window.electronAPI && window.electronAPI.exitSync && window.electronAPI.exitSync.onShowDialog) {
		window.electronAPI.exitSync.onShowDialog((status) => {
			showExitSyncDialog(status);
		});
	} else {
		console.warn('Exit sync IPC listener not available');
	}
}

async function showDataSyncDialog(status) {
	try {
		// Get conflict message from main process
		const conflictData = await window.electronAPI.dataSync.getConflictMessage(status);
		
		const modal = document.getElementById('data-sync-modal');
		const title = document.getElementById('data-sync-modal-title');
		const message = document.getElementById('data-sync-message');
		const options = document.getElementById('data-sync-options');
		
		// Set title and message
		title.textContent = conflictData.title;
		message.textContent = conflictData.message;
		
		// Clear previous options
		options.innerHTML = '';
		
		// Create option buttons
		conflictData.options.forEach(option => {
			const optionDiv = document.createElement('div');
			optionDiv.className = 'data-sync-option';
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
		options.querySelectorAll('.data-sync-choice-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const action = e.target.dataset.action;
				handleDataSyncChoice(action);
			});
		});
		
		// Show modal
		modal.style.display = 'block';
		
	} catch (error) {
		console.error('Failed to show data sync dialog:', error);
		showError('データ同期ダイアログの表示に失敗しました');
	}
}

async function handleDataSyncChoice(action) {
	const modal = document.getElementById('data-sync-modal');
	
	try {
		// Disable all buttons during processing
		const buttons = modal.querySelectorAll('.data-sync-choice-btn');
		buttons.forEach(btn => {
			btn.disabled = true;
			btn.textContent = '処理中...';
		});
		
		// Execute user choice
		const result = await window.electronAPI.dataSync.performUserChoice({
			action: action,
			confirmed: true
		});
		
		if (result.success) {
			showSuccess('データ同期が完了しました');
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
		console.error('Data sync choice failed:', error);
		showError(`データ同期処理に失敗しました: ${error.message}`);
	} finally {
		// Close modal
		modal.style.display = 'none';
	}
}

// Exit Sync Handlers
async function showExitSyncDialog(status) {
	try {
		// Get exit message from main process
		const exitData = await window.electronAPI.exitSync.getExitMessage(status);
		
		const modal = document.getElementById('exit-sync-modal');
		const title = document.getElementById('exit-sync-modal-title');
		const message = document.getElementById('exit-sync-message');
		const options = document.getElementById('exit-sync-options');
		
		// Set title and message
		title.textContent = exitData.title;
		message.textContent = exitData.message;
		
		// Clear previous options
		options.innerHTML = '';
		
		// Create option buttons
		exitData.options.forEach(option => {
			const optionDiv = document.createElement('div');
			optionDiv.className = 'exit-sync-option';
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
		options.querySelectorAll('.exit-sync-choice-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const action = e.target.dataset.action;
				handleExitSyncChoice(action);
			});
		});
		
		// Show modal
		modal.style.display = 'block';
		
	} catch (error) {
		console.error('Failed to show exit sync dialog:', error);
		showError('終了時データ同期ダイアログの表示に失敗しました');
		// Force close if dialog fails
		forceCloseApp();
	}
}

async function handleExitSyncChoice(action) {
	const modal = document.getElementById('exit-sync-modal');
	
	try {
		// Disable all buttons during processing
		const buttons = modal.querySelectorAll('.exit-sync-choice-btn');
		buttons.forEach(btn => {
			btn.disabled = true;
			btn.textContent = '処理中...';
		});
		
		// Execute user choice
		const result = await window.electronAPI.exitSync.performUserChoice({
			action: action,
			confirmed: true
		});
		
		if (result.success) {
			if (action === 'export_csv') {
				showSuccess('データをCSVに保存しました');
				await window.electronAPI.exitSync.markLastExportTime();
			}
		} else {
			showError(`データ処理に失敗しました: ${result.error}`);
		}
		
	} catch (error) {
		console.error('Exit sync choice failed:', error);
		showError(`終了処理に失敗しました: ${error.message}`);
	} finally {
		// Close modal and force close app
		modal.style.display = 'none';
		forceCloseApp();
	}
}

async function forceCloseApp() {
	// Request main process to force close the app
	try {
		if (window.electronAPI && window.electronAPI.app && window.electronAPI.app.forceClose) {
			await window.electronAPI.app.forceClose();
		} else {
			// Fallback
			setTimeout(() => {
				window.close();
			}, 100);
		}
	} catch (error) {
		console.error('Force close failed:', error);
		// Fallback
		setTimeout(() => {
			window.close();
		}, 100);
	}
}

// IME operation handlers
async function onExportIme() {
	if (!currentGame) {
		showError("ゲームが選択されていません");
		return;
	}

	try {
		const result = await window.electronAPI.ime.exportToMicrosoftIme(currentGame);
		
		if (result.success && result.filePath) {
			showSuccess(`IME辞書ファイルを出力しました: ${result.filePath}`);
		}
	} catch (error) {
		console.error("IME export failed:", error);
		showError(`IME辞書出力に失敗しました: ${error.message}`);
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
