# Page snapshot

```yaml
- banner:
  - heading "IME辞書管理ツール" [level=1]
  - button "CSV出力"
  - button "CSV取込"
- main:
  - heading "ゲーム選択" [level=3]
  - combobox:
    - option "ゲームを選択..." [selected]
    - option "テストゲーム"
  - button "+ゲーム追加"
  - heading "カテゴリ" [level=3]
  - combobox:
    - option "全てのカテゴリ" [selected]
    - option "アイテム"
    - option "モンスター"
    - option "人名"
    - option "地名"
    - option "技名・スキル"
    - option "組織・団体"
  - heading "検索" [level=3]
  - textbox "読みや単語で検索..."
  - heading "ゲームを選択してください" [level=2]
  - button "+単語追加" [disabled]
  - paragraph: ゲームを選択して単語を管理してください
```