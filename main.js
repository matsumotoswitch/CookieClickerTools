// main.js
if (typeof window.CCTools === 'undefined' || typeof window.CCTools.init === 'undefined') {
	window.CCTools = Object.assign(window.CCTools || {}, {
		// 読み込むモジュールのリスト（後から autoclicker.js などをここに追加します）
		modules: [
			'setting.js',
			'autoclicker.js',
			'autogolden.js',
			'fthof.js',
			'autofortune.js',
			'wrinkler.js',
			'automarket.js'
		],
		
		// 各ツールの設定値を保持するオブジェクト
		config: {},
		
		/**
		 * CCToolsの初期化処理
		 * 登録されたモジュールを非同期で順次読み込み、完了後にUIを更新します。
		 */
		init: async function() {
			console.log('[CCTools] ツールの初期化を開始します...');
			for (const mod of this.modules) {
				await this.loadModule(mod);
			}
			console.log('[CCTools] 全モジュールの読み込みが完了しました。');
			
			// 全モジュール読み込み完了後のフックがあればここで実行
			if (typeof this.onReady === 'function') {
				this.onReady();
			}
			
			// 全てのモジュールが読み込まれた後に、オプション画面を開いていればUIを更新
			if (typeof Game !== 'undefined' && Game.onMenu === 'prefs') {
				Game.UpdateMenu();
			}
		},
		
		/**
		 * 外部JSファイルを動的に読み込むヘルパー関数
		 * @param {string} filename - 読み込むJSファイルの名前
		 * @returns {Promise<void>} 読み込み完了時に解決されるPromise
		 */
		loadModule: function(filename) {
			return new Promise((resolve, reject) => {
				const script = document.createElement('script');
				// ブラウザのキャッシュ対策としてクエリパラメータに現在時刻を付与
				script.src = this.baseUrl + filename + '?t=' + new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
				
				script.onload = () => {
					console.log(`[CCTools] モジュール読み込み成功: ${filename}`);
					resolve();
				};
				
				script.onerror = () => {
					console.error(`[CCTools] モジュール読み込み失敗: ${filename}`);
					reject(new Error(`Failed to load ${filename}`));
				};
				
				document.head.appendChild(script);
			});
		}
	});

	// 初期化の実行
	window.CCTools.init();
} else {
	console.log('[CCTools] 既に起動しています。');
}
