// goldenbar.js
(function() {
	let barInterval = null;
	let lastTime = -1;
	let frozenCounter = 0;

	CCTools.addSetting('showGoldenBar', '黄金クッキー出現予測ゲージ', 'toggle', true, (isActive) => {
		if (isActive) {
			startGoldenBar();
		} else {
			stopGoldenBar();
		}
	}, { group: '表示系' });

	// フレーム数を分/秒フォーマットに変換するヘルパー関数
	function formatTime(frames) {
		const totalSeconds = Math.max(0, Math.ceil(frames / 30));
		if (totalSeconds >= 3600) {
			return Math.floor(totalSeconds / 3600) + 'h' + Math.floor((totalSeconds % 3600) / 60) + 'm';
		} else if (totalSeconds >= 60) {
			return Math.floor(totalSeconds / 60) + 'm' + String(totalSeconds % 60).padStart(2, '0') + 's';
		}
		return totalSeconds + 's';
	}

	function startGoldenBar() {
		if (barInterval) return;

		// UIコンテナの構築
		let container = document.getElementById('cctools-goldenbar-container');
		if (!container) {
			container = document.createElement('div');
			container.id = 'cctools-goldenbar-container';
			Object.assign(container.style, {
				width: '90%',
				margin: '10px auto',
				position: 'relative',
				zIndex: '100',
				background: '#000',
				border: '1px solid #999',
				borderRadius: '4px',
				boxShadow: '0 0 4px #000',
				padding: '2px',
				boxSizing: 'border-box',
				textAlign: 'center',
				fontSize: '12px',
				color: '#fff',
				textShadow: '1px 1px 2px #000'
			});

			// 待機時間（絶対に出ない時間）の青ゲージ
			const barSafe = document.createElement('div');
			barSafe.id = 'cctools-goldenbar-safe';
			Object.assign(barSafe.style, {
				height: '16px',
				width: '0%',
				background: '#4a90e2',
				position: 'absolute',
				top: '2px',
				zIndex: '1',
				borderRadius: '2px'
			});

			// 警告時間（出る可能性がある時間）の赤ゲージ
			const barWarn = document.createElement('div');
			barWarn.id = 'cctools-goldenbar-warn';
			Object.assign(barWarn.style, {
				height: '16px',
				width: '0%',
				background: '#e24a4a',
				position: 'absolute',
				top: '2px',
				zIndex: '2',
				borderRadius: '2px',
				boxShadow: 'inset 1px 0px 3px rgba(0,0,0,0.3)'
			});

			// 重ねて表示するテキスト要素
			const textEl = document.createElement('div');
			textEl.id = 'cctools-goldenbar-text';
			Object.assign(textEl.style, {
				position: 'relative',
				zIndex: '3',
				lineHeight: '16px',
				pointerEvents: 'none' // マウスクリックの邪魔にならないように
			});

			container.appendChild(barSafe);
			container.appendChild(barWarn);
			container.appendChild(textEl);

			// 左ペインのクッキー情報（cookies要素）のすぐ下に配置
			const cookiesEl = document.getElementById('cookies');
			if (cookiesEl) {
				cookiesEl.parentNode.insertBefore(container, cookiesEl.nextSibling);
			}
		}
		container.style.display = 'block';

		// 100msごとにタイマーを監視してゲージを更新
		barInterval = setInterval(() => {
			const st = Game.shimmerTypes && Game.shimmerTypes['golden'];
			if (!st) return;

			const time = st.time;
			const minTime = st.minTime;
			const maxTime = st.maxTime;

			// 時間が止まっている（ゴールデンスイッチ中など）かを判定
			if (time === lastTime) {
				frozenCounter++;
			} else {
				frozenCounter = 0;
			}
			lastTime = time;
			const isFrozen = frozenCounter > 10; // 約1秒間変動がなければ凍結とみなす

			// ゲージの長さを計算（カウントダウン方式: 残り時間を表示）
			const max = Math.max(1, maxTime);
			const warnMaxPercent = ((maxTime - minTime) / max) * 100;
			const safeRemainPercent = (Math.max(0, minTime - time) / max) * 100;
			const warnRemainPercent = (Math.max(0, maxTime - Math.max(time, minTime)) / max) * 100;

			// スタイルとテキストの更新
			const barSafe = document.getElementById('cctools-goldenbar-safe');
			const barWarn = document.getElementById('cctools-goldenbar-warn');
			const textEl = document.getElementById('cctools-goldenbar-text');

			if (barSafe) {
				barSafe.style.left = 'auto';
				barSafe.style.right = `calc(2px + ${warnMaxPercent}%)`;
				barSafe.style.width = safeRemainPercent + '%';
			}
			if (barWarn) {
				barWarn.style.left = 'auto';
				barWarn.style.right = '2px';
				barWarn.style.width = warnRemainPercent + '%';
			}

			if (textEl) {
				const remainMinText = formatTime(Math.max(0, minTime - time));
				const remainMaxText = formatTime(Math.max(0, maxTime - time));
				
				let statusText = '';
				if (isFrozen) {
					statusText = '凍結中';
					if (barSafe) barSafe.style.background = '#666';
					if (barWarn) barWarn.style.background = '#888';
				} else {
					if (time < minTime) {
						statusText = '待機';
					} else {
						statusText = '警告';
					}
					if (barSafe) barSafe.style.background = '#4a90e2';
					if (barWarn) barWarn.style.background = '#e24a4a';
				}

				textEl.textContent = `黄金ｸｯｷｰ: あと ${remainMinText} 〜 ${remainMaxText} (${statusText})`;
			}
		}, 100);
	}

	function stopGoldenBar() {
		if (barInterval) {
			clearInterval(barInterval);
			barInterval = null;
		}
		const container = document.getElementById('cctools-goldenbar-container');
		if (container) {
			container.style.display = 'none';
		}
	}

	// 初期化
	setTimeout(() => {
		if (CCTools.config['showGoldenBar']) {
			startGoldenBar();
		}
	}, 1000);
})();