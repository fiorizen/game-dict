let inboxCategories = [];
const inboxEntries = new WeakMap();

async function loadInbox() {
	try {
		const [entries, categories] = await Promise.all([
			window.electronAPI.pending.getAll(),
			window.electronAPI.categories.getAll(),
		]);
		inboxCategories = categories;
		renderInbox(entries);
		updateInboxBadge(entries.length);
	} catch (error) {
		console.error("Inbox load failed:", error);
	}
}

function renderInbox(entries) {
	const tbody = document.getElementById("inbox-table-body");
	const emptyMsg = document.getElementById("inbox-empty");
	const table = document.getElementById("inbox-table");
	const countHeader = document.getElementById("inbox-count-header");

	tbody.innerHTML = "";

	if (countHeader) {
		countHeader.textContent = `（${entries.length}件）`;
	}

	if (entries.length === 0) {
		table.style.display = "none";
		emptyMsg.style.display = "block";
		return;
	}

	table.style.display = "";
	emptyMsg.style.display = "none";

	for (const entry of entries) {
		tbody.appendChild(createInboxRow(entry));
	}
}

function createInboxRow(entry) {
	const tr = document.createElement("tr");
	tr.className = "pending-entry";
	inboxEntries.set(tr, entry);

	const defaultCategory = entry.categoryName || "固有名詞";
	const categoryOptions = inboxCategories
		.map(
			(c) =>
				`<option value="${c.id}"${c.name === defaultCategory ? " selected" : ""}>${c.name}</option>`,
		)
		.join("");

	tr.innerHTML = `
		<td><span class="game-badge">${escapeHtml(entry.gameName)}</span></td>
		<td><input type="text" class="entry-input word-input" value="${escapeHtml(entry.word)}"></td>
		<td>${escapeHtml(entry.description)}</td>
		<td><input type="text" class="entry-input yomi-input" placeholder="よみを入力..." value="${escapeHtml(entry.reading)}" required></td>
		<td><select class="entry-select category-select">${categoryOptions}</select></td>
		<td class="entry-actions-inline">
			<button class="btn btn-primary btn-small confirm-btn">確定</button>
			<button class="btn btn-danger btn-small discard-btn">却下</button>
		</td>
	`;

	const wordInput = tr.querySelector(".word-input");
	const yomiInput = tr.querySelector(".yomi-input");
	const categorySelect = tr.querySelector(".category-select");

	wordInput.addEventListener("blur", () => updateWord(entry, wordInput));
	tr.querySelector(".confirm-btn").addEventListener("click", () =>
		confirmEntry(tr, entry, yomiInput, categorySelect),
	);
	tr.querySelector(".discard-btn").addEventListener("click", () =>
		discardEntry(tr, entry),
	);
	yomiInput.addEventListener("keydown", (e) => {
		// IME変換確定のEnterで誤って確定/行削除しない
		if (e.isComposing) return;
		if (e.key === "Enter") {
			e.preventDefault();
			confirmEntry(tr, entry, yomiInput, categorySelect);
		}
	});

	return tr;
}

async function confirmEntry(tr, entry, yomiInput, categorySelect) {
	const yomi = yomiInput.value.trim();
	if (!yomi) {
		yomiInput.classList.add("error");
		yomiInput.focus();
		return;
	}
	yomiInput.classList.remove("error");

	try {
		await window.electronAPI.pending.confirm(
			entry.gameCode,
			entry.word,
			entry.description,
			yomi,
			Number.parseInt(categorySelect.value, 10),
		);
		removeRow(tr);
		showSuccess(`「${entry.word}」を確定しました`);
	} catch (error) {
		showError(`確定に失敗しました: ${error.message}`);
	}
}

async function discardEntry(tr, entry) {
	try {
		await window.electronAPI.pending.discard(entry.gameCode, entry.word);
		removeRow(tr);
		showSuccess(`「${entry.word}」を却下しました`);
	} catch (error) {
		showError(`却下に失敗しました: ${error.message}`);
	}
}

async function updateWord(entry, wordInput) {
	const newWord = wordInput.value.trim();
	if (newWord === entry.word) return;

	try {
		await window.electronAPI.pending.updateWord(
			entry.gameCode,
			entry.word,
			newWord,
		);
		entry.word = newWord;
		wordInput.value = newWord;
	} catch (error) {
		showError(`単語の更新に失敗しました: ${error.message}`);
		wordInput.value = entry.word;
	}
}

