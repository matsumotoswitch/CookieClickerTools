javascript:(function(){
    /* ※ 以下のURLは、ご自身のGitHubのリポジトリ(GitHub Pages等)のURLに変更してください（末尾の / は必須です） */
    var baseUrl = 'http://localhost:8080/';
    window.CCTools = window.CCTools || {};
    window.CCTools.baseUrl = baseUrl;

    var s = document.createElement('script');
    s.src = baseUrl + 'main.js?t=' + new Date().getTime();
    document.head.appendChild(s);
})();
