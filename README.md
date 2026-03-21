# Cookie Clicker Tools (CCTools)

クッキークリッカー（Cookie Clicker）をより快適にプレイするためのモジュール式拡張・チートツールです。
ゲーム内のオプション（Options）画面にシームレスに統合された専用設定UIから、各機能のON/OFFや詳細設定をリアルタイムに変更できます。

## 実装されている機能

- **大クッキー自動クリック (`autoclicker.js`)**
  - 大クッキーを指定した速度（1秒あたりのクリック数 / CPS）で自動的にクリックします。
- **ゴールデンクッキー＆トナカイ自動クリック (`autogolden.js`)**
  - 画面に出現したゴールデンクッキー（怒りのクッキー含む）や、クリスマスのトナカイを自動で即座にクリックして回収します。
- **Force the Hand of Fate 予測表示 (`fthof.js`)**
  - 魔法塔のミニゲーム「グリモア」の魔法「Force the Hand of Fate (手相占い)」の次から10回分の結果（成功/失敗、得られるバフの内容）を画面中央のテーブルで予測表示します。季節による結果の変動にも対応しています。

## 導入方法（使い方）

1. 本リポジトリの全ファイルを、ご自身のGitHub Pagesやローカルサーバー等のWebサーバーに配置します。
2. ブラウザで新しいブックマークを作成し、URL欄に以下のブックマークレット用コード（`bookmarklet.js` と同等のもの）を登録します。

```javascript
javascript:(function(){
    /* ※ baseUrlを、jsファイルを配置した実際のURL（末尾の / は必須）に変更してください */
    var baseUrl = 'https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO/';
    window.CCTools = window.CCTools || {};
    window.CCTools.baseUrl = baseUrl;
    var s = document.createElement('script');
    s.src = baseUrl + 'main.js';
    document.head.appendChild(s);
})();
```

3. クッキークリッカーをブラウザで開きます。
4. 登録したブックマークをクリックして実行します。
5. 画面上部の「オプション（Options）」を開くと、一番下に「CCTools Settings」が追加されているので、そこから各機能の操作を行ってください。

## 開発と拡張について

本ツールはモジュール方式を採用しています。
新しい機能を追加したい場合は、以下の手順で簡単に拡張できます。

1. 新しい機能のJavaScriptファイル（例: `autobuyer.js`）を作成します。
2. `CCTools.addSetting(id, name, type, defaultValue, callback)` APIを使用して、設定UIに項目を追加します。
3. `main.js` の `modules` 配列に、作成したファイル名を追加します。

**UI追加の例:**
```javascript
CCTools.addSetting('myNewFeature', '新しいチート機能', 'toggle', true, (isActive) => {
    if (isActive) {
        // 機能ON時の処理
    } else {
        // 機能OFF時の処理
    }
});
```
