/**
 * 共通ユーティリティ関数
 * DOM操作、バリデーション、エラーハンドリングなどの汎用機能
 */

// エラーハンドリング
export function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

export function showSuccess(message) {
	showToast(message, "success");
}

export function showError(message) {
	showToast(message, "error");
}

export function showToast(message, type = "info") {
	// Remove existing toasts
	document.querySelectorAll(".toast").forEach((toast) => toast.remove());

	const toast = document.createElement("div");
	toast.className = `toast toast-${type}`;
	toast.innerHTML = `
		<div class="toast-content">
			<span class="toast-icon">
				${
					type === "success"
						? "✓"
						: type === "error"
							? "✗"
							: type === "warning"
								? "⚠"
								: "ℹ"
				}
			</span>
			<span class="toast-message">${escapeHtml(message)}</span>
			<button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
		</div>
	`;

	// Add styles if not already present
	if (!document.getElementById("toast-styles")) {
		const style = document.createElement("style");
		style.id = "toast-styles";
		style.textContent = `
			.toast {
				position: fixed;
				top: 20px;
				right: 20px;
				background: white;
				border-radius: 8px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				z-index: 10000;
				animation: slideIn 0.3s ease;
				min-width: 300px;
				max-width: 500px;
			}
			.toast-content {
				display: flex;
				align-items: center;
				padding: 12px 16px;
				gap: 8px;
			}
			.toast-success { border-left: 4px solid #22c55e; }
			.toast-error { border-left: 4px solid #ef4444; }
			.toast-warning { border-left: 4px solid #f59e0b; }
			.toast-info { border-left: 4px solid #3b82f6; }
			.toast-icon {
				font-weight: bold;
				font-size: 16px;
			}
			.toast-success .toast-icon { color: #22c55e; }
			.toast-error .toast-icon { color: #ef4444; }
			.toast-warning .toast-icon { color: #f59e0b; }
			.toast-info .toast-icon { color: #3b82f6; }
			.toast-message {
				flex: 1;
				font-size: 14px;
				line-height: 1.4;
			}
			.toast-close {
				background: none;
				border: none;
				font-size: 18px;
				cursor: pointer;
				color: #666;
				padding: 0;
				width: 20px;
				height: 20px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.toast-close:hover {
				color: #333;
			}
			@keyframes slideIn {
				from {
					transform: translateX(100%);
					opacity: 0;
				}
				to {
					transform: translateX(0);
					opacity: 1;
				}
			}
		`;
		document.head.appendChild(style);
	}

	document.body.appendChild(toast);

	// Auto-remove after 5 seconds
	setTimeout(() => {
		if (toast.parentNode) {
			toast.style.animation = "slideIn 0.3s ease reverse";
			setTimeout(() => toast.remove(), 300);
		}
	}, 5000);
}

// フォームデータ抽出
export function getRowFormData(row) {
	const formData = {};
	const inputs = row.querySelectorAll("input, select, textarea");
	inputs.forEach((input) => {
		const name = input.name || input.id;
		if (name) {
			formData[name] = input.value.trim();
		}
	});
	return formData;
}

// バリデーション
export function validateEntryData(data) {
	const errors = [];

	if (!data.reading) {
		errors.push("読みを入力してください");
	}
	if (!data.word) {
		errors.push("単語を入力してください");
	}
	if (!data.category_id) {
		errors.push("カテゴリを選択してください");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

// ボタン状態管理
export function setButtonLoading(button, isLoading, loadingText = "処理中...") {
	if (!button.originalText) {
		button.originalText = button.textContent;
	}

	button.disabled = isLoading;
	button.textContent = isLoading ? loadingText : button.originalText;
}

// 重複チェック最適化用のSet管理
export class DuplicateChecker {
	constructor() {
		this.entrySet = new Set();
	}

	buildFromEntries(entries) {
		this.entrySet.clear();
		entries.forEach((entry) => {
			this.entrySet.add(`${entry.reading}:${entry.word}:${entry.category_id}`);
		});
	}

	isDuplicate(reading, word, categoryId) {
		return this.entrySet.has(`${reading}:${word}:${categoryId}`);
	}

	addEntry(reading, word, categoryId) {
		this.entrySet.add(`${reading}:${word}:${categoryId}`);
	}

	removeEntry(reading, word, categoryId) {
		this.entrySet.delete(`${reading}:${word}:${categoryId}`);
	}
}

// カテゴリ検索最適化
export class CategoryLookup {
	constructor() {
		this.categoryMap = new Map();
	}

	buildFromCategories(categories) {
		this.categoryMap.clear();
		categories.forEach((category) => {
			this.categoryMap.set(category.id, category);
		});
	}

	getCategory(id) {
		return this.categoryMap.get(id);
	}

	getAllCategories() {
		return Array.from(this.categoryMap.values());
	}
}
