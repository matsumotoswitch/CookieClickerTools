// wrinkler.js
(function() {
	// ホットキー機能のON/OFFトグル設定
	CCTools.addSetting('hotkeyWrinkler', '「W」キーで虫を一括駆除', 'toggle', true);

	// キーボード入力の監視
	document.addEventListener('keydown', (event) => {
		// 機能がOFFの場合は処理しない
		if (!CCTools.config['hotkeyWrinkler']) return;
		
		// 設定画面などのテキストボックス入力中はホットキーを無効にする（誤爆防止）
		if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
			return;
		}

		// 押されたキーが 'w' または 'W' の場合
		if (event.key === 'w' || event.key === 'W') {
			if (typeof Game.CollectWrinklers === 'function') {
				Game.CollectWrinklers(); // ゲーム標準の一括駆除関数を実行
				Game.Notify('虫駆除完了', 'すべてのしわしわ虫を退治しました！', '', 2);
			}
		}
	});
})();