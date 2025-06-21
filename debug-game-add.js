// デバッグ用：ゲーム追加機能の動作確認
// ブラウザのコンソールで実行

console.log('=== ゲーム追加デバッグ ===');

// 1. electronAPI が利用可能か確認
console.log('electronAPI available:', typeof window.electronAPI);
console.log('games API available:', typeof window.electronAPI?.games);

// 2. 既存ゲーム一覧を取得
window.electronAPI.games.getAll()
  .then(games => {
    console.log('既存ゲーム:', games);
  })
  .catch(error => {
    console.error('ゲーム取得エラー:', error);
  });

// 3. テストでゲーム作成
window.electronAPI.games.create({ name: 'デバッグテストゲーム' })
  .then(result => {
    console.log('ゲーム作成成功:', result);
    return window.electronAPI.games.getAll();
  })
  .then(games => {
    console.log('作成後のゲーム一覧:', games);
  })
  .catch(error => {
    console.error('ゲーム作成エラー:', error);
  });