// settings.js
(function() {
	// 既に読み込み済みの場合はスキップ
	if (CCTools.settingsLoaded) return;
	
	// 設定UIを構築するためのリスト
	CCTools.settingsUI = [];

	/**
	 * 各ツールから設定項目を追加するためのAPI
	 * @param {string} id - 設定のユニークID (CCTools.config.id として保存されます)
	 * @param {string} name - 画面に表示する設定名
	 * @param {string} type - 'toggle' (ON/OFFボタン) など
	 * @param {any} defaultValue - 初期値
	 * @param {function} callback - 値が変更された時に呼ばれるコールバック
	 */
	CCTools.addSetting = function(id, name, type, defaultValue, callback) {
		// 初期値が未設定の場合のみセットする（再読み込み時の状態維持のため）
		if (typeof CCTools.config[id] === 'undefined') {
			CCTools.config[id] = defaultValue;
		}
		CCTools.settingsUI.push({ id, name, type, callback });
	};

	// クッキークリッカーの元のメニュー更新関数を退避
	const originalUpdateMenu = Game.UpdateMenu;

	// メニュー更新関数を上書きして、独自のUIを挿入する
	Game.UpdateMenu = function() {
		// 元のメニュー描画を実行
		originalUpdateMenu();

		// 'prefs' はクッキークリッカーの「オプション」画面
		if (Game.onMenu === 'prefs') {
			renderCCToolsMenu();
		}
	};

	/**
	 * CCTools専用の設定メニューセクションを構築し、各UI要素を描画します
	 */
	function renderCCToolsMenu() {
		const menu = document.getElementById('menu');
		if (!menu) return;

		const cheatSection = document.createElement('div');
		cheatSection.className = 'block';
		cheatSection.style.padding = '0px';
		cheatSection.style.margin = '8px 4px';
		cheatSection.innerHTML = `
			<div class="subsection" style="padding:0px;">
				<div class="title">CCTools Settings</div>
				<div class="listing" id="cctools-settings-container"></div>
			</div>
		`;
		// スクロール時の余白を確保するため、一番下にある余白divの前に挿入する
		menu.insertBefore(cheatSection, menu.lastElementChild);

		const container = document.getElementById('cctools-settings-container');
		const toggleButtons = [];
		const inputElements = [];

		CCTools.settingsUI.forEach(setting => {
			if (setting.type === 'toggle') {
				createToggleUI(setting, container, toggleButtons);
			} else if (setting.type === 'number') {
				createNumberUI(setting, container, inputElements);
			}
		});
		
		alignElementWidths(toggleButtons, inputElements);
	}

	/**
	 * トグルボタンコンポーネントを生成してDOMに追加します
	 */
	function createToggleUI(setting, container, toggleButtons) {
		const btn = document.createElement('a');
		const isActive = CCTools.config[setting.id];
		btn.className = isActive ? 'option prefButton on' : 'option prefButton off';
		btn.innerText = setting.name + (isActive ? ' ON' : ' OFF');
		
		btn.onclick = function() {
			CCTools.config[setting.id] = !CCTools.config[setting.id];
			Game.UpdateMenu(); 
			if (setting.callback) setting.callback(CCTools.config[setting.id]);
		};
		container.appendChild(btn);
		toggleButtons.push(btn);
		
		const label = document.createElement('label');
		label.textContent = ` ${setting.name}を有効/無効にします。`;
		container.appendChild(label);
		container.appendChild(document.createElement('br'));
	}

	/**
	 * 数値入力コンポーネントを生成してDOMに追加します
	 */
	function createNumberUI(setting, container, inputElements) {
		const input = document.createElement('input');
		input.type = 'number';
		input.value = CCTools.config[setting.id];
		input.style.width = '60px';
		input.style.padding = '2px 4px';
		input.style.border = '1px solid #999';
		input.style.borderRadius = '3px';
		input.style.background = '#111';
		input.style.color = '#fff';
		input.style.margin = '2px 4px 2px 0px';
		
		input.onchange = function() {
			let val = Number(input.value);
			if (isNaN(val) || val < 0) val = 0;
			input.value = val;
			CCTools.config[setting.id] = val;
			if (setting.callback) setting.callback(val);
		};
		
		const label = document.createElement('label');
		label.textContent = ` ${setting.name}`;
		container.appendChild(input);
		container.appendChild(label);
		container.appendChild(document.createElement('br'));
		
		inputElements.push(input);
	}

	/**
	 * 生成されたボタンや入力ボックスの幅を、最も広いものに合わせて統一します
	 */
	function alignElementWidths(toggleButtons, inputElements) {
		let maxWidth = 0;
		if (toggleButtons.length > 0) {
			toggleButtons.forEach(btn => {
				if (btn.offsetWidth > maxWidth) maxWidth = btn.offsetWidth;
			});
			maxWidth += 30; // ON/OFFの文字数変化に対応する余白
		}
		
		if (maxWidth > 0 || CCTools.maxToggleButtonWidth) {
			CCTools.maxToggleButtonWidth = Math.max(CCTools.maxToggleButtonWidth || 0, maxWidth);

			toggleButtons.forEach(btn => {
				btn.style.boxSizing = 'border-box';
				btn.style.width = CCTools.maxToggleButtonWidth + 'px';
				btn.style.textAlign = 'right';
				btn.style.fontFamily = '"Merriweather", Georgia, serif';
			});
			
			inputElements.forEach(input => {
				input.style.boxSizing = 'border-box';
				input.style.width = CCTools.maxToggleButtonWidth + 'px';
				input.style.textAlign = 'right';
				input.style.fontFamily = '"Merriweather", Georgia, serif';
			});
		}
	}

	CCTools.settingsLoaded = true;
	
	// UIを即座に反映させるため、もしオプション画面を開いていれば再描画
	if (Game.onMenu === 'prefs') {
		Game.UpdateMenu();
	}
})();
