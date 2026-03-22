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
- **フォーチュンクッキー自動クリック (`autofortune.js`)**
  - ニュースティッカーに緑色に光るフォーチュンニュースが出現した際、自動でクリックして獲得します。
- **虫の一括駆除ホットキー (`wrinkler.js`)**
  - キーボードの「W」キーを押すことで、画面に取り付いているすべての「しわしわ虫 (Wrinkler)」を一括で退治してクッキーを回収します。
- **株式市場の自動売買 (`automarket.js`)**
  - 魔法の仲介人が100人以上の時、60秒ごとに株価とトレンドを判定し、設定された閾値（基準価格の0.8倍で購入、1.2倍で売却）に基づいて自動で株の売買を行います。取引の履歴はブラウザのコンソールに出力されます。
- **パンテオン「Godzamok」の自動発動 (`autogodzamok.js`)**
  - クリックバフやCpSバフが発動した際に、チェックボックスで指定した施設を自動で売買し、GodzamokのDevastationバフを発動させます。さらにゴールデンスイッチのON/OFFや、バフ時間を延ばすためのFPS低下ハックも自動的に行われます。

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
