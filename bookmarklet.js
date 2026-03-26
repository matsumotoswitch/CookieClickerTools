javascript:(function(){
    var baseUrl = 'https://matsumotoswitch.github.io/CookieClickerTools/';
    window.CCTools = window.CCTools || {};
    window.CCTools.baseUrl = baseUrl;

    var s = document.createElement('script');
    s.src = baseUrl + 'main.js?t=' + new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    document.head.appendChild(s);
})();
