// Global state
let currentGame = null;
let currentEntries = [];
let allCategories = [];

// DOM elements
const gameSelect = document.getElementById("game-select");
const categorySelect = document.getElementById("category-select");
const searchInput = document.getElementById("search-input");
const currentGameTitle = document.getElementById("current-game-title");
const addGameBtn = document.getElementById("add-game-btn");
const addEntryBtn = document.getElementById("add-entry-btn");
const entriesList = document.getElementById("entries-list");

// Modal elements
const gameModal = document.getElementById("game-modal");
const entryModal = document.getElementById("entry-modal");
const gameForm = document.getElementById("game-form");
const entryForm = document.getElementById("entry-form");

// Initialize app
document.addEventListener("DOMContentLoaded", async () => {
	await loadGames();
	await loadCategories();
	setupEventListeners();
});

// Event listeners
function setupEventListeners() {
	// Game selection
	gameSelect.addEventListener("change", onGameChange);
	addGameBtn.addEventListener("click", () => openGameModal());

	// Entry management
	addEntryBtn.addEventListener("click", () => openEntryModal());

	// CSV operations
	document.getElementById("export-csv-btn").addEventListener("click", onExportCsv);
	document.getElementById("import-csv-btn").addEventListener("click", onImportCsv);

	// Search and filter
	searchInput.addEventListener("input", onSearchInput);
	categorySelect.addEventListener("change", onCategoryFilter);

	// Modal handling
	setupModalHandlers();

	// Form submission
	gameForm.addEventListener("submit", onGameSubmit);
	entryForm.addEventListener("submit", onEntrySubmit);
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
	document
		.getElementById("cancel-entry-btn")
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
		currentEntries = await window.electronAPI.entries.getByGameId(gameId);
		renderEntries(currentEntries || []);
	} catch (error) {
		console.error("Failed to load entries:", error);
		// Don't show error for empty data - just show empty state
		currentEntries = [];
		renderEntries([]);
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
}

function populateCategorySelects() {
	// Category filter
	categorySelect.innerHTML = '<option value="">全てのカテゴリ</option>';
	allCategories.forEach((category) => {
		const option = document.createElement("option");
		option.value = category.id;
		option.textContent = category.name;
		categorySelect.appendChild(option);
	});

	// Entry form category
	const entryCategory = document.getElementById("entry-category");
	entryCategory.innerHTML = '<option value="">カテゴリを選択...</option>';
	allCategories.forEach((category) => {
		const option = document.createElement("option");
		option.value = category.id;
		option.textContent = category.name;
		entryCategory.appendChild(option);
	});
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
		await loadEntries(gameId);
	} else {
		currentGame = null;
		currentGameTitle.textContent = "ゲームを選択してください";
		addEntryBtn.disabled = true;
		entriesList.innerHTML =
			'<div class="no-entries"><p>ゲームを選択して単語を管理してください</p></div>';
	}
}

async function onSearchInput() {
	if (!currentGame) return;

	const query = searchInput.value.trim();
	if (query) {
		try {
			const results = await window.electronAPI.entries.search(query);
			const gameResults = (results || []).filter(
				(entry) => entry.game_id === currentGame,
			);
			renderEntries(gameResults);
		} catch (error) {
			console.error("Search failed:", error);
			// Don't show error for empty search results - just show empty state
			renderEntries([]);
		}
	} else {
		await loadEntries(currentGame);
	}
}

function onCategoryFilter() {
	const categoryId = parseInt(categorySelect.value);
	if (categoryId) {
		const filtered = currentEntries.filter(
			(entry) => entry.category_id === categoryId,
		);
		renderEntries(filtered);
	} else {
		renderEntries(currentEntries);
	}
}

// Modal functions
function openGameModal(game = null) {
	const title = document.getElementById("game-modal-title");
	const nameInput = document.getElementById("game-name");

	if (game) {
		title.textContent = "ゲーム編集";
		nameInput.value = game.name;
		gameForm.dataset.gameId = game.id;
	} else {
		title.textContent = "ゲーム追加";
		nameInput.value = "";
		delete gameForm.dataset.gameId;
	}

	gameModal.style.display = "flex";
	nameInput.focus();
}

function openEntryModal(entry = null) {
	const title = document.getElementById("entry-modal-title");
	const readingInput = document.getElementById("entry-reading");
	const wordInput = document.getElementById("entry-word");
	const categoryInput = document.getElementById("entry-category");
	const descriptionInput = document.getElementById("entry-description");

	if (entry) {
		title.textContent = "単語編集";
		readingInput.value = entry.reading;
		wordInput.value = entry.word;
		categoryInput.value = entry.category_id;
		descriptionInput.value = entry.description || "";
		entryForm.dataset.entryId = entry.id;
	} else {
		title.textContent = "単語追加";
		readingInput.value = "";
		wordInput.value = "";
		categoryInput.value = "";
		descriptionInput.value = "";
		delete entryForm.dataset.entryId;
	}

	entryModal.style.display = "flex";
	readingInput.focus();
}

