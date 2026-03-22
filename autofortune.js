// autofortune.js
(function() {
	let fortuneInterval = null;

	// フォーチュンクッキー自動クリックのON/OFFトグル設定
	CCTools.addSetting('autoFortune', 'フォーチュンクッキー自動クリック', 'toggle', true, (isActive) => {
		if (isActive) {
			startAutoFortune();
		} else {
			stopAutoFortune();
		}
	}, { group: 'ニュースティッカー (News Ticker)' });

	/**
	 * フォーチュンクッキーの自動クリックを開始します。
	 */
	function startAutoFortune() {
		if (fortuneInterval) return;
		
		fortuneInterval = setInterval(() => {
			if (Game.TickerEffect && Game.TickerEffect.type === 'fortune') {
				Game.tickerL.click();
			}
		}, 1000 / 250);
	}

	function stopAutoFortune() {
		if (fortuneInterval) clearInterval(fortuneInterval);
		fortuneInterval = null;
	}

	// 初期化
	if (CCTools.config['autoFortune']) startAutoFortune();
})();