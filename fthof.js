// fthof.js
(function() {
	let fthofInterval = null;

	// 予測表示のON/OFFトグル設定を追加
	CCTools.addSetting('showFtHoF', 'Force the Hand of Fate 予測表示', 'toggle', true, (isActive) => {
		if (isActive) {
			startFthofPredictor();
		} else {
			stopFthofPredictor();
		}
	});

	/**
	 * 配列からランダムに要素を取得するヘルパー関数
	 * (ゲーム本体の乱数ロジックをシミュレートするために使用)
	 */
	function choose(arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	/**
	 * 魔法の結果（バフ内容）をシミュレートして返します
	 * @param {boolean} isSuccess - 魔法が成功したかどうか
	 * @param {number} seasonBounces - 季節要因などによる追加の乱数消費回数
	 * @returns {string} 魔法の効果名
	 */
	function simulateSpellResult(isSuccess, seasonBounces) {
		// 内部の基本消費
		Math.random(); 
		Math.random(); 
		// 季節等による消費シミュレート
		for (let k = 0; k < seasonBounces; k++) Math.random(); 
		
		let choices = [];
		if (isSuccess) {
			choices = ['Frenzy', 'Lucky'];
			if (!Game.hasBuff('Dragonflight')) choices.push('Click Frenzy');
			if (Math.random() < 0.1) choices.push('Cookie Storm', 'Cookie Storm', 'Blab');
			if (Game.BuildingsOwned >= 10 && Math.random() < 0.25) choices.push('Building Special');
			if (Math.random() < 0.15) choices = ['Cookie Storm Drop'];
			if (Math.random() < 0.0001) choices.push('Free Sugar Lump');
			return choose(choices);
		} else {
			choices = ['Clot', 'Ruin Cookies'];
			if (Math.random() < 0.1) choices.push('Cursed Finger', 'Elder Frenzy');
			if (Math.random() < 0.003) choices.push('Free Sugar Lump');
			if (Math.random() < 0.1) choices = ['Blab'];
			return choose(choices);
		}
	}

	/**
	 * Force the Hand of Fate の予測テーブルを生成するメインロジック
	 * 内部乱数(seedrandom)を使用して、次から10回分の魔法の結果をシミュレートします。
	 */
	function getPrediction() {
		const tower = Game.Objects['Wizard tower'];
		// 魔法塔がない、またはミニゲーム（グリモア）が未解放の場合はメッセージを表示
		if (!tower || !tower.minigameLoaded || !tower.minigame) {
			return '<p style="text-align:center; padding:10px;">グリモアがまだ解放されていません。</p>';
		}

		const M = tower.minigame;
		const spell = M.spells['hand of fate'];
		const spellTotal = M.spellsCastTotal;
		const isSpecialSeason = (Game.season === 'easter' || Game.season === 'valentines');
		const randcounter = isSpecialSeason ? 1 : 0;

		let html = `
			<p>
				<h3 style="color:#cccccc; text-align:center; padding-top: 5px;">Force the Hand of Fate 予測</h3>
				<table style="margin:auto; width:100%; text-align:center; font-size:12px;">
					<tr>
						<th></th>
						<th style="text-align:center;"><span style="font-weight:bold; color:${randcounter === 0 ? '#ffcc00' : '#cccccc'};">Other Seasons</span></th>
						<th style="text-align:center;"><span style="font-weight:bold; color:${randcounter === 0 ? '#cccccc' : '#ffcc00'};">Easter / Valentine</span></th>
					</tr>
		`;

		for (let i = 1; i <= 10; i++) {
			html += `<tr><td style="color:#cccccc; text-align:right; width:20px; padding-right:10px;">${i}</td>`;
			
			for (let j = 0; j <= 1; j++) {
				// クッキークリッカー標準の乱数シード設定（グローバルのMath.randomを一時的に上書き）
				Math.seedrandom(Game.seed + '/' + (spellTotal + i - 1));
				
				// 成功判定 (元のスクリプトの isFail のロジック。条件を満たせば成功)
				let failChance = M.getFailChance(spell);
				const isSuccess = Math.random() < (1 - failChance);

				const spellResult = simulateSpellResult(isSuccess, j);

				let color = '';
				if (isSuccess) {
					color = (randcounter === j) ? '#ffcc00' : '#cccccc';
				} else {
					color = (randcounter === j) ? '#ff6666' : '#ff9999';
				}
				
				html += `<td style="margin:1px; border-bottom:1px solid #444; padding:2px; text-align:left; color:${color};">${spellResult}</td>`;
			}
			html += '</tr>';
		}

		html += '</table></p>';

		// 処理が終わったらグローバルの乱数を元の状態（ランダム）に戻す
		Math.seedrandom();
		
		return html;
	}

	/**
	 * グリモアのミニゲーム画面に予測テーブルを挿入・更新します
	 */
	function updatePanel() {
		const grimoireContent = document.getElementById("grimoireContent");
		if (!grimoireContent) return;

		let panel = document.getElementById("cctools-fthof-panel");
		if (!panel) {
			panel = document.createElement('div');
			panel.id = "cctools-fthof-panel";
			panel.className = "framed note";
			panel.style.cssText = 'margin:8px auto; position:relative; left:0px; width:420px; max-width:95%; padding-bottom: 8px; box-sizing:border-box;';
			grimoireContent.appendChild(panel);
		}
		panel.innerHTML = getPrediction();
	}

	/**
	 * パネルの定期更新タイマーを開始します
	 */
	function startFthofPredictor() {
		if (fthofInterval) return;
		updatePanel();
		fthofInterval = setInterval(() => {
			// ミニゲーム画面が開いている時だけ更新処理を行う
			if (document.getElementById("grimoireContent")) {
				updatePanel();
			}
		}, 1000);
	}

	/**
	 * パネルの定期更新タイマーを停止し、UIを削除します
	 */
	function stopFthofPredictor() {
		if (fthofInterval) {
			clearInterval(fthofInterval);
			fthofInterval = null;
		}
		const panel = document.getElementById("cctools-fthof-panel");
		if (panel) {
			panel.remove();
		}
	}

	// 再読み込み時などに、設定がONになっていれば起動する
	if (CCTools.config['showFtHoF']) {
		startFthofPredictor();
	}
})();