async function confirmAll() {
	const rows = Array.from(
		document.querySelectorAll("#inbox-table-body .pending-entry"),
	);
	const ready = rows.filter((tr) =>
		tr.querySelector(".yomi-input").value.trim(),
	);
	if (ready.length === 0) {
		showError("よみが入力された行がありません");
		return;
	}
	if (
		!window.confirm(
			`よみが入力された ${ready.length} 件を確定します。よろしいですか？`,
		)
	) {
		return;
	}

	let confirmed = 0;
	for (const tr of ready) {
		const entry = inboxEntries.get(tr);
		const yomiInput = tr.querySelector(".yomi-input");
		const categorySelect = tr.querySelector(".category-select");
		try {
			await window.electronAPI.pending.confirm(
				entry.gameCode,
				entry.word,
				entry.description,
				yomiInput.value.trim(),
				Number.parseInt(categorySelect.value, 10),
			);
			tr.remove();
			inboxEntries.delete(tr);
			confirmed++;
		} catch (error) {
			showError(`「${entry.word}」の確定に失敗しました: ${error.message}`);
		}
	}

	const skipped = rows.length - ready.length;
	showSuccess(
		skipped > 0
			? `${confirmed} 件を確定しました（${skipped} 件スキップ）`
			: `${confirmed} 件を確定しました`,
	);
	finalizeBatch();
}

async function discardAll() {
	const rows = Array.from(
		document.querySelectorAll("#inbox-table-body .pending-entry"),
	);
	if (rows.length === 0) return;
	if (
		!window.confirm(
			`保留中の ${rows.length} 件をすべて却下します。よろしいですか？`,
		)
	) {
		return;
	}

	let discarded = 0;
	for (const tr of rows) {
		const entry = inboxEntries.get(tr);
		try {
			await window.electronAPI.pending.discard(entry.gameCode, entry.word);
			tr.remove();
			inboxEntries.delete(tr);
			discarded++;
		} catch (error) {
			showError(`「${entry.word}」の却下に失敗しました: ${error.message}`);
		}
	}

	showSuccess(`${discarded} 件を却下しました`);
	finalizeBatch();
}

function finalizeBatch() {
	const remaining = document.querySelectorAll(
		"#inbox-table-body .pending-entry",
	).length;
	updateInboxBadge(remaining);
	document.getElementById("inbox-count-header").textContent =
		`（${remaining}件）`;
	if (remaining === 0) {
		showEmptyAndExit();
	}
}

function removeRow(tr) {
	tr.remove();
	inboxEntries.delete(tr);
	const remaining = document.querySelectorAll(
		"#inbox-table-body .pending-entry",
	).length;
	updateInboxBadge(remaining);
	document.getElementById("inbox-count-header").textContent =
		`（${remaining}件）`;
	if (remaining === 0) {
		showEmptyAndExit();
	}
}

// 0件になったら空メッセージを表示し、Inboxを解除してメインビューへ戻す
function showEmptyAndExit() {
	document.getElementById("inbox-table").style.display = "none";
	document.getElementById("inbox-empty").style.display = "block";
	const inboxView = document.getElementById("inbox-view");
	if (inboxView && inboxView.style.display !== "none") {
		toggleInboxView();
	}
}

async function refreshInboxBadge() {
	try {
		const entries = await window.electronAPI.pending.getAll();
		updateInboxBadge(entries.length);
	} catch (_error) {
		// バッジ更新失敗はサイレントに無視
	}
}

function updateInboxBadge(count) {
	const badge = document.getElementById("inbox-badge");
	if (!badge) return;
	if (count > 0) {
		badge.textContent = count;
		badge.style.display = "";
	} else {
		badge.style.display = "none";
	}
}

function toggleInboxView() {
	const mainView = document.getElementById("main-view");
	const inboxView = document.getElementById("inbox-view");
	const inboxBtn = document.getElementById("inbox-btn");

	const isInboxVisible = inboxView.style.display !== "none";

	if (isInboxVisible) {
		mainView.style.display = "";
		inboxView.style.display = "none";
		inboxBtn.classList.remove("active");
	} else {
		mainView.style.display = "none";
		inboxView.style.display = "";
		inboxBtn.classList.add("active");
		loadInbox();
	}
}

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
	const inboxBtn = document.getElementById("inbox-btn");
	if (inboxBtn) {
		inboxBtn.addEventListener("click", toggleInboxView);
	}
	const confirmAllBtn = document.getElementById("inbox-confirm-all");
	if (confirmAllBtn) {
		confirmAllBtn.addEventListener("click", confirmAll);
	}
	const discardAllBtn = document.getElementById("inbox-discard-all");
	if (discardAllBtn) {
		discardAllBtn.addEventListener("click", discardAll);
	}
	refreshInboxBadge();
});