function closeModals() {
	gameModal.style.display = "none";
	entryModal.style.display = "none";
}

// Form submission handlers
async function onGameSubmit(e) {
	e.preventDefault();

	const name = document.getElementById("game-name").value.trim();
	if (!name) return;

	try {
		const gameId = gameForm.dataset.gameId;
		if (gameId) {
			await window.electronAPI.games.update(parseInt(gameId), { name });
		} else {
			await window.electronAPI.games.create({ name });
		}

		closeModals();
		await loadGames();
		showSuccess(gameId ? "ゲームを更新しました" : "ゲームを追加しました");
	} catch (error) {
		console.error("Failed to save game:", error);
		showError("ゲームの保存に失敗しました");
	}
}

async function onEntrySubmit(e) {
	e.preventDefault();

	const reading = document.getElementById("entry-reading").value.trim();
	const word = document.getElementById("entry-word").value.trim();
	const categoryId = parseInt(document.getElementById("entry-category").value);
	const description =
		document.getElementById("entry-description").value.trim() || null;

	if (!reading || !word || !categoryId || !currentGame) return;

	try {
		const entryId = entryForm.dataset.entryId;
		const data = {
			game_id: currentGame,
			category_id: categoryId,
			reading,
			word,
			description,
		};

		if (entryId) {
			await window.electronAPI.entries.update(parseInt(entryId), data);
		} else {
			await window.electronAPI.entries.create(data);
		}

		closeModals();
		await loadEntries(currentGame);
		showSuccess(entryId ? "単語を更新しました" : "単語を追加しました");
	} catch (error) {
		console.error("Failed to save entry:", error);
		showError("単語の保存に失敗しました");
	}
}

// Rendering functions
function renderEntries(entries) {
	if (!entries || entries.length === 0) {
		entriesList.innerHTML =
			'<div class="no-entries"><p>該当する単語がありません</p></div>';
		return;
	}

	const html = entries
		.map((entry) => {
			const category = allCategories.find((c) => c.id === entry.category_id);
			const categoryName = category ? category.name : "Unknown";

			return `
            <div class="entry-item">
                <div class="entry-content">
                    <div class="entry-word">${escapeHtml(entry.word)}</div>
                    <div class="entry-reading">${escapeHtml(entry.reading)}</div>
                    <div class="entry-meta">
                        <span>カテゴリ: ${escapeHtml(categoryName)}</span>
                    </div>
                    ${entry.description ? `<div class="entry-description">${escapeHtml(entry.description)}</div>` : ""}
                </div>
                <div class="entry-actions">
                    <button class="btn btn-secondary" onclick="editEntry(${entry.id})">編集</button>
                    <button class="btn btn-secondary" onclick="deleteEntry(${entry.id})">削除</button>
                </div>
            </div>
        `;
		})
		.join("");

	entriesList.innerHTML = html;
}

// Entry actions
async function editEntry(entryId) {
	try {
		const entry = await window.electronAPI.entries.getById(entryId);
		openEntryModal(entry);
	} catch (error) {
		console.error("Failed to load entry:", error);
		showError("単語の読み込みに失敗しました");
	}
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
async function onExportCsv() {
	if (!currentGame) {
		showError("ゲームを選択してください");
		return;
	}

	try {
		const gameId = currentGame;
		const suggestedPaths = await window.electronAPI.csv.getSuggestedPaths(gameId);

		// Show export options
		const exportType = prompt(`エクスポート形式を選択してください:
1. Git管理用CSV (全データ)
2. Google日本語入力用
3. MS-IME用
4. ATOK用

番号を入力してください (1-4):`);

		let result;
		switch (exportType) {
			case "1":
				result = await window.electronAPI.csv.exportToGitCsv();
				break;
			case "2":
				result = await window.electronAPI.csv.exportToImeCsv(gameId, "google");
				break;
			case "3":
				result = await window.electronAPI.csv.exportToImeCsv(gameId, "ms");
				break;
			case "4":
				result = await window.electronAPI.csv.exportToImeCsv(gameId, "atok");
				break;
			default:
				showError("無効な選択です");
				return;
		}

		if (result.success) {
			showSuccess(`CSVファイルを出力しました: ${result.path}`);
		}
	} catch (error) {
		console.error("CSV export failed:", error);
		showError(`CSV出力に失敗しました: ${error.message}`);
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
	// TODO: Implement proper toast notifications
	alert(message);
}

function showError(message) {
	// TODO: Implement proper error notifications
	alert(message);
}
