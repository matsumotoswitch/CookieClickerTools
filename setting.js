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
		let currentFieldset = null;
		let currentGroupName = null;

		CCTools.settingsUI.forEach(setting => {
			let targetContainer = container;

			if (setting.group) {
				if (currentGroupName !== setting.group) {
					currentFieldset = document.createElement('fieldset');
					currentFieldset.style.border = '1px solid #666';
					currentFieldset.style.padding = '4px 8px 8px 8px';
					currentFieldset.style.margin = '4px 0 8px 0';
					const legend = document.createElement('legend');
					legend.textContent = setting.group;
					legend.style.color = '#ccc';
					legend.style.fontSize = '12px';
					currentFieldset.appendChild(legend);
					container.appendChild(currentFieldset);
					currentGroupName = setting.group;
				}
				targetContainer = currentFieldset;
			} else {
				currentFieldset = null;
				currentGroupName = null;
			}

			if (setting.type === 'toggle') {
				createToggleUI(setting, targetContainer, toggleButtons);
			} else if (setting.type === 'number') {
				createNumberUI(setting, targetContainer, inputElements);
			} else if (setting.type === 'checkbox') {
				createCheckboxUI(setting, targetContainer);
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
	 * チェックボックスコンポーネントを生成してDOMに追加します
	 */
	function createCheckboxUI(setting, container) {
		const wrapper = document.createElement('div');
		wrapper.style.display = 'inline-block';
		wrapper.style.marginRight = '12px';
		wrapper.style.padding = setting.group ? '2px 0' : '2px 0 2px 20px';

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
	 * 生成されたボタンや入力ボックスの幅を、最も広いものに合わせて統一します
	 */
	function alignElementWidths(toggleButtons, inputElements) {
		if (toggleButtons.length === 0) return;

		// 全ボタンの中から最大幅を取得し、ON/OFFの文字数変化に対応する余白を追加
		const currentMax = Math.max(...toggleButtons.map(btn => btn.offsetWidth)) + 30;
		// 過去の最大幅を記憶しておき、ボタンが短くなるのを防ぐ
		CCTools.maxToggleButtonWidth = Math.max(CCTools.maxToggleButtonWidth || 0, currentMax);

		// 共通のスタイル定義
		const sharedStyle = {
			boxSizing: 'border-box',
			width: `${CCTools.maxToggleButtonWidth}px`,
			textAlign: 'right',
			fontFamily: '"Merriweather", Georgia, serif'
		};

		// トグルボタンと入力ボックスの両方にスタイルを一括適用
		[...toggleButtons, ...inputElements].forEach(el => Object.assign(el.style, sharedStyle));
	}

	CCTools.settingsLoaded = true;
	
	// オプション画面が開いている場合は再描画
	if (Game.onMenu === 'prefs') {
		Game.UpdateMenu();
	}
})();
