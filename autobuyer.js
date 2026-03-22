// autobuyer.js
(function() {
	let autoBuyerInterval = null;

	// 施設自動購入のON/OFFトグル設定
	CCTools.addSetting('autoBuyBuildings', '施設の自動購入', 'toggle', true, (isActive) => {
		if (isActive) {
			startAutoBuyer();
		} else {
			stopAutoBuyer();
		}
	});

	/**
	 * 施設の自動購入を開始します。
	 * 定期的に所持クッキーを確認し、購入可能な最も高い施設を購入します。
	 */
	function startAutoBuyer() {
		if (autoBuyerInterval) return;
		
		autoBuyerInterval = setInterval(() => {
			// Game.ObjectsById を後ろ（高価な施設）から順番に確認する
			for (let i = Game.ObjectsById.length - 1; i >= 0; i--) {
				const obj = Game.ObjectsById[i];
				// 施設がロックされておらず、現在のクッキー数（Game.cookies）で買える場合
				if (!obj.locked && Game.cookies >= obj.bulkPrice) {
					obj.buy(1); // 1つ購入
					break; // 1回の処理につき1種類のみ購入
				}
			}
		}, 1000); // 1秒（1000ミリ秒）ごとに実行
	}

	function stopAutoBuyer() {
		if (autoBuyerInterval) clearInterval(autoBuyerInterval);
		autoBuyerInterval = null;
	}

	// 初期化
	if (CCTools.config['autoBuyBuildings']) startAutoBuyer();
})();