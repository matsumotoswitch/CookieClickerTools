// autogodzamok.js
(function() {
	let godzamokInterval = null;
	let ccFps = typeof Game !== 'undefined' ? Game.fps : 30;

	CCTools.addSetting('autoGodzamok', 'Godzamokの自動発動', 'toggle', true, (isActive) => {
		if (isActive) {
			startAutoGodzamok();
		} else {
			stopAutoGodzamok();
		}
	});

	// 売買対象の施設リストとチェックボックスUIの生成
	const targets = Object.keys(Game.Objects); // ゲーム内の全施設を自動取得
	targets.forEach(name => {
		CCTools.addSetting(`godzamok_${name}`, name, 'checkbox', name === 'Cursor' || name === 'Farm', null, { group: '売買対象' });
	});

	function startAutoGodzamok() {
		if (godzamokInterval) return;
		ccFps = Game.fps;

		godzamokInterval = setInterval(() => {
			const temple = Game.Objects['Temple'];
			if (!temple || !temple.minigameLoaded || !temple.minigame) return;

			let clickBuffBonus = 1;
			let cpsBuffBonus = 1;

			for (const i in Game.buffs) {
				const buff = Game.buffs[i];
				if (typeof buff.multClick !== 'undefined' && buff.name !== 'Devastation' && buff.name !== 'Click frenzy') {
					clickBuffBonus *= buff.multClick;
				}
				if (typeof buff.multCpS !== 'undefined' && buff.name !== 'Frenzy') {
					cpsBuffBonus *= buff.multCpS;
				}
			}

			if (!Game.hasBuff('Cursed finger') && (clickBuffBonus > 1 || cpsBuffBonus > 1)) {
				Game.fps = ccFps;

				// 対象の施設を売買
				targets.forEach(name => {
					if (CCTools.config[`godzamok_${name}`]) {
						const obj = Game.Objects[name];
						if (obj && obj.amount >= 100) {
							const amountToSell = name === 'Farm' ? obj.amount - 1 : obj.amount;
							obj.sell(amountToSell);
							obj.buy(amountToSell);
						}
					}
				});

				// 意図的なFPS低下ハック（バフ時間の延長目的）
				if (Game.fps !== 5) {
					ccFps = Game.fps;
					Game.fps = 5;
				}
			} else {
				Game.fps = ccFps;
			}
		}, 100);
	}

	function stopAutoGodzamok() {
		if (godzamokInterval) clearInterval(godzamokInterval);
		godzamokInterval = null;
		Game.fps = ccFps; // FPSを元に戻す
	}

	if (CCTools.config['autoGodzamok']) startAutoGodzamok();
})();