// goldenbar.js
(function() {
	/**
	 * このモジュールは、黄金クッキーとトナカイの出現予測タイマーバーを画面上部に表示します。
	 * バーは「待機時間」と「警告時間」の2段階で構成され、残り時間を視覚的に示します。
	 * 状態が「待機」から「警告」に切り替わる際には、派手な発光エフェクトで通知します。
	 */

	// メインの更新タイマー
	let barInterval = null;
	// 各タイマーの状態を保持するオブジェクト
	const timerState = {
		golden: { lastTime: -1, frozenCounter: 0, lastStatus: '', shimmerCount: 0 },
		reindeer: { lastTime: -1, frozenCounter: 0, lastStatus: '', shimmerCount: 0 },
	};

	// 各バーの設定を定義する定数オブジェクト
	const BAR_CONFIG = {
		golden: {
			type: 'golden',
			name: '黄金クッキー',
			ids: {
				container: 'cctools-goldenbar-container',
				safe: 'cctools-goldenbar-safe',
				warn: 'cctools-goldenbar-warn',
				text: 'cctools-goldenbar-text',
			},
			colors: {
				safe: '#6B4C3A', // 焼成中
				warn: '#A68B60', // 提供中
				frozenSafe: '#666',
				frozenWarn: '#888',
				flash: 'rgba(255, 248, 220, 0.9)', // パステルイエロー
				flashShadow: '0 0 40px 15px rgba(255, 215, 0, 0.7), inset 0 0 20px rgba(255, 248, 220, 1)',
			},
			position: { top: '2px', left: '5%' }
		},
		reindeer: {
			type: 'reindeer',
			name: 'トナカイ',
			ids: {
				container: 'cctools-reindeerbar-container',
				safe: 'cctools-reindeerbar-safe',
				warn: 'cctools-reindeerbar-warn',
				text: 'cctools-reindeerbar-text',
			},
			colors: {
				safe: '#3A4D3F', // 巡回中
				warn: '#7B8F7D', // 接近中
				frozenSafe: '#666',
				frozenWarn: '#888',
				flash: 'rgba(220, 240, 230, 0.9)', // パステルミント
				flashShadow: '0 0 40px 15px rgba(100, 150, 120, 0.6), inset 0 0 20px rgba(220, 240, 230, 1)',
			},
			position: { top: '26px', left: '5%' }
		}
	};

	// 設定UIを追加
	CCTools.addSetting('showGoldenBar', '出現予測ゲージ (黄金クッキー)', 'toggle', true, updateTimerBarsState, { group: '表示系' });
	CCTools.addSetting('showReindeerBar', '出現予測ゲージ (トナカイ)', 'toggle', true, updateTimerBarsState, { group: '表示系' });

	/**
	 * 設定状態を監視し、タイマーの起動・停止や表示状態を更新します。
	 */
	function updateTimerBarsState() {
		const showGolden = CCTools.config['showGoldenBar'];
		const showReindeer = CCTools.config['showReindeerBar'];

		if (showGolden || showReindeer) {
			startTimerBars();
			
			// 既に起動済みの場合は表示状態だけ即座に更新する
			const goldenContainer = document.getElementById(BAR_CONFIG.golden.ids.container);
			if (goldenContainer) {
				goldenContainer.style.display = showGolden ? 'block' : 'none';
			}
			
			const reindeerContainer = document.getElementById(BAR_CONFIG.reindeer.ids.container);
			if (reindeerContainer) {
				if (!showReindeer) {
					reindeerContainer.style.display = 'none';
				} else if (typeof Game !== 'undefined') {
					reindeerContainer.style.display = Game.season === 'christmas' ? 'block' : 'none';
				}
			}
		} else {
			stopTimerBars();
		}
	}

	/**
	 * フレーム数を人間が読みやすい時間形式 (XhYmZs) に変換します。
	 * @param {number} frames - ゲームのフレーム数
	 * @returns {string} フォーマットされた時間文字列
	 */
	function formatTime(frames) {
		// ゲームの現在設定されているFPSに基づいて秒数を計算する
		const totalSeconds = Math.max(0, Math.ceil(frames / (Game.fps || 30)));
		if (totalSeconds >= 3600) {
			return Math.floor(totalSeconds / 3600) + 'h' + String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0') + 'm';
		} else {
			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60;
			return String(minutes).padStart(2, '0') + 'm' + String(seconds).padStart(2, '0') + 's';
		}
	}

	/**
	 * 指定された設定に基づいてタイマーバーのDOM要素を生成し、ページに追加します。
	 * @param {object} config - BAR_CONFIG内の単一の設定オブジェクト (e.g., BAR_CONFIG.golden)
	 * @returns {HTMLElement} 生成されたコンテナ要素
	 */
	function createBarContainer(config) {
		let container = document.getElementById(config.ids.container);
		if (container) return container;

		container = document.createElement('div');
		container.id = config.ids.container;
		Object.assign(container.style, {
			width: '90%',
			margin: '0',
			position: 'absolute',
			top: config.position.top,
			left: config.position.left,
			zIndex: '100',
			background: 'rgba(0, 0, 0, 0.5)', // 背景を少し濃くして視認性向上
			border: '1px solid #999',
			borderRadius: '4px',
			boxShadow: '0 0 4px #000',
			padding: '2px',
			boxSizing: 'border-box',
			textAlign: 'center',
			fontSize: '12px',
			color: '#fff',
			transition: 'box-shadow 1.5s ease-out, border-color 1.5s ease-out, transform 0.8s ease-out, background-color 1.5s ease-out'
		});

		const barSafe = document.createElement('div');
		barSafe.id = config.ids.safe;
		Object.assign(barSafe.style, {
			height: '16px',
			width: '0%',
			background: config.colors.safe,
			position: 'absolute',
			top: '2px',
			zIndex: '2',
			borderRadius: '2px',
			boxShadow: 'inset 1px 0px 3px rgba(0,0,0,0.3)'
		});

		const barWarn = document.createElement('div');
		barWarn.id = config.ids.warn;
		Object.assign(barWarn.style, {
			height: '16px',
			width: '0%',
			background: config.colors.warn,
			position: 'absolute',
			top: '2px',
			zIndex: '1',
			borderRadius: '2px'
		});

		const textEl = document.createElement('div');
		textEl.id = config.ids.text;
		textEl.style.cssText = 'position: relative; z-index: 3; line-height: 16px; pointer-events: none; color: #fff !important; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000 !important;';

		container.appendChild(barSafe);
		container.appendChild(barWarn);
		container.appendChild(textEl);
		
		return container;
	}

	/**
	 * 指定されたコンテナを1回点滅させます。
	 * @param {HTMLElement} container - 点滅させるDOM要素
	 * @param {object} config - BAR_CONFIG内の単一の設定オブジェクト
	 */
	function flashContainerOnce(container, config) {
		container.style.transition = 'none'; // 即座に光らせる
		container.style.boxShadow = config.colors.flashShadow;
		container.style.borderColor = '#fff';
		container.style.backgroundColor = config.colors.flash;
		container.style.transform = 'scale(1.05)';
		
		// 少し待ってからフェードアウトさせる
		setTimeout(() => {
			container.style.transition = 'box-shadow 1.5s ease-out, border-color 1.5s ease-out, transform 0.8s ease-out, background-color 1.5s ease-out';
			container.style.boxShadow = '0 0 4px #000';
			container.style.borderColor = '#999';
			container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
			container.style.transform = 'scale(1)';
		}, 50);
	}

	/**
	 * 指定されたコンテナを2回点滅させます。
	 * @param {HTMLElement} container - 点滅させるDOM要素
	 * @param {object} config - BAR_CONFIG内の単一の設定オブジェクト
	 */
	function flashContainerTwice(container, config) {
		// 1回目の点灯
		container.style.transition = 'none';
		container.style.boxShadow = config.colors.flashShadow;
		container.style.borderColor = '#fff';
		container.style.backgroundColor = config.colors.flash;
		container.style.transform = 'scale(1.05)';
		
		// 1回目の消灯
		setTimeout(() => {
			container.style.transition = 'none';
			container.style.boxShadow = '0 0 4px #000';
			container.style.borderColor = '#999';
			container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
			container.style.transform = 'scale(1)';
		}, 150); // 150ms 点灯

		// 2回目の点灯
		setTimeout(() => {
			container.style.transition = 'none';
			container.style.boxShadow = config.colors.flashShadow;
			container.style.borderColor = '#fff';
			container.style.backgroundColor = config.colors.flash;
			container.style.transform = 'scale(1.05)';
		}, 200); // 50ms後に再点灯

		// 2回目の消灯（フェードアウト）
		setTimeout(() => {
			container.style.transition = 'box-shadow 1.5s ease-out, border-color 1.5s ease-out, transform 0.8s ease-out, background-color 1.5s ease-out';
			container.style.boxShadow = '0 0 4px #000';
			container.style.borderColor = '#999';
			container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
			container.style.transform = 'scale(1)';
		}, 350); // 150ms 点灯
	}

	/**
	 * 出現したshimmerを検知し、対応するバーを点滅させます。
	 */
	function handleShimmerSpawns() {
		const currentShimmers = { golden: 0, reindeer: 0 };
		if (typeof Game !== 'undefined' && Game.shimmers) {
			Game.shimmers.forEach(shimmer => {
				if (shimmer.type === 'golden') currentShimmers.golden++;
				if (shimmer.type === 'reindeer') currentShimmers.reindeer++;
			});
		}

		// 黄金クッキーが出現したかチェック
		if (CCTools.config['showGoldenBar'] && currentShimmers.golden > timerState.golden.shimmerCount) {
			const container = document.getElementById(BAR_CONFIG.golden.ids.container);
			if (container) flashContainerTwice(container, BAR_CONFIG.golden);
		}
		timerState.golden.shimmerCount = currentShimmers.golden;

		// トナカイが出現したかチェック
		if (CCTools.config['showReindeerBar'] && currentShimmers.reindeer > timerState.reindeer.shimmerCount) {
			const container = document.getElementById(BAR_CONFIG.reindeer.ids.container);
			if (container) flashContainerTwice(container, BAR_CONFIG.reindeer);
		}
		timerState.reindeer.shimmerCount = currentShimmers.reindeer;
	}

	/**
	 * 指定されたタイマーバーの状態を更新します。
	 * @param {object} config - BAR_CONFIG内の単一の設定オブジェクト
	 */
	function updateBar(config) {
		const st = Game.shimmerTypes && Game.shimmerTypes[config.type];
		if (!st) return;

		// 1. 状態変数の取得と更新
		const state = timerState[config.type];
		const { time, minTime, maxTime } = st;

		if (time === state.lastTime) {
			state.frozenCounter++;
		} else {
			state.frozenCounter = 0;
		}
		state.lastTime = time;
		const isFrozen = state.frozenCounter > 10; // 約1秒間変動がなければ凍結とみなす

		// 2. ゲージのパーセンテージ計算
		const max = Math.max(1, maxTime);
		const warnMaxPercent = ((maxTime - minTime) / max) * 100;
		const safeRemainPercent = (Math.max(0, minTime - time) / max) * 100;
		const warnRemainPercent = (Math.max(0, maxTime - Math.max(time, minTime)) / max) * 100;

		// 3. DOM要素の取得と更新
		const container = document.getElementById(config.ids.container);
		const barSafe = document.getElementById(config.ids.safe);
		const barWarn = document.getElementById(config.ids.warn);
		const textEl = document.getElementById(config.ids.text);
		if (!container || !barSafe || !barWarn || !textEl) return;

		barWarn.style.right = 'auto';
		barWarn.style.left = '2px';
		barWarn.style.width = warnRemainPercent + '%';

		barSafe.style.right = 'auto';
		barSafe.style.left = `calc(2px + ${warnMaxPercent}%)`;
		barSafe.style.width = safeRemainPercent + '%';

		// 4. テキストと色の更新
		let statusText = '';
		if (isFrozen) {
			statusText = '凍結中';
			barSafe.style.background = config.colors.frozenSafe;
			barWarn.style.background = config.colors.frozenWarn;

			// 凍結中はシンプルな中央揃えテキストに戻す
			textEl.style.display = '';
			textEl.style.justifyContent = '';
			textEl.style.padding = '';
			textEl.innerHTML = `${config.name}: 凍結中`;
		} else {
			const remainMinText = formatTime(Math.max(0, minTime - time));
			const remainMaxText = formatTime(Math.max(0, maxTime - time));
			statusText = (time < minTime) ? '待機' : '警告';
			barSafe.style.background = config.colors.safe;
			barWarn.style.background = config.colors.warn;

			let fullText = '';

			if (statusText === '待機') {
				const timeValue = remainMinText;
				const label = (config.type === 'golden') ? '黄金クッキー焼成中　　　　' : 'トナカイ　　巡回中　　　　';
				fullText = `${label} ${timeValue}`;
			} else { // 警告
				const timeValue = remainMaxText;
				const label = (config.type === 'golden') ? '黄金クッキー提供待ち　最大' : 'トナカイ　　到着待ち　最大';
				fullText = `${label}${timeValue}`;
			}

			textEl.style.display = '';
			textEl.style.justifyContent = '';
			textEl.style.padding = '';
			textEl.textContent = fullText;
		}

		// 5. 状態遷移時のエフェクト
		if (state.lastStatus === '待機' && statusText === '警告') {
			flashContainerOnce(container, config);
		}
		state.lastStatus = statusText;
	}

	/**
	 * 全てのタイマーバーのUIを構築し、定期更新を開始します。
	 */
	function startTimerBars() {
		if (barInterval) return;

		// UIの構築
		const goldenContainer = createBarContainer(BAR_CONFIG.golden);
		const reindeerContainer = createBarContainer(BAR_CONFIG.reindeer);

		// DOMへの挿入
		const cookiesEl = document.getElementById('cookies');
		if (cookiesEl) {
			if (!goldenContainer.parentNode) {
				cookiesEl.parentNode.insertBefore(goldenContainer, cookiesEl.nextSibling);
			}
			if (!reindeerContainer.parentNode) {
				goldenContainer.parentNode.insertBefore(reindeerContainer, goldenContainer.nextSibling);
			}
		}
		
		// 初期状態のshimmer数をカウント
		if (typeof Game !== 'undefined' && Game.shimmers) {
			Game.shimmers.forEach(shimmer => {
				if (shimmer.type === 'golden') timerState.golden.shimmerCount++;
				if (shimmer.type === 'reindeer') timerState.reindeer.shimmerCount++;
			});
		}
		
		goldenContainer.style.display = CCTools.config['showGoldenBar'] ? 'block' : 'none';
		reindeerContainer.style.display = (CCTools.config['showReindeerBar'] && typeof Game !== 'undefined' && Game.season === 'christmas') ? 'block' : 'none';

		// 100msごとにタイマーを監視してゲージを更新
		barInterval = setInterval(() => {
			if (CCTools.config['showGoldenBar']) {
				updateBar(BAR_CONFIG.golden);
			}
			
			// トナカイは設定がONかつクリスマスシーズンのみ表示
			if (CCTools.config['showReindeerBar']) {
				if (typeof Game !== 'undefined' && Game.season === 'christmas') {
					if (reindeerContainer.style.display === 'none') {
						reindeerContainer.style.display = 'block';
					}
					updateBar(BAR_CONFIG.reindeer);
				} else {
					if (reindeerContainer.style.display !== 'none') {
						reindeerContainer.style.display = 'none';
					}
				}
			}

			handleShimmerSpawns();

		}, 100);
	}

	/**
	 * 全てのタイマーバーの定期更新を停止し、UIを非表示にします。
	 */
	function stopTimerBars() {
		if (barInterval) {
			clearInterval(barInterval);
			barInterval = null;
		}
		// 全てのバーコンテナを非表示にする
		Object.values(BAR_CONFIG).forEach(config => {
			const container = document.getElementById(config.ids.container);
			if (container) {
				container.style.display = 'none';
			}
		});
	}

	// 初期化処理
	setTimeout(() => {
		updateTimerBarsState();
	}, 1000);
})();