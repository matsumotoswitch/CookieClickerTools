// autoclicker.js
(function() {
	let bigCookieInterval = null;

	// CPS（1秒あたりのクリック数）の設定
	CCTools.addSetting('bigCookieCps', '大クッキーのクリック数/秒 (CPS)', 'number', 10, (value) => {
		// CPSが変更されたら、もし自動クリックがON状態であればタイマーを再設定して即座に反映
		if (CCTools.config['autoBigCookie']) {
			startBigCookieClicker();
		}
	});

	// 自動クリックのON/OFFトグル
	CCTools.addSetting('autoBigCookie', '大クッキー自動クリック', 'toggle', true, (isActive) => {
		if (isActive) {
			startBigCookieClicker();
		} else {
			stopBigCookieClicker();
		}
	});

	/**
	 * 大クッキーの自動クリックを開始する
	 * 既存のタイマーがあればクリアし、設定されたCPSに基づく間隔でクリックを実行します。
	 */
	function startBigCookieClicker() {
		stopBigCookieClicker();
		const cps = CCTools.config['bigCookieCps'];
		if (cps <= 0) return;
		
		const intervalMs = 1000 / cps; // CPSからインターバル(ミリ秒)を計算
		bigCookieInterval = setInterval(() => {
			Game.ClickCookie();
		}, intervalMs);
	}

	/**
	 * 大クッキーの自動クリックを停止する
	 */
	function stopBigCookieClicker() {
		if (bigCookieInterval) {
			clearInterval(bigCookieInterval);
			bigCookieInterval = null;
		}
	}

	// 初期化
	if (CCTools.config['autoBigCookie']) {
		startBigCookieClicker();
	}
})();
