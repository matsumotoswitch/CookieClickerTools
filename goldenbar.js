// goldenbar.js
(function() {
	let barInterval = null;
	let lastTime = { golden: -1, reindeer: -1 };
	let frozenCounter = { golden: 0, reindeer: 0 };
	let lastStatus = { golden: '', reindeer: '' };

	CCTools.addSetting('showGoldenBar', '黄金クッキー出現予測ゲージ', 'toggle', true, (isActive) => {
		if (isActive) {
			startTimerBars();
		} else {
			stopTimerBars();
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

	function startTimerBars() {
		if (barInterval) return;

		// Golden Cookie UIコンテナの構築
		let goldenContainer = document.getElementById('cctools-goldenbar-container');
		if (!goldenContainer) {
			goldenContainer = document.createElement('div');
			goldenContainer.id = 'cctools-goldenbar-container';
			Object.assign(goldenContainer.style, {
				width: '90%',
				margin: '0',
				position: 'absolute',
				top: '2px', // 画面の一番上に移動
				left: '5%',
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

			const goldenBarSafe = document.createElement('div');
			goldenBarSafe.id = 'cctools-goldenbar-safe';
			Object.assign(goldenBarSafe.style, {
				height: '16px',
				width: '0%',
				background: '#4a2e15',
				position: 'absolute',
				top: '2px',
				zIndex: '1',
				borderRadius: '2px'
			});

			const goldenBarWarn = document.createElement('div');
			goldenBarWarn.id = 'cctools-goldenbar-warn';
			Object.assign(goldenBarWarn.style, {
				height: '16px',
				width: '0%',
				background: '#f4c542',
				position: 'absolute',
				top: '2px',
				zIndex: '2',
				borderRadius: '2px',
				boxShadow: 'inset 1px 0px 3px rgba(0,0,0,0.3)'
			});

			const goldenTextEl = document.createElement('div');
			goldenTextEl.id = 'cctools-goldenbar-text';
			goldenTextEl.style.cssText = 'position: relative; z-index: 3; line-height: 16px; pointer-events: none; color: #fff !important; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000 !important;';

			goldenContainer.appendChild(goldenBarSafe);
			goldenContainer.appendChild(goldenBarWarn);
			goldenContainer.appendChild(goldenTextEl);

			// 左ペインのクッキー情報（cookies要素）のすぐ下に配置
			const cookiesEl = document.getElementById('cookies');
			if (cookiesEl) {
				cookiesEl.parentNode.insertBefore(goldenContainer, cookiesEl.nextSibling);
			}
		}
		goldenContainer.style.display = 'block';

		// Reindeer UIコンテナの構築
		let reindeerContainer = document.getElementById('cctools-reindeerbar-container');
		if (!reindeerContainer) {
			reindeerContainer = document.createElement('div');
			reindeerContainer.id = 'cctools-reindeerbar-container';
			Object.assign(reindeerContainer.style, {
				width: '90%',
				margin: '0',
				position: 'absolute',
				top: '26px', // 黄金クッキーバーのすぐ下 (隙間を詰める)
				left: '5%',
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

			const reindeerBarSafe = document.createElement('div');
			reindeerBarSafe.id = 'cctools-reindeerbar-safe';
			Object.assign(reindeerBarSafe.style, {
				height: '16px',
				width: '0%',
				background: '#1e4620', // Reindeer color
				position: 'absolute',
				top: '2px',
				zIndex: '1',
				borderRadius: '2px'
			});

			const reindeerBarWarn = document.createElement('div');
			reindeerBarWarn.id = 'cctools-reindeerbar-warn';
			Object.assign(reindeerBarWarn.style, {
				height: '16px',
				width: '0%',
				background: '#d32f2f', // Reindeer color
				position: 'absolute',
				top: '2px',
				zIndex: '2',
				borderRadius: '2px',
				boxShadow: 'inset 1px 0px 3px rgba(0,0,0,0.3)'
			});

			const reindeerTextEl = document.createElement('div');
			reindeerTextEl.id = 'cctools-reindeerbar-text';
			reindeerTextEl.style.cssText = 'position: relative; z-index: 3; line-height: 16px; pointer-events: none; color: #fff !important; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000 !important;';

			reindeerContainer.appendChild(reindeerBarSafe);
			reindeerContainer.appendChild(reindeerBarWarn);
			reindeerContainer.appendChild(reindeerTextEl);

			if (goldenContainer) {
				goldenContainer.parentNode.insertBefore(reindeerContainer, goldenContainer.nextSibling);
			}
		}
		reindeerContainer.style.display = 'block';

		// 100msごとにタイマーを監視してゲージを更新
		barInterval = setInterval(() => {
			// --- Golden Cookie Bar Update ---
			const golden_st = Game.shimmerTypes && Game.shimmerTypes['golden'];
			if (golden_st) {
				const time = golden_st.time;
				const minTime = golden_st.minTime;
				const maxTime = golden_st.maxTime;

				if (time === lastTime.golden) {
					frozenCounter.golden++;
				} else {
					frozenCounter.golden = 0;
				}
				lastTime.golden = time;
				const isFrozen = frozenCounter.golden > 10;

				const max = Math.max(1, maxTime);
				const warnMaxPercent = ((maxTime - minTime) / max) * 100;
				const safeRemainPercent = (Math.max(0, minTime - time) / max) * 100;
				const warnRemainPercent = (Math.max(0, maxTime - Math.max(time, minTime)) / max) * 100;

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

					if (lastStatus.golden === '待機' && statusText === '警告' && container) {
						container.style.transition = 'none';
						container.style.boxShadow = '0 0 40px 15px rgba(255, 215, 0, 1), inset 0 0 20px rgba(255, 255, 255, 0.8)';
						container.style.borderColor = '#fff';
						container.style.backgroundColor = 'rgba(255, 255, 200, 0.9)';
						container.style.transform = 'scale(1.05)';
						
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
					lastStatus.golden = statusText;

					textEl.textContent = `黄金クッキー: あと ${remainMinText} 〜 ${remainMaxText} (${statusText})`;
				}
			}

			// --- Reindeer Bar Update ---
			const reindeer_st = Game.shimmerTypes && Game.shimmerTypes['reindeer'];
			if (reindeer_st) {
				const time = reindeer_st.time;
				const minTime = reindeer_st.minTime;
				const maxTime = reindeer_st.maxTime;

				if (time === lastTime.reindeer) {
					frozenCounter.reindeer++;
				} else {
					frozenCounter.reindeer = 0;
				}
				lastTime.reindeer = time;
				const isFrozen = frozenCounter.reindeer > 10;

				const max = Math.max(1, maxTime);
				const warnMaxPercent = ((maxTime - minTime) / max) * 100;
				const safeRemainPercent = (Math.max(0, minTime - time) / max) * 100;
				const warnRemainPercent = (Math.max(0, maxTime - Math.max(time, minTime)) / max) * 100;

				const container = document.getElementById('cctools-reindeerbar-container');
				const barSafe = document.getElementById('cctools-reindeerbar-safe');
				const barWarn = document.getElementById('cctools-reindeerbar-warn');
				const textEl = document.getElementById('cctools-reindeerbar-text');

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
						if (barSafe) barSafe.style.background = '#1e4620';
						if (barWarn) barWarn.style.background = '#d32f2f';
					}

					if (lastStatus.reindeer === '待機' && statusText === '警告' && container) {
						container.style.transition = 'none';
						container.style.boxShadow = '0 0 40px 15px rgba(0, 191, 255, 1), inset 0 0 20px rgba(255, 255, 255, 0.8)';
						container.style.borderColor = '#fff';
						container.style.backgroundColor = 'rgba(173, 216, 230, 0.9)';
						container.style.transform = 'scale(1.05)';
						
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
					lastStatus.reindeer = statusText;

					textEl.textContent = `トナカイ: あと ${remainMinText} 〜 ${remainMaxText} (${statusText})`;
				}
			}
		}, 100);
	}

	function stopTimerBars() {
		if (barInterval) {
			clearInterval(barInterval);
			barInterval = null;
		}
		const goldenContainer = document.getElementById('cctools-goldenbar-container');
		if (goldenContainer) {
			goldenContainer.style.display = 'none';
		}
		const reindeerContainer = document.getElementById('cctools-reindeerbar-container');
		if (reindeerContainer) {
			reindeerContainer.style.display = 'none';
		}
	}

	// 初期化
	setTimeout(() => {
		if (CCTools.config['showGoldenBar']) {
			startTimerBars();
		}
	}, 1000);
})();