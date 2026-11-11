/*
 * Store: camada única de dados do Mercado App.
 * Hoje grava no localStorage. Na fase de login, só o "backend" daqui
 * muda (Firestore), e o app.js continua chamando as mesmas funções.
 */
(function (global) {
  "use strict";

  var KEYS = {
    list: "mercado_app_v1",
    history: "mercado_history_v1",
    theme: "mercado_theme_v1"
  };

  /* ---------- backend local ---------- */
  var local = {
    get: function (k, fallback) {
      var raw = null;
      try { raw = localStorage.getItem(k); } catch (e) { return fallback; }
      if (raw == null) return fallback;
      try { return JSON.parse(raw); } catch (e) { return raw; } // valores antigos gravados como texto puro
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { }
    }
  };
  var backend = local;

  /* ---------- nomes padronizados ---------- */
  // "  Feijão  Preto " -> "feijao preto"
  function norm(name) {
    return String(name == null ? "" : name)
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/\s+/g, " ").trim();
  }
  // "  arroz   5kg" -> "Arroz 5kg" (só ajusta espaços e a primeira letra)
  function cleanName(name) {
    var s = String(name == null ? "" : name).replace(/\s+/g, " ").trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  /* ---------- lista atual ---------- */
  function getList() {
    var l = backend.get(KEYS.list, null) || {};
    return {
      budget: Number(l.budget) || 0,
      items: Array.isArray(l.items) ? l.items : [],
      updatedAt: Number(l.updatedAt) || 0
    };
  }
  function setList(list) {
    var json = JSON.stringify(stripMeta(list));
    if (json === lastListJson) return;          // nada mudou: não regrava nem sobe pra nuvem
    lastListJson = json;
    list.updatedAt = Date.now();
    backend.set(KEYS.list, list);
    if (remote) remote.pushList(list);
  }

  /* ---------- histórico de compras ---------- */
  function getHistory() {
    var h = backend.get(KEYS.history, []);
    return Array.isArray(h) ? h : [];
  }
  function setHistory(h) {
    backend.set(KEYS.history, h);
    if (remote) remote.pushHistory(h);
  }

  /* ---------- nuvem (cloud.js pluga aqui quando há login) ---------- */
  var remote = null, lastListJson = null, listeners = [];
  function attachRemote(r) { remote = r; }
  function detachRemote() { remote = null; }
  // chamado pelo cloud.js quando chegam dados de outro aparelho
  function applyRemote(list, history) {
    if (list) { backend.set(KEYS.list, list); lastListJson = JSON.stringify(stripMeta(list)); }
    if (history) backend.set(KEYS.history, history);
    listeners.forEach(function (fn) { fn(); });
  }
  function stripMeta(l) { return { budget: l.budget, items: l.items }; }
  function onRemoteChange(fn) { listeners.push(fn); }

  // última vez que o item foi comprado com preço: { price, market, date } ou null
  function lastPurchase(name, history) {
    var k = norm(name), h = history || getHistory();
    for (var i = h.length - 1; i >= 0; i--) {
      var it = h[i].items.find(function (x) { return norm(x.name) === k && x.price > 0; });
      if (it) return { price: it.price, market: h[i].market, date: h[i].date };
    }
    return null;
  }

  /* ---------- preferências ---------- */
  function getTheme() { return backend.get(KEYS.theme, null); }
  function setTheme(t) { backend.set(KEYS.theme, t); }

  global.Store = {
    norm: norm,
    cleanName: cleanName,
    getList: getList,
    setList: setList,
    getHistory: getHistory,
    setHistory: setHistory,
    lastPurchase: lastPurchase,
    attachRemote: attachRemote,
    detachRemote: detachRemote,
    applyRemote: applyRemote,
    onRemoteChange: onRemoteChange,
    getTheme: getTheme,
    setTheme: setTheme
  };
})(window);
