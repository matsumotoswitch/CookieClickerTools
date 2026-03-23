// buy50.js
(function() {
	CCTools.addSetting('enableBuy50', '施設の50個購入機能', 'toggle', true, (isActive) => {
		if (isActive) {
			addBuy50Button();
		} else {
			removeBuy50Button();
		}
	}, { group: '補助系' });

	function addBuy50Button() {
		const storeBulk100 = document.getElementById('storeBulk100');
		const storeBulk = document.getElementById('storeBulk');
		
		if (!storeBulk || !storeBulk100) return;

		// 画面内に重複して残ってしまっている「過去のすべての50ボタン」を完全に一掃する
		document.querySelectorAll('#storeBulk50').forEach(el => el.remove());

		// 50ボタンの作成
		const btn50 = document.createElement('div');
		btn50.id = 'storeBulk50';
		btn50.className = 'storeBulkAmount';
		btn50.textContent = '50';
		
		// 初期状態の色設定（アクティブかどうかで明るさを変える）
		btn50.style.color = (Game.buyBulk === 50) ? '#ffcc66' : '#997733'; 
		if (Game.buyBulk === 50) btn50.classList.add('selected');

		btn50.onclick = function() {
			// 一度「1個」を選択したことにして、ゲーム本体に他のボタンのハイライトを安全に解除させる
			Game.storeBulkButton(2);
			
			// その直後に50個モードへ書き換える
			Game.buyBulk = 50;
			Game.storeToRefresh = 1;
			
			// ダミーで光ってしまった「1」のハイライトを手動で優しく消す
			const btn1 = document.getElementById('storeBulk1');
			if (btn1) btn1.classList.remove('selected');
			
			// 50を光らせる
			btn50.classList.add('selected');
			btn50.style.color = '#ffcc66';
		};

		// 100の前に挿入
		storeBulk.insertBefore(btn50, storeBulk100);

		// 1, 10, 100, all の間の空白（マージンやパディング）を削って、
		// 改行させずに50をねじ込む（右端の位置をなるべく維持する）
		['storeBulk1', 'storeBulk10', 'storeBulk50', 'storeBulk100', 'storeBulkMax'].forEach(id => {
			const el = document.getElementById(id);
			if (el) {
				el.style.setProperty('width', '43px', 'important');
			}
		});
	}

	function removeBuy50Button() {
		document.querySelectorAll('#storeBulk50').forEach(el => el.remove());

		// 数値ボタンの余白を元の状態に戻す
		['storeBulk1', 'storeBulk10', 'storeBulk100', 'storeBulkMax'].forEach(id => {
			const el = document.getElementById(id);
			if (el) {
				el.style.removeProperty('width');
			}
		});

		if (Game.buyBulk === 50) {
			// 設定をOFFにした時、個数を1に戻す（ID:2 が「1個」）
			Game.storeBulkButton(2);
		}
	}

	// 50が選択された時の見た目（ハイライト）を処理するために標準関数を拡張
	// ※二重フック（上書きの多重発生による暴走）を防ぐための安全装置
	if (!Game.origStoreBulkButtonCCTools) {
		Game.origStoreBulkButtonCCTools = Game.storeBulkButton;
	}

	Game.storeBulkButton = function(id) {
		Game.origStoreBulkButtonCCTools(id);
		
		if (CCTools.config['enableBuy50']) {
			const btn50 = document.getElementById('storeBulk50');
			if (btn50) {
				// 他の数字ボタンが押された場合、buyBulkは50ではなくなるため暗くする
				if (Game.buyBulk === 50) {
					btn50.classList.add('selected');
					btn50.style.color = '#ffcc66'; // アクティブ時は明るい色
				} else {
					btn50.classList.remove('selected');
					btn50.style.color = '#997733'; // 非アクティブ時は暗い色
				}
			}
		}
	};

	// CC本体のUI構築後にボタンを追加する
	setTimeout(() => {
		if (CCTools.config['enableBuy50']) {
			addBuy50Button();
		}
	}, 1000);
})();
