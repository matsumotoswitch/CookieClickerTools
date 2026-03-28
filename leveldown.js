// leveldown.js
(function() {
	/**
	 * 施設のレベルダウン機能
	 * Shiftキーを押しながらレベルアップボタンをクリックすると、
	 * 現在のレベル分の角砂糖を回収して施設のレベルを1下げます。
	 */

	// ------------------------------------------------------------------------
	// 定数定義
	// ------------------------------------------------------------------------
	const CONFIG_KEY = 'enableLevelDown';
	const LEVEL_DOWN_CLASS = 'cctools-level-down';
	const LEVEL_TEXT_CLASS = 'cctools-level-text';

	// ------------------------------------------------------------------------
	// 設定UI
	// ------------------------------------------------------------------------
	// 設定画面にトグルを追加（チート系グループ）
	CCTools.addSetting(CONFIG_KEY, '施設のレベルダウン機能 (Shiftキー)', 'toggle', false, (isActive) => {
		if (!isActive) {
			// OFFになったら即座に見た目を元に戻す
			removeAllLevelDownStyles();
		}
	}, { group: 'チート系' });

	// ------------------------------------------------------------------------
	// スタイル制御用のヘルパー関数
	// ------------------------------------------------------------------------

	/**
	 * 全てのレベルダウン表示スタイルを解除します。
	 */
	function removeAllLevelDownStyles() {
		const downEls = document.querySelectorAll(`.${LEVEL_DOWN_CLASS}`);
		downEls.forEach(el => removeLevelDownStyle(el));
	}

	/**
	 * 対象要素にレベルダウンスタイルを適用します。
	 * @param {HTMLElement} target - 適用対象の要素
	 */
	function applyLevelDownStyle(target) {
		if (!target.classList.contains(LEVEL_DOWN_CLASS)) {
			target.classList.add(LEVEL_DOWN_CLASS);
			// 文字だけをspanで囲んで、テキストの反転を打ち消す
			if (!target.querySelector(`.${LEVEL_TEXT_CLASS}`)) {
				target.innerHTML = `<span class="${LEVEL_TEXT_CLASS}">${target.innerHTML}</span>`;
			}
		}
	}

	/**
	 * 対象要素からレベルダウンスタイルを削除します。
	 * @param {HTMLElement} target - 削除対象の要素
	 */
	function removeLevelDownStyle(target) {
		if (target.classList.contains(LEVEL_DOWN_CLASS)) {
			target.classList.remove(LEVEL_DOWN_CLASS);
			const span = target.querySelector(`.${LEVEL_TEXT_CLASS}`);
			if (span) {
				// spanを取り除いて元のテキストに戻す
				target.innerHTML = span.innerHTML;
			}
		}
	}

	// ------------------------------------------------------------------------
	// ゲーム本体関数のフック (Game.Draw, Game.tooltip.draw)
	// ------------------------------------------------------------------------

	// 1. Game.Draw のフック
	// ゲーム本体が毎フレーム文字を上書きして反転が戻ってしまう現象を防ぐフック
	if (!Game.origDrawCCTools_LevelDown) {
		Game.origDrawCCTools_LevelDown = Game.Draw;
	}
	Game.Draw = function() {
		Game.origDrawCCTools_LevelDown();
		if (CCTools.config[CONFIG_KEY]) {
			const downEls = document.querySelectorAll(`.${LEVEL_DOWN_CLASS}`);
			downEls.forEach(el => {
				if (!el.querySelector(`.${LEVEL_TEXT_CLASS}`)) {
					el.innerHTML = `<span class="${LEVEL_TEXT_CLASS}">${el.innerHTML}</span>`;
				}
			});
		}
	};

	// 2. Game.tooltip.draw のフック
	// Game.tooltip.drawをフックしてツールチップの内容を書き換える
	if (!Game.origTooltipDrawCCTools_LevelDown) {
		Game.origTooltipDrawCCTools_LevelDown = Game.tooltip.draw;
	}
	Game.tooltip.draw = function(from, text, origin) {
		// レベルアップボタンのツールチップ（originが'store'で、要素が.productLevel）のみを対象とする
		if (CCTools.config[CONFIG_KEY] && origin === 'store' && from && from.classList && from.classList.contains('productLevel')) {
			// 'from'要素のIDから建物のIDを特定
			const id = parseInt(from.id.replace('productLevel', ''));
			if (!isNaN(id)) {
				const obj = Game.ObjectsById[id];
				if (obj && obj.level > 0) {
					// ツールチップが関数で生成される場合（通常はこちら）
					if (typeof text === 'function') {
						const origTextFunc = text;
						text = function() {
							let res = origTextFunc();
							// 見た目（クラス）がレベルダウン状態になっているかを直接チェック
							if (from.classList.contains(LEVEL_DOWN_CLASS) && typeof res === 'string') {
								const level = obj.level;
								const newText = `クリックで ${Game.sayLumps(level)} を改修してレベルダウン`;
								
								// ゲーム本来の言語生成関数を使って完全一致で検索する（最も安全）
								const targetStr = loc("Click to level up for %1.", Game.sayLumps(level + 1));
								
								if (res.indexOf(targetStr) !== -1) {
									res = res.replace(targetStr, newText);
								} else {
									// 万が一フォーマットが異なる場合の安全なフォールバック
									// 砂糖玉アイコンを含むテキスト部分をピンポイントで置換する
									const regex = /[^<]*?<span class="price lump[^>]*>.*?<\/span>[^<]*?(?=<br>|<\/div>)/;
									res = res.replace(regex, newText);
								}
							}
							return res;
						};
					} 
				}
			}
		}
		
		// 元の描画関数を呼び出す（thisコンテキストを失わないよう.callを使用）
		return Game.origTooltipDrawCCTools_LevelDown.call(this, from, text, origin);
	};

	// ------------------------------------------------------------------------
	// スタイルの追加
	// ------------------------------------------------------------------------

	// レベルダウン用のスタイルを追加
	const style = document.createElement('style');
	style.textContent = `
		.${LEVEL_DOWN_CLASS} {
			/* 赤の半透明オーバーレイを薄めに適用 */
			box-shadow: inset 0 0 0 1000px rgba(255, 0, 0, 0.25) !important;
			/* 角丸を維持する */
			border-radius: 3px !important;
			/* 要素全体を上下反転させて矢印を下向きにする */
			transform: scaleY(-1) !important;
		}
		.${LEVEL_TEXT_CLASS} {
			/* 親要素の反転を元に戻す */
			display: inline-block !important;
			transform: scaleY(-1) !important;
		}
	`;
	document.head.appendChild(style);

	// ------------------------------------------------------------------------
	// イベントリスナー (ホバー時の見た目変更 & クリックでのレベルダウン処理)
	// ------------------------------------------------------------------------

	// マウスカーソルが要素に乗ったときの処理
	document.addEventListener('mouseover', (e) => {
		if (!CCTools.config[CONFIG_KEY]) return;
		const target = e.target.closest('.productLevel'); // 施設のレベルアップ箇所
		if (target && e.shiftKey) {
			applyLevelDownStyle(target);
		}
	});

	// マウスカーソルが要素から外れたときの処理
	document.addEventListener('mouseout', (e) => {
		if (!CCTools.config[CONFIG_KEY]) return;
		const target = e.target.closest('.productLevel');
		if (target) {
			removeLevelDownStyle(target);
		}
	});

	// ホバー中にShiftキーが押された・離されたときの処理
	document.addEventListener('keydown', (e) => {
		if (!CCTools.config[CONFIG_KEY]) return;
		if (e.key === 'Shift') {
			const hoveredEl = document.querySelector('.productLevel:hover');
			if (hoveredEl) applyLevelDownStyle(hoveredEl);
		}
	});
	document.addEventListener('keyup', (e) => {
		if (e.key === 'Shift') {
			removeAllLevelDownStyles();
		}
	});

	// 実際のレベルダウン処理（クリックイベント）
	document.addEventListener('click', (e) => {
		if (!CCTools.config[CONFIG_KEY]) return;
		const target = e.target.closest('.productLevel');
		if (target && e.shiftKey) {
			// ゲーム本来のレベルアップ処理が走る前にブロックする
			e.stopPropagation();
			e.preventDefault();
			
			const id = parseInt(target.id.replace('productLevel', ''));
			if (!isNaN(id)) {
				const obj = Game.ObjectsById[id];
				// レベル1以上であればレベルダウン処理を行う
				if (obj && obj.level > 0) {
					const returnedLumps = obj.level;
					
					// 消費した角砂糖（現在のレベルと同じ数）を返還してレベルを下げる
					Game.gainLumps(returnedLumps);
					obj.level -= 1;
					
					// ゲーム情報の更新
					Game.CalculateGains(); // レベル低下に伴うCpSの再計算
					Game.storeToRefresh = 1; // 店舗UIの更新
					Game.upgradesToRebuild = 1;
					
					Game.Notify('レベルダウン', `${obj.name}のレベルを下げ、角砂糖を ${returnedLumps} 個回収しました。`, [typeof obj.iconColumn !== 'undefined' ? obj.iconColumn : id, 29]);
					Game.PlaySound('snd/pop' + Math.floor(Math.random() * 3 + 1) + '.mp3'); // 軽い効果音
				}
			}
		}
	}, true); // キャプチャリングフェーズで横取りする
})();
