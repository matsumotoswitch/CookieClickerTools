// bufftimer.js
(function() {
	let buffInterval = null;
	let recentFps = [];

	CCTools.addSetting('showBuffTimer', 'バフ・デバフの残り時間表示', 'toggle', true, (isActive) => {
		if (isActive) {
			startBuffTimer();
		} else {
			stopBuffTimer();
		}
	}, { group: '全般 (General)' });

	CCTools.addSetting('formatBuffTimer', 'バフ時間を分/時でフォーマット', 'toggle', true, null, { group: '全般 (General)' });

	function startBuffTimer() {
		if (buffInterval) return;
		
		buffInterval = setInterval(() => {
			// 現在のFPSを記録し、直近10回（約1秒間）の最小値を「実効FPS」とする
			// これにより、ゴザモク売買時の一瞬の「FPS 30」を無視し、表示のブレを完全に防ぎます
			recentFps.push(Game.fps);
			if (recentFps.length > 10) recentFps.shift();
			const effectiveFps = Math.min(...recentFps) || 30;

			for (const i in Game.buffs) {
				const buff = Game.buffs[i];
				// すべてのバフアイコンに適用
				if (buff.l) {
					let timerEl = buff.l.querySelector('.cctools-buff-timer');
					if (!timerEl) {
						timerEl = document.createElement('div');
						timerEl.className = 'cctools-buff-timer';
						Object.assign(timerEl.style, {
							position: 'absolute',
							bottom: '2px',
							right: '2px',
							color: 'white',
							textShadow: '0 0 4px #000, 0 0 4px #000',
							fontWeight: 'normal',
							fontSize: '14px',
							pointerEvents: 'none',
							zIndex: '1000'
						});
						buff.l.appendChild(timerEl);
					}
					
					// 残り時間を計算し、見やすくフォーマット
					// 延長効果を加味した「実際の現実時間」で正確にカウントダウンさせる
					const totalSeconds = Math.max(0, Math.ceil(buff.time / effectiveFps));
					let timeText = '';
					
					if (CCTools.config['formatBuffTimer']) {
						if (totalSeconds >= 3600) {
							timeText = Math.floor(totalSeconds / 3600) + 'h' + Math.floor((totalSeconds % 3600) / 60) + 'm';
						} else if (totalSeconds >= 60) {
							timeText = Math.floor(totalSeconds / 60) + 'm' + String(totalSeconds % 60).padStart(2, '0') + 's';
						} else {
							timeText = totalSeconds + 's';
						}
					} else {
						timeText = totalSeconds + 's';
					}
					timerEl.textContent = timeText;
				}
			}
		}, 100);
	}

	function stopBuffTimer() {
		if (buffInterval) clearInterval(buffInterval);
		buffInterval = null;
		document.querySelectorAll('.cctools-buff-timer').forEach(el => el.remove());
	}

	// 初期化
	if (CCTools.config['showBuffTimer']) {
		startBuffTimer();
	}
})();
