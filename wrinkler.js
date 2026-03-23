// wrinkler.js
(function() {
	// ホットキー機能のON/OFFトグル設定
	CCTools.addSetting('hotkeyWrinkler', '「W」キーで虫を一括駆除', 'toggle', true, null, { group: '補助系' });
	CCTools.addSetting('hotkeyShinyWrinkler', '「S」キーで虫を希少種に変換', 'toggle', true, null, { group: 'チート系' });

	// キーボード入力の監視
	document.addEventListener('keydown', (event) => {
		// 設定画面などのテキストボックス入力中はホットキーを無効にする（誤爆防止）
		if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
			return;
		}

		// 押されたキーが 'w' または 'W' の場合
		if ((event.key === 'w' || event.key === 'W') && CCTools.config['hotkeyWrinkler']) {
			if (typeof Game.CollectWrinklers === 'function') {
				Game.CollectWrinklers(); // ゲーム標準の一括駆除関数を実行
				Game.Notify('虫駆除完了', 'すべてのしわしわ虫を退治しました！', '', 2);
			}
		}

		// 押されたキーが 's' または 'S' の場合
		if ((event.key === 's' || event.key === 'S') && CCTools.config['hotkeyShinyWrinkler']) {
			if (typeof Game.wrinklers !== 'undefined') {
				let count = 0;
				for (let i = 0; i < Game.wrinklers.length; i++) {
					// 出現している（phase > 0）かつ通常種（type === 0）の虫を希少種（type = 1）にする
					if (Game.wrinklers[i].phase > 0 && Game.wrinklers[i].type === 0) {
						Game.wrinklers[i].type = 1;
						count++;
					}
				}
				if (count > 0) {
					Game.Notify('希少種変換完了', `${count}匹のしわしわ虫を希少種に変換しました！`, '', 2);
				}
			}
		}
	});
})();