/**
 * 自動保存機能のUI制御モジュール
 */

// DOM要素
const DOM = {
	autoSaveBadge: document.getElementById("auto-save-badge"),
	autoSaveLastTime: document.getElementById("auto-save-last-time"),
	autoSaveNextTime: document.getElementById("auto-save-next-time"),
	autoSaveToggle: document.getElementById("auto-save-toggle"),
	autoSaveWarningModal: document.getElementById("auto-save-warning-modal"),
	autoSaveWarningMessage: document.getElementById("auto-save-warning-message"),
	autoSaveSizeChanges: document.getElementById("auto-save-size-changes"),
	acknowledgeAutoSaveBtn: document.getElementById("acknowledge-auto-save-btn"),
};

/**
 * 自動保存のステータスを更新
 */
async function updateAutoSaveStatus() {
	try {
		const status = await window.electronAPI.autoSave.getStatus();

		// バッジの更新
		if (status.enabled) {
			DOM.autoSaveBadge.textContent = "自動保存: 有効";
			DOM.autoSaveBadge.className = "badge badge-success";
		} else {
			DOM.autoSaveBadge.textContent = "自動保存: 無効";
			DOM.autoSaveBadge.className = "badge badge-secondary";
		}

		// トグルの状態を更新
		DOM.autoSaveToggle.checked = status.enabled;

		// 最終保存時刻の更新
		if (status.lastSaveTime) {
			const lastTime = new Date(status.lastSaveTime);
			DOM.autoSaveLastTime.textContent = `最終保存: ${formatDateTime(lastTime)}`;
		} else {
			DOM.autoSaveLastTime.textContent = "-";
		}

		// 次回保存予定時刻の更新
		if (status.nextSaveTime && status.enabled) {
			const nextTime = new Date(status.nextSaveTime);
			DOM.autoSaveNextTime.textContent = `次回保存: ${formatDateTime(nextTime)}`;
		} else {
			DOM.autoSaveNextTime.textContent = "-";
		}
	} catch (error) {
		console.error("Failed to update auto-save status:", error);
	}
}

/**
 * 日時をフォーマット
 */
function formatDateTime(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const seconds = String(date.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * ファイルサイズをフォーマット
 */
function formatFileSize(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 自動保存トグルの変更イベント
 */
DOM.autoSaveToggle.addEventListener("change", async (event) => {
	const enabled = event.target.checked;

	try {
		if (enabled) {
			await window.electronAPI.autoSave.start();
			console.log("Auto-save started");
		} else {
			await window.electronAPI.autoSave.stop();
			console.log("Auto-save stopped");
		}

		await updateAutoSaveStatus();
	} catch (error) {
		console.error("Failed to toggle auto-save:", error);
		// エラーが発生した場合は元に戻す
		event.target.checked = !enabled;
	}
});

/**
 * 自動保存結果のハンドラー
 */
window.electronAPI.autoSave.onResult((result) => {
	console.log("Auto-save result:", result);

	if (result.skipped && result.reason === "size_decreased") {
		// ファイルサイズが減少した場合の警告モーダルを表示
		showSizeDecreaseWarning(result);
	} else if (result.success) {
		// 正常に保存が完了した場合
		console.log("Auto-save completed successfully");
	}

	// ステータスを更新
	updateAutoSaveStatus();

	// スクレイパーが保留CSVを追加している可能性があるためバッジを更新
	window.refreshInboxBadge?.();
});

/**
 * ファイルサイズ減少警告モーダルを表示
 */
function showSizeDecreaseWarning(result) {
	if (!result.sizeChanges || result.sizeChanges.length === 0) {
		return;
	}

	// 警告メッセージの生成
	DOM.autoSaveWarningMessage.textContent =
		"以下のファイルでデータサイズが減少しています。手動で確認してください。";

	// サイズ変更の詳細を生成
	const changesHtml = result.sizeChanges
		.map((change) => {
			const fileName = change.filePath.split("/").pop();
			return `
            <div class="size-change-item">
                <strong>${fileName}</strong><br>
                ${formatFileSize(change.oldSize)} → ${formatFileSize(change.newSize)}
                (${formatFileSize(change.oldSize - change.newSize)} 減少)
            </div>
        `;
		})
		.join("");

	DOM.autoSaveSizeChanges.innerHTML = changesHtml;

	// モーダルを表示
	DOM.autoSaveWarningModal.style.display = "flex";
}

/**
 * 確認済みボタンのクリックイベント
 */
DOM.acknowledgeAutoSaveBtn.addEventListener("click", async () => {
	try {
		await window.electronAPI.autoSave.acknowledgeSkip();
		DOM.autoSaveWarningModal.style.display = "none";
		await updateAutoSaveStatus();
	} catch (error) {
		console.error("Failed to acknowledge skip:", error);
	}
});

/**
 * 初期化
 */
document.addEventListener("DOMContentLoaded", async () => {
	await updateAutoSaveStatus();

	// 定期的にステータスを更新（UIの次回保存時刻を更新するため）
	setInterval(updateAutoSaveStatus, 10000); // 10秒ごと
});

export { updateAutoSaveStatus };
