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
		golden: { lastTime: -1, frozenCounter: 0, lastStatus: '' },
		reindeer: { lastTime: -1, frozenCounter: 0, lastStatus: '' },
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
				safe: '#3D2B1F',
				warn: '#A68B6D',
				frozenSafe: '#666',
				frozenWarn: '#888',
				flash: 'rgba(255, 255, 200, 0.9)',
				flashShadow: '0 0 40px 15px rgba(255, 215, 0, 1), inset 0 0 20px rgba(255, 255, 255, 0.8)',
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
				safe: '#354A3A',
				warn: '#7D3C37',
				frozenSafe: '#666',
				frozenWarn: '#888',
				flash: 'rgba(173, 216, 230, 0.9)',
				flashShadow: '0 0 40px 15px rgba(0, 191, 255, 1), inset 0 0 20px rgba(255, 255, 255, 0.8)',
			},
			position: { top: '26px', left: '5%' }
		}
	};

	// 設定UIを追加
	CCTools.addSetting('showGoldenBar', '出現予測ゲージ (黄金/トナカイ)', 'toggle', true, (isActive) => {
		if (isActive) {
			startTimerBars();
		} else {
			stopTimerBars();
		}
	}, { group: '表示系' });

	/**
	 * フレーム数を人間が読みやすい時間形式 (XhYmZs) に変換します。
	 * @param {number} frames - ゲームのフレーム数
	 * @returns {string} フォーマットされた時間文字列
	 */
	function formatTime(frames) {
		// ゲームの現在設定されているFPSに基づいて秒数を計算する
		const totalSeconds = Math.max(0, Math.ceil(frames / (Game.fps || 30)));
		if (totalSeconds >= 3600) {
			return Math.floor(totalSeconds / 3600) + 'h' + Math.floor((totalSeconds % 3600) / 60) + 'm';
		} else if (totalSeconds >= 60) {
			return Math.floor(totalSeconds / 60) + 'm' + String(totalSeconds % 60).padStart(2, '0') + 's';
		}
		return totalSeconds + 's';
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
			zIndex: '1',
			borderRadius: '2px'
		});

		const barWarn = document.createElement('div');
		barWarn.id = config.ids.warn;
		Object.assign(barWarn.style, {
			height: '16px',
			width: '0%',
			background: config.colors.warn,
			position: 'absolute',
			top: '2px',
			zIndex: '2',
			borderRadius: '2px',
			boxShadow: 'inset 1px 0px 3px rgba(0,0,0,0.3)'
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
	 * 指定されたタイマーバーの状態を更新します。
	 * @param {object} config - BAR_CONFIG内の単一の設定オブジェクト
	 */
	function updateBar(config) {
		const st = Game.shimmerTypes && Game.shimmerTypes[config.type];
		if (!st) return;

		const state = timerState[config.type];
		const { time, minTime, maxTime } = st;

		// 時間が止まっている（ゴールデンスイッチ中など）かを判定
		if (time === state.lastTime) {
			state.frozenCounter++;
		} else {
			state.frozenCounter = 0;
		}
		state.lastTime = time;
		const isFrozen = state.frozenCounter > 10; // 約1秒間変動がなければ凍結とみなす

		// ゲージの長さを計算（カウントダウン方式: 残り時間を表示）
		const max = Math.max(1, maxTime);
		const warnMaxPercent = ((maxTime - minTime) / max) * 100;
		const safeRemainPercent = (Math.max(0, minTime - time) / max) * 100;
		const warnRemainPercent = (Math.max(0, maxTime - Math.max(time, minTime)) / max) * 100;

		// DOM要素を取得
		const container = document.getElementById(config.ids.container);
		const barSafe = document.getElementById(config.ids.safe);
		const barWarn = document.getElementById(config.ids.warn);
		const textEl = document.getElementById(config.ids.text);
		if (!container || !barSafe || !barWarn || !textEl) return;

		// ゲージの幅を更新
		barSafe.style.left = 'auto';
		barSafe.style.right = `calc(2px + ${warnMaxPercent}%)`;
		barSafe.style.width = safeRemainPercent + '%';
		
		barWarn.style.left = 'auto';
		barWarn.style.right = '2px';
		barWarn.style.width = warnRemainPercent + '%';

		// テキストと状態を更新
		const remainMinText = formatTime(Math.max(0, minTime - time));
		const remainMaxText = formatTime(Math.max(0, maxTime - time));
		
		let statusText = '';
		if (isFrozen) {
			statusText = '凍結中';
			barSafe.style.background = config.colors.frozenSafe;
			barWarn.style.background = config.colors.frozenWarn;
		} else {
			statusText = (time < minTime) ? '待機' : '警告';
			barSafe.style.background = config.colors.safe;
			barWarn.style.background = config.colors.warn;
		}

		// 状態が「待機」→「警告」に変わった瞬間にコンテナを光らせる
		if (state.lastStatus === '待機' && statusText === '警告') {
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
		state.lastStatus = statusText;

		textEl.textContent = `${config.name}: あと ${remainMinText} 〜 ${remainMaxText} (${statusText})`;
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
			cookiesEl.parentNode.insertBefore(goldenContainer, cookiesEl.nextSibling);
			goldenContainer.parentNode.insertBefore(reindeerContainer, goldenContainer.nextSibling);
		}
		
		goldenContainer.style.display = 'block';
		reindeerContainer.style.display = 'block';

		// 100msごとにタイマーを監視してゲージを更新
		barInterval = setInterval(() => {
			updateBar(BAR_CONFIG.golden);
			updateBar(BAR_CONFIG.reindeer);
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
		if (CCTools.config['showGoldenBar']) {
			startTimerBars();
		}
	}, 1000);
})();