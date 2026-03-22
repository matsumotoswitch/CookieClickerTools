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
	 * @param {object} options - その他のオプション (group など)
	 */
	CCTools.addSetting = function(id, name, type, defaultValue, callback, options = {}) {
		// 初期値が未設定の場合のみセットする（再読み込み時の状態維持のため）
		if (typeof CCTools.config[id] === 'undefined') {
			CCTools.config[id] = defaultValue;
		}
		CCTools.settingsUI.push(Object.assign({ id, name, type, callback }, options));
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
		let currentGroupName = null;

		CCTools.settingsUI.forEach(setting => {
			if (setting.group) {
				if (currentGroupName !== setting.group) {
					const legend = document.createElement('div');
					legend.textContent = setting.group;
					legend.style.color = '#ccc';
					legend.style.fontSize = '13px';
					legend.style.fontWeight = 'bold';
					legend.style.margin = '12px 0 4px 0';
					container.appendChild(legend);
					currentGroupName = setting.group;
				}
			} else {
				currentGroupName = null;
			}

			if (setting.type === 'toggle') {
				createToggleUI(setting, container, toggleButtons);
			} else if (setting.type === 'number') {
				createNumberUI(setting, container, inputElements);
			} else if (setting.type === 'checkbox') {
				createCheckboxUI(setting, container);
			} else if (setting.type === 'select') {
				createSelectUI(setting, container, inputElements);
			}
		});
	}

	/**
	 * トグルボタンコンポーネントを生成してDOMに追加します
	 */
	function createToggleUI(setting, container, toggleButtons) {
		const div = document.createElement('div');
		div.className = 'listing';
		div.style.cssText = 'display: flex; align-items: center; justify-content: flex-start; margin-bottom: 4px;';

		const btn = document.createElement('a');
		const isActive = CCTools.config[setting.id];
		btn.className = isActive ? 'option on' : 'option off';
		btn.innerText = setting.name + (isActive ? ' ON' : ' OFF');
		btn.setAttribute('style', 'float: none !important; margin-right: 8px;');
		
		btn.onclick = function() {
			CCTools.config[setting.id] = !CCTools.config[setting.id];
			Game.UpdateMenu(); 
			if (setting.callback) setting.callback(CCTools.config[setting.id]);
		};
		toggleButtons.push(btn);
		
		const label = document.createElement('label');
		label.textContent = ` ${setting.name}を有効/無効にします。`;
		div.appendChild(btn);
		div.appendChild(label);
		container.appendChild(div);
	}

	/**
	 * 数値入力コンポーネントを生成してDOMに追加します
	 */
	function createNumberUI(setting, container, inputElements) {
		const div = document.createElement('div');
		div.className = 'listing';
		div.style.cssText = 'display: flex; align-items: center; justify-content: flex-start; margin-bottom: 4px;';

		const input = document.createElement('input');
		input.type = 'number';
		input.value = CCTools.config[setting.id];
		input.style.width = '60px';
		input.style.padding = '2px 4px';
		input.style.border = '1px solid #999';
		input.style.borderRadius = '3px';
		input.style.background = '#111';
		input.style.color = '#fff';
		input.style.margin = '2px 8px 2px 0px';
		
		input.onchange = function() {
			let val = Number(input.value);
			if (isNaN(val) || val < 0) val = 0;
			input.value = val;
			CCTools.config[setting.id] = val;
			if (setting.callback) setting.callback(val);
		};
		
		const label = document.createElement('label');
		label.textContent = ` ${setting.name}`;
		div.appendChild(input);
		div.appendChild(label);
		container.appendChild(div);
		
		inputElements.push(input);
	}

	/**
	 * チェックボックスコンポーネントを生成してDOMに追加します
	 */
	function createCheckboxUI(setting, container) {
		const wrapper = document.createElement('div');
		wrapper.className = 'listing';
		wrapper.style.cssText = 'display: inline-flex; align-items: center; justify-content: flex-start; width: 172px; box-sizing: border-box; margin: 2px 12px 2px 0px; padding: 0;';

		const input = document.createElement('input');
		input.type = 'checkbox';
		input.checked = CCTools.config[setting.id];
		input.style.margin = '0 6px 0 0';
		input.style.verticalAlign = 'middle';
		
		input.onchange = () => {
			CCTools.config[setting.id] = input.checked;
			if (setting.callback) setting.callback(input.checked);
		};
		
		const label = document.createElement('label');
		label.textContent = setting.name;
		label.style.verticalAlign = 'middle';
		label.style.fontSize = '12px';
		
		wrapper.appendChild(input);
		wrapper.appendChild(label);
		container.appendChild(wrapper);
	}

	/**
	 * プルダウンコンポーネントを生成してDOMに追加します
	 */
	function createSelectUI(setting, container, inputElements) {
		const div = document.createElement('div');
		div.className = 'listing';
		div.style.cssText = 'display: flex; align-items: center; justify-content: flex-start; margin-bottom: 4px;';

		const select = document.createElement('select');
		select.style.padding = '2px 4px';
		select.style.border = '1px solid #999';
		select.style.borderRadius = '3px';
		select.style.background = '#111';
		select.style.color = '#fff';
		select.style.margin = '2px 8px 2px 0px';
		
		if (setting.selectOptions) {
			setting.selectOptions.forEach(opt => {
				const option = document.createElement('option');
				option.value = opt.value;
				option.textContent = opt.label;
				if (String(CCTools.config[setting.id]) === String(opt.value)) {
					option.selected = true;
				}
				select.appendChild(option);
			});
		}

		select.onchange = function() {
			CCTools.config[setting.id] = select.value;
			if (setting.callback) setting.callback(select.value);
		};
		
		const label = document.createElement('label');
		label.textContent = ` ${setting.name}`;
		div.appendChild(select);
		div.appendChild(label);
		container.appendChild(div);
		
		inputElements.push(select);
	}

	CCTools.settingsLoaded = true;
	
	// オプション画面が開いている場合は再描画
	if (Game.onMenu === 'prefs') {
		Game.UpdateMenu();
	}
})();
