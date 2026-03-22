// autogarden.js
(function() {
	let gardenInterval = null;

	// 設定状態を監視して、必要に応じてインターバルタイマーを起動・停止する関数
	function updateAutoGardenState() {
		const isActive = CCTools.config['autoWeeding'] || 
		                 CCTools.config['autoHarvestNew'] || 
		                 CCTools.config['autoHarvestDying'] ||
		                 CCTools.config['autoPlant'] ||
		                 CCTools.config['autoCrossbreed'];
		
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
		],
		'everdaisy': [
			'111111',
			'222222',
			'000000',
			'000000',
			'111111',
			'222222'
		]
	};

	// プルダウン用の選択肢データ
	const layoutOptions = [
		{ value: 'none', label: '自動作付しない' },
		{ value: '1species', label: '1種交配用 (6x6)' },
		{ value: '2species', label: '2種交配用 (6x6)' },
		{ value: 'jqb', label: 'JQB(あまーい女王ビート)用 (6x6)' },
		{ value: 'everdaisy', label: 'Everdaisy用 (6x6)' }
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

	// 効率的な交配レシピ（優先度順：Wikiに基づくリストの上から評価）
	const crossbreedRecipes = [
		{ target: 'thumbcorn', p1: 'bakerWheat', p2: 'bakerWheat', layout: '1species' },
		{ target: 'bakeberry', p1: 'bakerWheat', p2: 'bakerWheat', layout: '1species' },
		{ target: 'cronerice', p1: 'bakerWheat', p2: 'thumbcorn', layout: '2species' },
		{ target: 'gildmillet', p1: 'thumbcorn', p2: 'cronerice', layout: '2species' },
		{ target: 'clover', p1: 'cronerice', p2: 'gildmillet', layout: '2species' },
		{ target: 'goldenClover', p1: 'bakerWheat', p2: 'gildmillet', layout: '2species' },
		{ target: 'shimmerlily', p1: 'clover', p2: 'gildmillet', layout: '2species' },
		{ target: 'elderwort', p1: 'shimmerlily', p2: 'cronerice', layout: '2species' },
		{ target: 'chocoroot', p1: 'bakerWheat', p2: 'brownMold', layout: '2species' },
		{ target: 'whiteMildew', p1: 'brownMold', p2: 'brownMold', layout: '1species' },
		{ target: 'whiteChocoroot', p1: 'chocoroot', p2: 'whiteMildew', layout: '2species' },
		{ target: 'wardlichen', p1: 'whiteMildew', p2: 'brownMold', layout: '2species' },
		{ target: 'greenRot', p1: 'whiteMildew', p2: 'clover', layout: '2species' },
		{ target: 'wrinklegill', p1: 'brownMold', p2: 'crumbspore', layout: '2species' },
		{ target: 'doughshroom', p1: 'crumbspore', p2: 'crumbspore', layout: '1species' },
		{ target: 'glovemore', p1: 'crumbspore', p2: 'thumbcorn', layout: '2species' },
		{ target: 'cheapcap', p1: 'crumbspore', p2: 'shimmerlily', layout: '2species' },
		{ target: 'foolBolete', p1: 'doughshroom', p2: 'greenRot', layout: '2species' },
		{ target: 'keenmoss', p1: 'greenRot', p2: 'brownMold', layout: '2species' },
		{ target: 'drowsyfern', p1: 'chocoroot', p2: 'keenmoss', layout: '2species' },
		{ target: 'ichorpuff', p1: 'elderwort', p2: 'crumbspore', layout: '2species' },
		{ target: 'queenbeet', p1: 'chocoroot', p2: 'bakeberry', layout: '2species' },
		{ target: 'juicyQueenbeet', p1: 'queenbeet', p2: 'queenbeet', layout: 'jqb' },
		{ target: 'duketater', p1: 'queenbeet', p2: 'queenbeet', layout: '1species' },
		{ target: 'shriekbulb', p1: 'doughshroom', p2: 'doughshroom', layout: '1species' },
		{ target: 'nursetulip', p1: 'clover', p2: 'whiskerbloom', layout: '2species' },
		{ target: 'tidygrass', p1: 'bakerWheat', p2: 'whiteChocoroot', layout: '2species' },
		{ target: 'shrivelFig', p1: 'cronerice', p2: 'doughshroom', layout: '2species' },
		{ target: 'whiskerbloom', p1: 'shimmerlily', p2: 'whiteChocoroot', layout: '2species' },
		{ target: 'chimerose', p1: 'shimmerlily', p2: 'whiskerbloom', layout: '2species' },
		{ target: 'everdaisy', p1: 'tidygrass', p2: 'elderwort', layout: 'everdaisy' }
	];

	/**
	 * 未取得の種を上から精査し、作付可能な交配レシピを返します
	 */
	function getNextCrossbreedRecipe(M) {
		for (let i = 0; i < crossbreedRecipes.length; i++) {
			const recipe = crossbreedRecipes[i];
			const targetPlant = M.plants[recipe.target];
			
			// ターゲットが既にアンロックされている場合はスキップ
			if (!targetPlant || targetPlant.unlocked) continue;

			const p1 = M.plants[recipe.p1];
			const p2 = M.plants[recipe.p2];

			// 親となる種が両方ともアンロックされているかチェック
			if (p1 && p1.unlocked && p2 && p2.unlocked) {
				return {
					layout: recipe.layout,
					seed1Id: p1.id,
					seed2Id: p2.id,
					targetName: targetPlant.name
				};
			}
		}
		return null;
	}

	// 農場関連の設定をUIに追加（グループ「農場 (Garden)」でまとめる）
	CCTools.addSetting('autoWeeding', '雑草の自動駆除', 'toggle', true, updateAutoGardenState, { group: '農場 (Garden)' });
	CCTools.addSetting('autoHarvestNew', '未解放の種の自動収穫', 'toggle', true, updateAutoGardenState, { group: '農場 (Garden)' });
	CCTools.addSetting('autoHarvestDying', '枯れる直前の自動収穫', 'toggle', true, updateAutoGardenState, { group: '農場 (Garden)' });
	CCTools.addSetting('autoPlant', '自動作付 (Auto-Plant)', 'toggle', false, updateAutoGardenState, { group: '農場 (Garden)' });
	CCTools.addSetting('autoCrossbreed', '自動交配 (未取得の種を狙う)', 'toggle', false, updateAutoGardenState, { group: '農場 (Garden)' });
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
					// その雑草自体が未取得なら成熟するまで駆除しない
					if (!plant.unlocked && age < plant.mature) continue;
					
					// Meddleweedから派生するキノコ系が未取得の場合も、成熟するまで駆除しない
					if (plant.key === 'meddleweed') {
						const brownMold = M.plants['brownMold'];
						const crumbspore = M.plants['crumbspore'];
						if ((!brownMold.unlocked || !crumbspore.unlocked) && age < plant.mature) continue;
					}
					
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

		// 4. 自動作付 (Auto-Plant) / 自動交配 (Auto-Crossbreed)
		let autoPlantActive = CCTools.config['autoPlant'];
		let layoutKey = CCTools.config['autoPlantLayout'];
		let seed1 = parseInt(CCTools.config['autoPlantSeed1'], 10);
		let seed2 = parseInt(CCTools.config['autoPlantSeed2'], 10);

		if (CCTools.config['autoCrossbreed']) {
			const targetRecipe = getNextCrossbreedRecipe(M);
			if (targetRecipe) {
				autoPlantActive = true;
				layoutKey = targetRecipe.layout;
				seed1 = targetRecipe.seed1Id;
				seed2 = targetRecipe.seed2Id;
			} else if (!CCTools.config['autoPlant']) {
				autoPlantActive = false; // 交配対象がなく、手動Auto-PlantもOFFなら作付しない
			}
		}

		if (autoPlantActive && layoutKey !== 'none') {
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
