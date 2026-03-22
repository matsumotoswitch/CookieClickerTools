// autogarden.js
(function() {
	let gardenInterval = null;

	// 設定状態を監視して、必要に応じてインターバルタイマーを起動・停止する関数
	function updateAutoGardenState() {
		const isActive = CCTools.config['autoWeeding'] || 
		                 CCTools.config['autoHarvestNew'] || 
		                 CCTools.config['autoHarvestDying'] ||
		                 CCTools.config['autoPlant'];
		
		if (isActive && !gardenInterval) {
			// 3秒ごとにガーデンの状態をチェックする
			gardenInterval = setInterval(processGarden, 3000);
		} else if (!isActive && gardenInterval) {
			clearInterval(gardenInterval);
			gardenInterval = null;
		}
	}

	// 日本Wiki準拠の効率的な配置テンプレート (0:空き, 1:種1, 2:種2)
	const layouts = {
		'none': null,
		'1species': [
			'110110',
			'110110',
			'000000',
			'110110',
			'110110',
			'000000'
		],
		'2species': [
			'100100',
			'020020',
			'000000',
			'100100',
			'020020',
			'000000'
		],
		'jqb': [
			'111111',
			'101101',
			'111111',
			'111111',
			'101101',
			'111111'
		]
	};

	// プルダウン用の選択肢データ
	const layoutOptions = [
		{ value: 'none', label: '自動作付しない' },
		{ value: '1species', label: '1種交配用 (6x6)' },
		{ value: '2species', label: '2種交配用 (6x6)' },
		{ value: 'jqb', label: 'JQB(あまーい女王ビート)用 (6x6)' }
	];

	// ゲーム内の植物データを取得して種の選択肢を作成
	const plantOptions = [{ value: '-1', label: 'なし' }];
	if (typeof Game !== 'undefined' && Game.Objects['Farm'] && Game.Objects['Farm'].minigameLoaded) {
		Game.Objects['Farm'].minigame.plantsById.forEach((p, i) => {
			plantOptions.push({ value: String(i), label: p.name });
		});
	} else {
		for (let i = 0; i < 34; i++) plantOptions.push({ value: String(i), label: `Plant ID: ${i}` });
	}

	// 農場関連の設定をUIに追加（グループ「農場 (Garden)」でまとめる）
	CCTools.addSetting('autoWeeding', '雑草の自動駆除', 'toggle', true, updateAutoGardenState, { group: '農場 (Garden)' });
	CCTools.addSetting('autoHarvestNew', '未解放の種の自動収穫', 'toggle', true, updateAutoGardenState, { group: '農場 (Garden)' });
	CCTools.addSetting('autoHarvestDying', '枯れる直前の自動収穫', 'toggle', true, updateAutoGardenState, { group: '農場 (Garden)' });
	CCTools.addSetting('autoPlant', '自動作付 (Auto-Plant)', 'toggle', false, updateAutoGardenState, { group: '農場 (Garden)' });
	CCTools.addSetting('autoPlantLayout', '作付レイアウト', 'select', 'none', null, { group: '農場 (Garden)', selectOptions: layoutOptions });
	CCTools.addSetting('autoPlantSeed1', '種1 (レイアウトの「1」)', 'select', '-1', null, { group: '農場 (Garden)', selectOptions: plantOptions });
	CCTools.addSetting('autoPlantSeed2', '種2 (レイアウトの「2」)', 'select', '-1', null, { group: '農場 (Garden)', selectOptions: plantOptions });

	/**
	 * ガーデンの状態をチェックし、条件に一致する植物を収穫・駆除します
	 */
	function processGarden() {
		const farm = Game.Objects['Farm'];
		// ミニゲーム(ガーデン)が解放・ロードされていない場合はスキップ
		if (!farm || !farm.minigameLoaded || !farm.minigame) return;
		const M = farm.minigame;

		// ガーデンは最大6x6のグリッド
		for (let y = 0; y < 6; y++) {
			for (let x = 0; x < 6; x++) {
				// 現在の農場レベルで解放されていないタイルの場合はスキップ
				if (!M.isTileUnlocked(x, y)) continue;

				const tile = M.plot[y][x];
				// タイルが空（0）の場合はスキップ
				if (tile[0] === 0) continue; 

				// plantIdはプロットの値から-1したもの
				const plant = M.plantsById[tile[0] - 1];
				const age = tile[1];

				// 1. 雑草の駆除 (Meddleweed, Crumbsporeなど weed プロパティがtrueのもの)
				if (CCTools.config['autoWeeding'] && plant.weed) {
					M.harvest(x, y);
					continue;
				}

				// 2. 未解放の種の収穫 (成熟したタイミングで即収穫し、種をアンロックする)
				if (CCTools.config['autoHarvestNew'] && !plant.unlocked && age >= plant.mature) {
					M.harvest(x, y);
					continue;
				}

				// 3. 枯れる直前の収穫 (Elderwortなどの不死の植物は除く)
				if (CCTools.config['autoHarvestDying'] && !plant.immortal && age >= plant.mature) {
					// 次のTickで加算される最大の年齢(ageTick + ageTickR)に、土壌バフなどのブレを考慮したマージンを加算
					// この値を足して寿命(life)を超えるようであれば、次のTickで枯れる可能性が高いと判定する
					const maxAgeJump = Math.ceil((plant.ageTick + plant.ageTickR) * 1.5) + 2; 
					
					if (age + maxAgeJump >= plant.life) {
						M.harvest(x, y);
						continue;
					}
				}
			}
		}

		// 4. 自動作付 (Auto-Plant)
		if (CCTools.config['autoPlant']) {
			const layoutKey = CCTools.config['autoPlantLayout'];
			const seed1 = parseInt(CCTools.config['autoPlantSeed1'], 10);
			const seed2 = parseInt(CCTools.config['autoPlantSeed2'], 10);
			const layout = layouts[layoutKey];

			if (layout && layoutKey !== 'none') {
				for (let y = 0; y < 6; y++) {
					for (let x = 0; x < 6; x++) {
						if (!M.isTileUnlocked(x, y)) continue; // 解放されていないマスは無視
						
						const tile = M.plot[y][x];
						if (tile[0] !== 0) continue; // 既に何かが植えられている場合はスキップ

						const layoutChar = layout[y][x];
						let targetSeed = -1;
						if (layoutChar === '1') targetSeed = seed1;
						else if (layoutChar === '2') targetSeed = seed2;

						if (targetSeed >= 0) {
							const plant = M.plantsById[targetSeed];
							// 種がアンロック済で、かつクッキー費用が足りている場合のみ植える
							if (plant && plant.unlocked && M.canPlant(plant)) {
								M.useTool(targetSeed, x, y);
							}
						}
					}
				}
			}
		}
	}

	// 初期化
	updateAutoGardenState();
})();
