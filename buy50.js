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
		
		if (!storeBulk || !storeBulk100 || document.getElementById('storeBulk50')) return;

		// 50ボタンの作成
		const btn50 = document.createElement('div');
		btn50.id = 'storeBulk50';
		btn50.className = 'storeBulkAmount';
		btn50.textContent = '50';
		
		// 他の数値と色を少し変える（例: ややオレンジ寄りの色）
		btn50.style.color = '#ffcc66'; 

		btn50.onclick = function() {
			Game.storeBulkButton(0, 50);
			Game.PlaySound('snd/tick.mp3');
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
		const btn50 = document.getElementById('storeBulk50');
		if (btn50) btn50.remove();

		// 数値ボタンの余白を元の状態に戻す
		['storeBulk1', 'storeBulk10', 'storeBulk100', 'storeBulkMax'].forEach(id => {
			const el = document.getElementById(id);
			if (el) {
				el.style.removeProperty('width');
			}
		});

		if (Game.buyBulk === 50) {
			Game.storeBulkButton(0, 1);
		}
	}

	// 50が選択された時の見た目（ハイライト）を処理するために標準関数を拡張
	const origStoreBulkButton = Game.storeBulkButton;
	Game.storeBulkButton = function(type, val) {
		origStoreBulkButton(type, val);
		
		if (type === 0 && CCTools.config['enableBuy50']) {
			const btn50 = document.getElementById('storeBulk50');
			if (btn50) {
				if (val === 50) {
					Game.buyBulk = 50;
					btn50.className = 'storeBulkAmount selected';
					// 50が選ばれたときは他の選択状態を手動で解除
					['storeBulk1', 'storeBulk10', 'storeBulk100', 'storeBulkMax'].forEach(id => {
						const el = document.getElementById(id);
						if (el) el.className = 'storeBulkAmount';
					});
					Game.storeToRefresh = 1;
				} else {
					btn50.className = 'storeBulkAmount';
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
