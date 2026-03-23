// buy50.js
(function() {
	const BULK_IDS = ['storeBulk1', 'storeBulk10', 'storeBulk100', 'storeBulkMax'];
	const ALL_BULK_IDS = ['storeBulk1', 'storeBulk10', 'storeBulk50', 'storeBulk100', 'storeBulkMax'];

	CCTools.addSetting('enableBuy50', '施設の50個購入機能', 'toggle', true, (isActive) => {
		if (isActive) {
			addBuy50Button();
		} else {
			removeBuy50Button();
		}
	}, { group: '補助系' });

	/**
	 * 50個購入ボタンをUIに追加します
	 */
	function addBuy50Button() {
		const storeBulk = document.getElementById('storeBulk');
		const storeBulk100 = document.getElementById('storeBulk100');
		
		if (!storeBulk || !storeBulk100) return;

		// 既存の50ボタンがあれば削除 (重複防止)
		removeBuy50Elements();

		// 50ボタン要素の作成
		const btn50 = document.createElement('div');
		btn50.id = 'storeBulk50';
		btn50.className = 'storeBulkAmount';
		btn50.textContent = '50';
		
		// 選択状態の初期化
		updateBtn50Style(btn50);

		btn50.onclick = function() {
			// 一旦「1個(id:2)」を選択してゲーム本体に他のボタンの選択状態を解除させる
			Game.storeBulkButton(2);
			
			// その後、個数を50に上書き
			Game.buyBulk = 50;
			Game.storeToRefresh = 1;
			
			// 一時的に選択された「1個」ボタンのハイライトを手動で消す
			const btn1 = document.getElementById('storeBulk1');
			if (btn1) btn1.classList.remove('selected');
			
			updateBtn50Style(btn50);
		};

		// 100ボタンの前に挿入
		storeBulk.insertBefore(btn50, storeBulk100);

		// ボタンが1行に収まるように各ボタンの幅を調整
		ALL_BULK_IDS.forEach(id => {
			const el = document.getElementById(id);
			if (el) el.style.setProperty('width', '43px', 'important');
		});
	}

	/**
	 * 50個購入ボタンをUIから削除します
	 */
	function removeBuy50Button() {
		removeBuy50Elements();

		// 幅の調整を元に戻す
		BULK_IDS.forEach(id => {
			const el = document.getElementById(id);
			if (el) el.style.removeProperty('width');
		});

		// 50個選択時にOFFにした場合、1個選択状態に戻す
		if (Game.buyBulk === 50) {
			Game.storeBulkButton(2);
		}
	}

	/**
	 * DOMから50ボタン要素を全て削除します
	 */
	function removeBuy50Elements() {
		document.querySelectorAll('#storeBulk50').forEach(el => el.remove());
	}

	/**
	 * 50ボタンの見た目を選択状態に合わせて更新します
	 */
	function updateBtn50Style(btn) {
		if (Game.buyBulk === 50) {
			btn.classList.add('selected');
			btn.style.color = '#ffcc66';
		} else {
			btn.classList.remove('selected');
			btn.style.color = '#997733';
		}
	}

	// クッキークリッカー標準の店舗ボタン押下処理をフックして、50ボタンのスタイルを更新
	if (!Game.origStoreBulkButtonCCTools) {
		Game.origStoreBulkButtonCCTools = Game.storeBulkButton;
	}

	Game.storeBulkButton = function(id) {
		Game.origStoreBulkButtonCCTools(id);
		
		if (CCTools.config['enableBuy50']) {
			const btn50 = document.getElementById('storeBulk50');
			if (btn50) updateBtn50Style(btn50);
		}
	};

	// UI構築完了を待ってからボタンを追加
	setTimeout(() => {
		if (CCTools.config['enableBuy50']) {
			addBuy50Button();
		}
	}, 1000);
})();
