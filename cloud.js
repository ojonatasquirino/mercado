/*
 * Cloud: login (Google e e-mail/senha) + sincronização no Firestore.
 * Só liga se firebase-config.js tiver a configuração do projeto.
 * Sem login, o app segue 100% local como antes.
 *
 * Estrutura no Firestore:
 *   users/{uid}/estado/lista     -> { budget, items, updatedAt }
 *   users/{uid}/compras/{id}     -> { date, market, total, items }
 */
(function (global) {
  "use strict";

  var SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
  var cfg = global.FIREBASE_CONFIG;
  var fb = null, auth = null, db = null, user = null;
  var unsubs = [], userListeners = [], statusListeners = [];
  var knownPurchaseIds = {}, pushTimer = null;

  function enabled() { return !!(cfg && cfg.apiKey && cfg.projectId); }

  function loadScript(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = function () { fail(new Error("offline")); };
      document.head.appendChild(s);
    });
  }

  var ready = null;
  function init() {
    if (!enabled()) return Promise.reject(new Error("disabled"));
    if (ready) return ready;
    ready = loadScript(SDK + "firebase-app-compat.js")
      .then(function () { return Promise.all([loadScript(SDK + "firebase-auth-compat.js"), loadScript(SDK + "firebase-firestore-compat.js")]); })
      .then(function () {
        fb = global.firebase;
        fb.initializeApp(cfg);
        auth = fb.auth();
        auth.languageCode = "pt";
        db = fb.firestore();
        return db.enablePersistence({ synchronizeTabs: true }).catch(function () { });
      })
      .then(function () {
        // volta de um login por redirecionamento (fallback do popup)
        auth.getRedirectResult().catch(function () { });
        auth.onAuthStateChanged(function (u) {
          user = u;
          stopSync();
          if (u) startSync(u);
          userListeners.forEach(function (fn) { fn(u); });
        });
      });
    ready.catch(function () { ready = null; });
    return ready;
  }

  /* ---------- autenticação ---------- */
  function google() {
    return init().then(function () {
      var p = new fb.auth.GoogleAuthProvider();
      p.setCustomParameters({ prompt: "select_account" });
      return auth.signInWithPopup(p).catch(function (e) {
        if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) {
          return auth.signInWithRedirect(p);
        }
        throw e;
      });
    });
  }
  function emailSignIn(email, pass) { return init().then(function () { return auth.signInWithEmailAndPassword(email, pass); }); }
  function emailSignUp(email, pass) { return init().then(function () { return auth.createUserWithEmailAndPassword(email, pass); }); }
  function resetPassword(email) { return init().then(function () { return auth.sendPasswordResetEmail(email); }); }
  function signOut() { return auth ? auth.signOut() : Promise.resolve(); }

  var ERR = {
    "auth/invalid-email": "E-mail inválido",
    "auth/missing-email": "Informe o e-mail",
    "auth/missing-password": "Informe a senha",
    "auth/weak-password": "Senha fraca: use pelo menos 6 caracteres",
    "auth/email-already-in-use": "Esse e-mail já tem conta. Toque em Entrar",
    "auth/invalid-credential": "E-mail ou senha incorretos",
    "auth/wrong-password": "E-mail ou senha incorretos",
    "auth/user-not-found": "Não existe conta com esse e-mail",
    "auth/too-many-requests": "Muitas tentativas. Espere um pouco",
    "auth/network-request-failed": "Sem internet. Tente de novo com conexão",
    "auth/popup-closed-by-user": "Login cancelado",
    "auth/cancelled-popup-request": "Login cancelado",
    "auth/unauthorized-domain": "Domínio não autorizado no Firebase (veja o passo 5 do README)",
    "offline": "Sem internet para carregar o login"
  };
  function errorText(e) { return ERR[(e && (e.code || e.message)) || ""] || "Não deu certo. Tente de novo"; }

  /* ---------- sincronização ---------- */
  function userRef() { return db.collection("users").doc(user.uid); }
  function listRef() { return userRef().collection("estado").doc("lista"); }
  function comprasRef() { return userRef().collection("compras"); }

  function setStatus(s) { statusListeners.forEach(function (fn) { fn(s); }); }

  function startSync(u) {
    setStatus("sincronizando");
    var local = Store.getList(), localHist = Store.getHistory();
    Promise.all([listRef().get(), comprasRef().get()]).then(function (res) {
      var remoteList = res[0].exists ? res[0].data() : null;
      var remoteHist = res[1].docs.map(function (d) { var x = d.data(); x.id = d.id; return x; });

      // histórico: junta os dois lados, sem duplicar (mesmo id)
      var byId = {};
      remoteHist.forEach(function (h) { byId[h.id] = h; knownPurchaseIds[h.id] = 1; });
      var batch = db.batch(), pending = 0;
      localHist.forEach(function (h) {
        if (!byId[h.id]) { byId[h.id] = h; batch.set(comprasRef().doc(h.id), clean(h)); knownPurchaseIds[h.id] = 1; pending++; }
      });
      var merged = Object.keys(byId).map(function (k) { return byId[k]; }).sort(function (a, b) { return a.date - b.date; });

      // lista atual: vale a mais recente
      var list = local;
      if (remoteList && (remoteList.updatedAt || 0) > (local.updatedAt || 0)) list = remoteList;
      else if (local.items.length || local.budget) { batch.set(listRef(), clean(local)); pending++; }

      if (pending) batch.commit().catch(function () { });
      Store.applyRemote(list, merged);
      Store.attachRemote({ pushList: pushList, pushHistory: pushHistory });
      listenRemote();
      setStatus("ok");
    }).catch(function () { setStatus("erro"); });
  }

  function listenRemote() {
    unsubs.push(listRef().onSnapshot(function (snap) {
      if (!snap.exists || snap.metadata.hasPendingWrites) return;
      var d = snap.data();
      if ((d.updatedAt || 0) > (Store.getList().updatedAt || 0)) Store.applyRemote(d, null);
    }));
    unsubs.push(comprasRef().onSnapshot(function (snap) {
      if (snap.metadata.hasPendingWrites) return;
      var h = snap.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; })
        .sort(function (a, b) { return a.date - b.date; });
      knownPurchaseIds = {};
      h.forEach(function (x) { knownPurchaseIds[x.id] = 1; });
      Store.applyRemote(null, h);
    }));
  }

  function stopSync() {
    unsubs.forEach(function (u) { try { u(); } catch (e) { } });
    unsubs = []; knownPurchaseIds = {};
    Store.detachRemote();
  }

  // Firestore não aceita undefined
  function clean(o) { return JSON.parse(JSON.stringify(o)); }

  function pushList(list) {
    if (!user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      listRef().set(clean({ budget: list.budget, items: list.items, updatedAt: list.updatedAt || Date.now() })).catch(function () { setStatus("erro"); });
    }, 500);
  }

  function pushHistory(h) {
    if (!user) return;
    var now = {}, batch = db.batch(), n = 0;
    h.forEach(function (p) {
      now[p.id] = 1;
      if (!knownPurchaseIds[p.id]) { batch.set(comprasRef().doc(p.id), clean(p)); n++; }
    });
    Object.keys(knownPurchaseIds).forEach(function (id) {
      if (!now[id]) { batch.delete(comprasRef().doc(id)); n++; }
    });
    knownPurchaseIds = now;
    if (n) batch.commit().catch(function () { setStatus("erro"); });
  }

  global.Cloud = {
    enabled: enabled,
    init: init,
    google: google,
    emailSignIn: emailSignIn,
    emailSignUp: emailSignUp,
    resetPassword: resetPassword,
    signOut: signOut,
    errorText: errorText,
    user: function () { return user; },
    onUser: function (fn) { userListeners.push(fn); },
    onStatus: function (fn) { statusListeners.push(fn); }
  };
})(window);
