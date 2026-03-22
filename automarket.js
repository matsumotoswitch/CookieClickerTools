// automarket.js
(function() {
	let marketInterval = null;
	let isFirstOpe = true;
	const customMode = ['Stable', 'Slow Rise', 'Slow Fall', 'Fast Rise', 'Fast Fall', 'Chaotic'];

	// 株式自動売買のON/OFFトグル設定
	CCTools.addSetting('autoMarket', '株式市場の自動売買', 'toggle', true, (isActive) => {
		if (isActive) {
			startAutoMarket();
		} else {
			stopAutoMarket();
		}
	}, { group: '銀行 (Stock Market)' });

	function startAutoMarket() {
		if (marketInterval) return;
		isFirstOpe = true;
		
		marketInterval = setInterval(() => {
			const bank = Game.Objects['Bank'];
			if (!bank || !bank.minigameLoaded || !bank.minigame) return;
			const M = bank.minigame;

			// Broker(仲介人)が100人未満のときは手数料が高いため売買しない
			if (M.brokers < 100) return;

			const LOWER_THRESHOLD = 0.8;
			const UPPER_THRESHOLD = 1.2;

			if (isFirstOpe) {
				M.goodsById.forEach((me, id) => {
					const restingVal = 10 + 10 * id + (bank.level - 1);
					console.log(`[CCTools] AutoMarket - ID:${id}(${me.symbol}) Resting:${restingVal.toLocaleString()} Current:${me.val.toLocaleString()} Mode:${me.mode}(${customMode[me.mode]})`);
				});
				isFirstOpe = false;
			}
			
			M.goodsById.forEach((me, id) => {
				const restingVal = 10 + 10 * id + (bank.level - 1);
				const currentVal = me.val;
				const stockBeforeTrade = me.stock;
				
				if (currentVal < restingVal * LOWER_THRESHOLD) {
					if (stockBeforeTrade === M.getGoodMaxStock(me)) return;
					if (me.mode === 2 || me.mode === 4) return; // 下落モードの時は待つ
					M.buyGood(id, 10000);
				} else if (currentVal > restingVal * UPPER_THRESHOLD) {
					if (stockBeforeTrade === 0) return;
					if (me.mode === 1 || me.mode === 3) return; // 上昇モードの時は待つ
					M.sellGood(id, 10000);
				}

				if (stockBeforeTrade !== me.stock) {
					console.log(`[CCTools] AutoMarket - ID:${id}(${me.symbol}) Resting:${restingVal.toLocaleString()} Current:${currentVal.toLocaleString()} Mode:${me.mode}(${customMode[me.mode]}) Stock:${stockBeforeTrade.toLocaleString()} => ${me.stock.toLocaleString()}`);
				}
			});
		}, 1000 * 60); // 60秒ごとに実行
	}

	function stopAutoMarket() {
		if (marketInterval) clearInterval(marketInterval);
		marketInterval = null;
	}

	// 初期化
	if (CCTools.config['autoMarket']) startAutoMarket();
})();
