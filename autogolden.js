// autogolden.js
(function() {
	let shimmerInterval = null;

	// ゴールデンクッキー自動クリックのON/OFFトグル
	CCTools.addSetting('autoGoldenCookie', 'ゴールデンクッキー自動クリック', 'toggle', true, (isActive) => {
		updateShimmerClicker();
	}, { group: '黄金クッキー (Golden Cookie)' });

	// トナカイ自動クリックのON/OFFトグル
	CCTools.addSetting('autoReindeer', 'トナカイ自動クリック', 'toggle', true, (isActive) => {
		updateShimmerClicker();
	}, { group: '黄金クッキー (Golden Cookie)' });

	/**
	 * 設定状態を監視し、ゴールデンクッキーまたはトナカイの自動クリッカーを起動/停止します。
	 */
	function updateShimmerClicker() {
		// どちらかの設定がONならタイマーを起動、両方OFFなら停止
		if (CCTools.config['autoGoldenCookie'] || CCTools.config['autoReindeer']) {
			if (!shimmerInterval) {
				// 500ミリ秒ごとに画面上のshimmer（ゴールデンクッキーやトナカイ）を確認してクリック
				shimmerInterval = setInterval(() => {
					// 要素ズレを防ぐべく後ろからループ処理
					for (let i = Game.shimmers.length - 1; i >= 0; i--) {
						const type = Game.shimmers[i].type;
						if ((type === 'golden' && CCTools.config['autoGoldenCookie']) || 
						    (type === 'reindeer' && CCTools.config['autoReindeer'])) {
							Game.shimmers[i].pop();
						}
					}
				}, 500);
			}
		} else {
			if (shimmerInterval) {
				clearInterval(shimmerInterval);
				shimmerInterval = null;
			}
		}
	}

	// 初期化
	updateShimmerClicker();
})();