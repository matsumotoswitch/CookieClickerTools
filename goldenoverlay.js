// goldenoverlay.js
(function() {
	let overlayInterval = null;

	// 予測オーバーレイのON/OFFトグル設定
	CCTools.addSetting('showGoldenOverlay', '黄金クッキー効果予測の表示', 'toggle', true, (isActive) => {
		if (isActive) {
			startOverlay();
		} else {
			stopOverlay();
		}
	}, { group: '黄金クッキー (Golden Cookie)' });

	/**
	 * 画面上の黄金クッキー(shimmer)を監視し、確定している効果テキストをオーバーレイ表示します
	 */
	function startOverlay() {
		if (overlayInterval) return;
		
		// 100ミリ秒ごとに画面上のクッキーを確認し、文字を追加する
		overlayInterval = setInterval(() => {
			if (Game.shimmers.length > 0) {
				Game.shimmers.forEach(shimmer => {
					// HTML要素が存在し、かつまだオーバーレイを作っていない場合
					if (shimmer.l && !shimmer.l.querySelector('.cctools-overlay')) {
						const overlay = document.createElement('div');
						overlay.className = 'cctools-overlay';
						
						// クッキーの中央に文字を配置するスタイル
						Object.assign(overlay.style, {
							position: 'absolute',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, -50%)',
							color: '#fff',
							textShadow: '0px 0px 4px #000, 0px 0px 4px #000',
							pointerEvents: 'none', // クリックの邪魔にならないようにする
							fontSize: '14px',
							fontWeight: 'bold',
							textAlign: 'center',
							width: '150px',
							zIndex: '10000'
						});
						
						let effectText = '???';
						
						if (shimmer.type === 'reindeer') {
							effectText = 'トナカイ';
						} else if (shimmer.type === 'golden') {
							// 魔法(FTHoF)で出たクッキーなど、効果が既に確定している場合(shimmer.force)のみ表示
							if (shimmer.force) {
								effectText = shimmer.force;
							}
						}
						
						overlay.textContent = effectText;
						shimmer.l.appendChild(overlay);
					}
				});
			}
		}, 100);
	}

	/**
	 * オーバーレイ表示の監視を停止し、画面に残っている文字レイヤーを削除します
	 */
	function stopOverlay() {
		if (overlayInterval) {
			clearInterval(overlayInterval);
			overlayInterval = null;
		}
		// 画面に残っているオーバーレイ要素を全て削除
		document.querySelectorAll('.cctools-overlay').forEach(el => el.remove());
	}

	// 再読み込み時などに状態を復元
	if (CCTools.config['showGoldenOverlay']) {
		startOverlay();
	}
})();