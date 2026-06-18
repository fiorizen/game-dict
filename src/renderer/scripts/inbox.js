let inboxCategories = [];

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

	const defaultCategory = entry.categoryName || "固有名詞";
	const categoryOptions = inboxCategories
		.map(
			(c) =>
				`<option value="${c.id}"${c.name === defaultCategory ? " selected" : ""}>${c.name}</option>`,
		)
		.join("");

	tr.innerHTML = `
		<td><span class="game-badge">${escapeHtml(entry.gameName)}</span></td>
		<td>${escapeHtml(entry.word)}</td>
		<td>${escapeHtml(entry.description)}</td>
		<td><input type="text" class="entry-input yomi-input" placeholder="よみを入力..." value="${escapeHtml(entry.reading)}" required></td>
		<td><select class="entry-select category-select">${categoryOptions}</select></td>
		<td class="entry-actions-inline">
			<button class="btn btn-primary btn-small confirm-btn">確定</button>
			<button class="btn btn-danger btn-small discard-btn">却下</button>
		</td>
	`;

	const yomiInput = tr.querySelector(".yomi-input");
	const categorySelect = tr.querySelector(".category-select");

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

function removeRow(tr) {
	tr.remove();
	const remaining = document.querySelectorAll(
		"#inbox-table-body .pending-entry",
	).length;
	updateInboxBadge(remaining);
	document.getElementById("inbox-count-header").textContent =
		`（${remaining}件）`;
	if (remaining === 0) {
		document.getElementById("inbox-table").style.display = "none";
		document.getElementById("inbox-empty").style.display = "block";
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
	refreshInboxBadge();
});
