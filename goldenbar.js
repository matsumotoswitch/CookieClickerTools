// goldenbar.js
(function() {
	let barInterval = null;
	let lastTime = -1;
	let frozenCounter = 0;
	let lastStatus = '';

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
				background: 'rgba(0, 0, 0, 0.25)',
				border: '1px solid #999',
				borderRadius: '4px',
				boxShadow: '0 0 4px #000',
				padding: '2px',
				boxSizing: 'border-box',
				textAlign: 'center',
				fontSize: '12px',
				color: '#fff',
				transition: 'box-shadow 0.5s ease-out, border-color 0.5s ease-out, transform 0.3s ease-out, background-color 0.5s ease-out'
			});

			// 待機時間（絶対に出ない時間）のゲージ
			const barSafe = document.createElement('div');
			barSafe.id = 'cctools-goldenbar-safe';
			Object.assign(barSafe.style, {
				height: '16px',
				width: '0%',
				background: '#4a2e15',
				position: 'absolute',
				top: '2px',
				zIndex: '1',
				borderRadius: '2px'
			});

			// 警告時間（出る可能性がある時間）のゲージ
			const barWarn = document.createElement('div');
			barWarn.id = 'cctools-goldenbar-warn';
			Object.assign(barWarn.style, {
				height: '16px',
				width: '0%',
				background: '#f4c542',
				position: 'absolute',
				top: '2px',
				zIndex: '2',
				borderRadius: '2px',
				boxShadow: 'inset 1px 0px 3px rgba(0,0,0,0.3)'
			});

			// 重ねて表示するテキスト要素
			const textEl = document.createElement('div');
			textEl.id = 'cctools-goldenbar-text';
			textEl.style.cssText = 'position: relative; z-index: 3; line-height: 16px; pointer-events: none; color: #fff !important; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000 !important;';

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
			const container = document.getElementById('cctools-goldenbar-container');
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
					if (barSafe) barSafe.style.background = '#4a2e15';
					if (barWarn) barWarn.style.background = '#f4c542';
				}

				// 状態が「待機」→「警告」に変わった瞬間にコンテナを光らせる
				if (lastStatus === '待機' && statusText === '警告' && container) {
					container.style.transition = 'none'; // 即座に光らせる
					container.style.boxShadow = '0 0 40px 15px rgba(255, 215, 0, 1), inset 0 0 20px rgba(255, 255, 255, 0.8)';
					container.style.borderColor = '#fff';
					container.style.backgroundColor = 'rgba(255, 255, 200, 0.9)';
					container.style.transform = 'scale(1.05)';
					
					// 少し待ってからフェードアウトさせる
					setTimeout(() => {
						if (container) {
							container.style.transition = 'box-shadow 1.5s ease-out, border-color 1.5s ease-out, transform 0.8s ease-out, background-color 1.5s ease-out';
							container.style.boxShadow = '0 0 4px #000';
							container.style.borderColor = '#999';
							container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
							container.style.transform = 'scale(1)';
						}
					}, 50);
				}
				lastStatus = statusText;


				textEl.textContent = `黄金クッキー: あと ${remainMinText} 〜 ${remainMaxText} (${statusText})`;
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