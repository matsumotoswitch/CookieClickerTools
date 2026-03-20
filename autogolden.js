// autogolden.js
(function() {
	let shimmerInterval = null;

	// ゴールデンクッキー自動クリックのON/OFFトグル
	CCTools.addSetting('autoGoldenCookie', 'ゴールデンクッキー自動クリック', 'toggle', true, (isActive) => {
		updateShimmerClicker();
	});

	// トナカイ自動クリックのON/OFFトグル
	CCTools.addSetting('autoReindeer', 'トナカイ自動クリック', 'toggle', true, (isActive) => {
		updateShimmerClicker();
	});

	/**
	 * 設定状態を監視し、ゴールデンクッキーまたはトナカイの自動クリッカーを起動/停止します。
	 */
	function updateShimmerClicker() {
		// どちらかの設定がONならタイマーを起動、両方OFFなら停止
		if (CCTools.config['autoGoldenCookie'] || CCTools.config['autoReindeer']) {
			if (!shimmerInterval) {
				// 500ミリ秒ごとに画面上のshimmer（ゴールデンクッキーやトナカイ）を確認してクリック
				shimmerInterval = setInterval(() => {
					if (Game.shimmers.length > 0) {
						// shimmer.pop() は配列要素を削除するため、要素ズレを防ぐべく後ろからループ処理します
						for (let i = Game.shimmers.length - 1; i >= 0; i--) {
							const shimmer = Game.shimmers[i];
							if (shimmer.type === 'golden' && CCTools.config['autoGoldenCookie']) {
								shimmer.pop();
							} else if (shimmer.type === 'reindeer' && CCTools.config['autoReindeer']) {
								shimmer.pop();
							}
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

	// 再読み込み時などに状態を復元
	updateShimmerClicker();
})();