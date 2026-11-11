(function () {
  "use strict";

  /* ---------------- Dados (via store.js) ---------------- */
  var state = Store.getList();
  var hist = Store.getHistory();
  function save() { Store.setList(state); }
  function saveHist() { Store.setHistory(hist); }
  var norm = Store.norm;
  // compara um preço com a última compra do item: { pct, last } ou null
  function priceDelta(name, price) {
    if (!(price > 0)) return null;
    var lp = Store.lastPurchase(name, hist);
    if (!lp || !(lp.price > 0)) return null;
    return { pct: ((price - lp.price) / lp.price) * 100, last: lp };
  }
  function deltaText(d) {
    var v = Math.abs(d.pct).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    return (d.pct > 0 ? "↑ " + v + "% mais caro" : "↓ " + v + "% mais barato") + " que no " + d.last.market;
  }
  function lastPrice(name) { var lp = Store.lastPurchase(name, hist); return lp ? lp.price : 0; }

  /* ---------------- Preset lists ---------------- */
  var PRESETS = {
    "Compras do Mês": [
      ["Feijão", 1, 0], ["Arroz", 1, 0], ["Açúcar", 1, 0],
      ["Fubá", 1, 0], ["Macarrão", 1, 0], ["Massa pra sopa", 1, 0],
      ["Leite líquido", 1, 0], ["Leite em pó", 1, 0], ["Leite condensado", 1, 0],
      ["Creme de leite", 1, 0], ["Manteiga", 1, 0], ["Achocolatado", 1, 0],
      ["Proteína", 1, 0], ["Polpa", 2, 0], ["Frutas", 1, 0],
      ["Verduras", 1, 0], ["Temperos", 1, 0], ["Congelados", 1, 0],
      ["Alho", 1, 0], ["Azeite", 1, 0], ["Café", 1, 0]
    ],
    "Proteínas": [
      ["Frango (kg)", 1, 0], ["Carne de boi (kg)", 1, 0], ["Carne moída (kg)", 1, 0],
      ["Carne de porco (kg)", 1, 0], ["Linguiça", 1, 0], ["Peixe / filé", 1, 0],
      ["Ovos (dúzia)", 1, 0], ["Salsicha", 1, 0]
    ],
    "Limpeza e afins": [
      ["Perfex", 1, 0], ["Sabão", 1, 0], ["Amaciante", 1, 0],
      ["Papel toalha", 1, 0], ["Água sanitária", 1, 0], ["Detergente", 1, 0],
      ["Desinfetante", 1, 0], ["Desinfetante em gel", 1, 0], ["Papel higiênico", 1, 0],
      ["Pasta", 1, 0], ["Sabonete", 1, 0], ["Multiuso", 1, 0],
      ["Bucha de pia", 1, 0], ["Álcool", 1, 0], ["Fósforo", 1, 0],
      ["Disco de algodão", 1, 0], ["Leite de rosas", 1, 0], ["Desodorante", 1, 0]
    ]
  };

  /* ---------------- Helpers ---------------- */
  function brl(n) {
    return "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function total() { return state.items.reduce(function (s, i) { return s + i.qty * i.price; }, 0); }
  function cartTotal() { return state.items.reduce(function (s, i) { return s + (i.checked ? i.qty * i.price : 0); }, 0); }
  // aceita "4,99", "4.99", "1.234,56"
  function num(v) {
    var s = String(v == null ? "" : v).trim().replace(/\s|R\$/g, "");
    if (!s) return NaN;
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    return parseFloat(s);
  }
  function fmtMoney(n) { return n ? Number(n).toFixed(2).replace(".", ",") : ""; }
  function fmtNum(n) { return n ? String(n).replace(".", ",") : ""; }
  function $(id) { return document.getElementById(id); }

  var toastTimer;
  function toast(msg, actionLabel, action) {
    var t = $("toast");
    t.textContent = msg;
    if (actionLabel) {
      var b = document.createElement("button");
      b.textContent = actionLabel;
      b.addEventListener("click", function () { t.classList.remove("show"); action(); });
      t.appendChild(b);
    }
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, actionLabel ? 5000 : 2200);
  }

  /* ---------------- Render ---------------- */
  function render() {
    // presets
    var pc = $("presets");
    if (!pc.dataset.built) {
      pc.innerHTML = "";
      Object.keys(PRESETS).forEach(function (name) {
        var b = document.createElement("button");
        b.className = "chip";
        b.innerHTML = name + ' <span class="cnt">' + PRESETS[name].length + "</span>";
        b.addEventListener("click", function () { addPreset(name); });
        pc.appendChild(b);
      });
      pc.dataset.built = "1";
    }

    // items
    var wrap = $("items");
    wrap.innerHTML = "";
    var ordered = state.items.filter(function (i) { return !i.checked; })
      .concat(state.items.filter(function (i) { return i.checked; }));
    ordered.forEach(function (it) {
      var row = document.createElement("div");
      row.className = "item" + (it.checked ? " done" : "");
      row.innerHTML =
        '<button class="check" aria-label="Marcar como pego">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' +
        '</button>' +
        '<div class="item-main">' +
        '<div class="item-name"></div>' +
        '<div class="item-meta">' +
        '<span class="stepper"><button class="step minus" aria-label="Diminuir quantidade">−</button>' +
        '<span class="qty">' + fmtNum(it.qty) + '</span>' +
        '<button class="step plus" aria-label="Aumentar quantidade">+</button></span>' +
        (function () {
          if (!(it.price > 0)) {
            var lp = lastPrice(it.name);
            return lp ? '<span class="hint">última vez ' + brl(lp) + '</span>' : "";
          }
          var d = priceDelta(it.name, it.price);
          var badge = d && Math.abs(d.pct) >= 1
            ? ' <span class="delta ' + (d.pct > 0 ? "up" : "down") + '" title="' + esc(deltaText(d)) + '">' +
              (d.pct > 0 ? "↑" : "↓") + Math.abs(d.pct).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + "%</span>"
            : "";
          return '<span class="hint">× ' + brl(it.price) + '</span>' + badge;
        })() + '</div>' +
        '</div>' +
        (it.price > 0 || it.checked
          ? '<div class="item-total">' + brl(it.qty * it.price) + '</div>'
          : '<div class="input-prefix price-inline-wrap"><span>R$</span><input class="input price-inline" type="text" inputmode="decimal" placeholder="0,00" aria-label="Preço de ' + esc(it.name) + '" /></div>') +
        '<div class="item-actions">' +
        '<button class="icon-btn edit" aria-label="Editar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>' +
        '<button class="icon-btn del" aria-label="Excluir"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>' +
        '</div>';
      row.querySelector(".item-name").textContent = it.name;
      row.querySelector(".check").addEventListener("click", function () { toggle(it.id); });
      row.querySelector(".edit").addEventListener("click", function () { openItem(it.id); });
      row.querySelector(".del").addEventListener("click", function () { remove(it.id); });
      row.querySelector(".minus").addEventListener("click", function () { stepQty(it.id, -1); });
      row.querySelector(".plus").addEventListener("click", function () { stepQty(it.id, 1); });
      var pi = row.querySelector(".price-inline");
      if (pi) {
        var commit = function () {
          var v = num(pi.value);
          if (v > 0) {
            it.price = v; it.checked = true; render();
            var d = priceDelta(it.name, v);
            toast(d && Math.abs(d.pct) >= 1 ? it.name + ": " + deltaText(d) : it.name + " no carrinho");
          }
        };
        pi.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); commit(); } });
        pi.addEventListener("change", commit);
      }
      wrap.appendChild(row);
    });

    var has = state.items.length > 0;
    $("empty").style.display = has ? "none" : "block";
    $("clearBtn").style.display = has ? "" : "none";
    $("shareBtn").style.display = has ? "" : "none";
    $("checkoutBtn").style.display = has ? "" : "none";
    $("itemBadge").textContent = state.items.length;

    // summary
    var planned = total();
    var t = cartTotal();
    var checked = state.items.filter(function (i) { return i.checked; }).length;
    $("budgetVal").textContent = brl(state.budget);
    $("spentVal").textContent = brl(t);
    $("spentSub").textContent = checked + " de " + state.items.length + " · planejado " + brl(planned);

    // balance
    var diff = state.budget - t;
    var balVal = $("balVal"), balLabel = $("balLabel"), balSub = $("balSub");
    if (state.budget <= 0) {
      balLabel.lastChild.textContent = " Economia";
      balVal.className = "value";
      balVal.textContent = "—";
      balSub.textContent = "defina um orçamento";
    } else if (diff >= 0) {
      balLabel.lastChild.textContent = " Economia";
      balVal.className = "value pos";
      balVal.textContent = brl(diff);
      balSub.textContent = "dentro do orçamento";
    } else {
      balLabel.lastChild.textContent = " Excedente";
      balVal.className = "value neg";
      balVal.textContent = "- " + brl(Math.abs(diff));
      balSub.textContent = "acima do orçamento";
    }

    // progress
    var pcard = $("progressCard");
    pcard.style.display = has ? "" : "none";
    $("progTrack").style.display = state.budget > 0 ? "" : "none";
    if (state.budget > 0) {
      var pct = Math.min(100, (t / state.budget) * 100);
      var bar = $("bar");
      bar.style.width = pct + "%";
      bar.className = "bar" + (t > state.budget ? " over" : pct >= 85 ? " warn" : "");
      $("progLeft").textContent = "No carrinho " + brl(t) + " / " + brl(state.budget);
      $("progRight").textContent = Math.round((t / state.budget) * 100) + "%";
    } else {
      $("progLeft").textContent = "No carrinho: " + brl(t) + " · " + checked + " de " + state.items.length;
      $("progRight").innerHTML = '<button class="linklike" id="progBudget">definir orçamento</button>';
      $("progBudget").addEventListener("click", openBudget);
    }

    save();
  }

  /* ---------------- Actions ---------------- */
  function addPreset(name) {
    var have = {};
    state.items.forEach(function (i) { have[norm(i.name)] = 1; });
    var batch = PRESETS[name].filter(function (p) { return !have[norm(p[0])]; })
      .map(function (p) { return { id: uid(), name: p[0], qty: p[1], price: p[2], checked: false }; });
    if (!batch.length) { toast("Todos os itens já estão na lista"); return; }
    state.items = batch.concat(state.items);
    render();
    var skipped = PRESETS[name].length - batch.length;
    toast(batch.length + " itens adicionados" + (skipped ? " · " + skipped + " já estavam" : ""));
  }
  function toggle(id) {
    var it = find(id); if (it) { it.checked = !it.checked; render(); }
  }
  function remove(id) {
    var idx = state.items.findIndex(function (i) { return i.id === id; });
    if (idx < 0) return;
    var removed = state.items.splice(idx, 1)[0];
    render();
    toast('"' + removed.name + '" removido', "Desfazer", function () {
      state.items.splice(idx, 0, removed); render();
    });
  }
  function stepQty(id, dir) {
    var it = find(id); if (!it) return;
    var step = it.qty % 1 ? 0.5 : 1;          // kg fracionado anda de 0,5
    var q = Math.round((it.qty + dir * step) * 100) / 100;
    if (q <= 0) { remove(id); return; }
    it.qty = q; render();
  }
  function findByName(name) {
    var k = norm(name);
    return state.items.find(function (i) { return norm(i.name) === k; });
  }

  function shareText() {
    var pend = state.items.filter(function (i) { return !i.checked; });
    var done = state.items.filter(function (i) { return i.checked; });
    function line(i, mark) {
      var q = i.qty !== 1 ? fmtNum(i.qty) + "x " : "";
      return mark + " " + q + i.name + (i.price > 0 ? " · " + brl(i.qty * i.price) : "");
    }
    var out = ["🛒 *Lista de mercado*", ""];
    if (pend.length) { out.push("*Falta pegar (" + pend.length + ")*"); pend.forEach(function (i) { out.push(line(i, "▫️")); }); out.push(""); }
    if (done.length) { out.push("*No carrinho (" + done.length + ")*"); done.forEach(function (i) { out.push(line(i, "✅")); }); out.push(""); }
    out.push("*Total no carrinho:* " + brl(cartTotal()));
    if (state.budget > 0) out.push("*Orçamento:* " + brl(state.budget));
    out.push("", "_feito no Mercado App · ojonatasquirino.github.io/mercado_");
    return out.join("\n");
  }
  function shareList() {
    if (!state.items.length) return;
    window.open("https://wa.me/?text=" + encodeURIComponent(shareText()), "_blank");
  }

  function find(id) { return state.items.find(function (i) { return i.id === id; }); }

  function clearAll() {
    if (!state.items.length) return;
    var backup = state.items;
    state.items = []; render();
    toast("Lista limpa", "Desfazer", function () { state.items = backup; render(); });
  }

  /* ---------------- Item dialog ---------------- */
  var editingId = null;
  function openItem(id, voice) {
    editingId = id || null;
    $("dlgHeard").style.display = voice ? "" : "none";
    $("againBtn").style.display = voice ? "" : "none";
    var it = id ? find(id) : null;
    $("dlgTitle").textContent = it ? "Editar item" : "Adicionar item";
    $("dlgDesc").textContent = it ? "Atualize a quantidade ou o preço." : "Informe o nome, a quantidade e o preço unitário.";
    $("saveBtn").textContent = it ? "Salvar" : "Adicionar";
    $("fName").value = it ? it.name : "";
    $("fQty").value = it ? fmtNum(it.qty) : "1";
    $("fPrice").value = it ? fmtMoney(it.price) : "";
    if (voice) {
      var ex = voice.name ? findByName(voice.name) : null;
      $("dlgTitle").textContent = "Confirmar item";
      $("dlgDesc").textContent = ex ? "Já está na lista: vou atualizar o preço." : "Confira e ajuste se precisar.";
      $("dlgHeard").textContent = "“" + voice.text + "”";
      $("saveBtn").textContent = ex ? "Atualizar" : "Adicionar";
      $("fName").value = ex ? ex.name : voice.name;
      $("fQty").value = fmtNum(voice.qty !== 1 || !ex ? voice.qty : ex.qty);
      $("fPrice").value = fmtMoney(voice.price);
    }
    updatePreview();
    $("overlay").classList.add("open");
    if (voice) {
      setTimeout(function () { (voice.name ? (voice.price ? $("saveBtn") : $("fPrice")) : $("fName")).focus(); }, 40);
      return;
    }
    setTimeout(function () { $("fName").focus(); }, 40);
  }
  function closeItem() { $("overlay").classList.remove("open"); editingId = null; }

  /* ---------------- Voz ---------------- */
  var VOICE_ERRORS = {
    "not-allowed": "Permita o microfone nas configurações do navegador",
    "service-not-allowed": "Permita o microfone nas configurações do navegador",
    "network": "O ditado precisa de internet. Digite o item por enquanto",
    "audio-capture": "Nenhum microfone encontrado",
    "no-speech": "Não ouvi nada. Tente de novo",
    "unsupported": "Seu navegador não tem ditado por voz",
    "start": "Não consegui abrir o microfone"
  };
  var voiceErr = null;
  function startVoice() {
    closeItem();
    voiceErr = null;
    $("voiceText").textContent = "Fale o item, a quantidade e o preço";
    $("voiceStatus").textContent = "Ouvindo…";
    $("voiceOrb").classList.remove("idle");
    $("voiceOverlay").classList.add("open");
    Voice.listen({
      onPartial: function (txt) { $("voiceText").textContent = txt; },
      onError: function (code) { if (voiceErr !== "aborted") voiceErr = code; },
      onEnd: function (text) {
        var wasCancelled = voiceErr === "aborted";
        $("voiceOverlay").classList.remove("open");
        if (wasCancelled) return;
        if (!text) { toast(VOICE_ERRORS[voiceErr || "no-speech"] || "Não entendi. Tente de novo"); return; }
        var r = Voice.parse(text);
        r.text = text;
        openItem(null, r);
      }
    });
  }
  function cancelVoice() { voiceErr = "aborted"; Voice.stop(); $("voiceOverlay").classList.remove("open"); }

  function updatePreview() {
    var q = num($("fQty").value) || 0;
    var p = num($("fPrice").value) || 0;
    $("dlgPreview").textContent = brl(q * p);
    var d = priceDelta($("fName").value, p), n = $("dlgDelta");
    if (d && Math.abs(d.pct) >= 1) {
      n.textContent = deltaText(d) + " (" + brl(d.last.price) + ")";
      n.className = "dlg-delta " + (d.pct > 0 ? "up" : "down");
    } else {
      var lp = Store.lastPurchase($("fName").value, hist);
      n.textContent = lp ? "Última vez: " + brl(lp.price) + " no " + lp.market : "";
      n.className = "dlg-delta";
    }
  }

  function saveItem() {
    var name = Store.cleanName($("fName").value);
    var qty = num($("fQty").value);
    var price = num($("fPrice").value);
    if (!name) { $("fName").focus(); toast("Dê um nome ao item"); return; }
    if (!qty || qty <= 0) qty = 1;
    if (!price || price < 0) price = 0;

    if (editingId) {
      var it = find(editingId);
      if (it) { it.name = name; it.qty = qty; it.price = price; if (price > 0) it.checked = true; }
      toast("Item atualizado");
    } else {
      var ex = findByName(name);
      if (ex) {
        if (qty !== 1) ex.qty = qty; if (price > 0) { ex.price = price; ex.checked = true; }
        toast(ex.name + " já estava na lista · atualizado");
      } else {
        state.items.unshift({ id: uid(), name: name, qty: qty, price: price, checked: price > 0 });
        var d = priceDelta(name, price);
        toast(d && Math.abs(d.pct) >= 1 ? name + ": " + deltaText(d) : "Item adicionado");
      }
    }
    closeItem();
    render();
  }

  /* ---------------- Budget dialog ---------------- */
  function openBudget() {
    $("fBudget").value = state.budget > 0 ? fmtNum(state.budget) : "";
    $("budgetOverlay").classList.add("open");
    setTimeout(function () { $("fBudget").focus(); }, 40);
  }
  function closeBudget() { $("budgetOverlay").classList.remove("open"); }
  function saveBudget() {
    var v = num($("fBudget").value);
    state.budget = (!v || v < 0) ? 0 : v;
    closeBudget(); render(); toast("Orçamento salvo");
  }

  /* ---------------- Calculator ---------------- */
  var calc = { expr: "", history: "" };

  var CALC_BTNS = [
    { l: "C", cls: "fn", a: "clear" },
    { l: "⌫", cls: "fn", a: "back" },
    { l: "%", cls: "fn", a: "pct" },
    { l: "÷", cls: "op", a: "op", v: "/" },
    { l: "7", a: "d" }, { l: "8", a: "d" }, { l: "9", a: "d" }, { l: "×", cls: "op", a: "op", v: "*" },
    { l: "4", a: "d" }, { l: "5", a: "d" }, { l: "6", a: "d" }, { l: "−", cls: "op", a: "op", v: "-" },
    { l: "1", a: "d" }, { l: "2", a: "d" }, { l: "3", a: "d" }, { l: "+", cls: "op", a: "op", v: "+" },
    { l: "0", a: "d", cls: "span2" }, { l: ".", a: "d" }, { l: "=", cls: "accent", a: "eq" }
  ];

  function buildCalc() {
    var g = $("calcGrid");
    CALC_BTNS.forEach(function (def) {
      var b = document.createElement("button");
      b.className = "calc-btn" + (def.cls ? " " + def.cls : "");
      b.textContent = def.l;
      b.addEventListener("click", function () { calcInput(def); });
      g.appendChild(b);
    });
  }

  // safe expression evaluation (no eval)
  function calcTokenize(s) {
    var tokens = [], i = 0, prev = null;
    while (i < s.length) {
      var c = s[i];
      if (c === " ") { i++; continue; }
      if ("+-*/".indexOf(c) >= 0) {
        var unary = c === "-" && (prev === null || prev.t === "op");
        if (unary) {
          var num = "-"; i++;
          while (i < s.length && ((s[i] >= "0" && s[i] <= "9") || s[i] === ".")) { num += s[i]; i++; }
          if (num === "-") { var lone = { t: "op", v: "-" }; tokens.push(lone); prev = lone; continue; }
          var neg = { t: "num", v: parseFloat(num) }; tokens.push(neg); prev = neg; continue;
        }
        var op = { t: "op", v: c }; tokens.push(op); prev = op; i++;
      } else if ((c >= "0" && c <= "9") || c === ".") {
        var n = c; i++;
        while (i < s.length && ((s[i] >= "0" && s[i] <= "9") || s[i] === ".")) { n += s[i]; i++; }
        var tn = { t: "num", v: parseFloat(n) }; tokens.push(tn); prev = tn;
      } else { i++; }
    }
    return tokens;
  }
  function calcToRPN(tokens) {
    var out = [], ops = [], prec = { "+": 1, "-": 1, "*": 2, "/": 2 };
    tokens.forEach(function (tk) {
      if (tk.t === "num") out.push(tk);
      else {
        while (ops.length && prec[ops[ops.length - 1].v] >= prec[tk.v]) out.push(ops.pop());
        ops.push(tk);
      }
    });
    while (ops.length) out.push(ops.pop());
    return out;
  }
  function calcEvalRPN(rpn) {
    var st = [];
    rpn.forEach(function (tk) {
      if (tk.t === "num") st.push(tk.v);
      else {
        var b = st.pop(), a = st.pop();
        if (a === undefined || b === undefined) throw new Error("e");
        var r;
        if (tk.v === "+") r = a + b;
        else if (tk.v === "-") r = a - b;
        else if (tk.v === "*") r = a * b;
        else r = a / b;
        st.push(r);
      }
    });
    if (st.length !== 1) throw new Error("e");
    return st[0];
  }
  function calcCompute(expr) {
    var t = calcTokenize(expr);
    if (!t.length) return 0;
    var r = calcEvalRPN(calcToRPN(t));
    if (!isFinite(r)) throw new Error("inf");
    return r;
  }
  function calcStripTail(s) { return s.replace(/[+\-*/.]+$/, ""); }
  function calcPretty(s) {
    return s.replace(/\+/g, " + ").replace(/-/g, " − ").replace(/\*/g, " × ")
      .replace(/\//g, " ÷ ").replace(/\s+/g, " ").trim();
  }
  function calcFmt(n) {
    if (!isFinite(n)) return "Erro";
    var r = Math.round(n * 1e10) / 1e10;
    return r.toLocaleString("pt-BR", { maximumFractionDigits: 10 });
  }

  function calcAppendChar(ch) {
    if (ch === ".") {
      var m = calc.expr.match(/(\d*\.?\d*)$/);
      if (m && m[1].indexOf(".") >= 0) return;
      if (!m || m[1] === "") { calc.expr += "0."; return; }
      calc.expr += ".";
      return;
    }
    calc.expr += ch;
  }
  function calcAppendOp(v) {
    if (calc.expr === "") { if (v === "-") calc.expr = "-"; return; }
    var last = calc.expr.slice(-1);
    if ("+-*/".indexOf(last) >= 0) calc.expr = calc.expr.slice(0, -1) + v;
    else calc.expr += v;
  }
  function calcPct() {
    var m = calc.expr.match(/(\d*\.?\d+)$/);
    if (m) {
      var num = parseFloat(m[1]) / 100;
      calc.expr = calc.expr.slice(0, m.index) + String(num);
    }
  }
  function calcEquals() {
    var src = calcStripTail(calc.expr);
    if (src === "") return;
    try {
      var r = calcCompute(src);
      r = Math.round(r * 1e10) / 1e10;
      calc.history = calcPretty(src) + " =";
      calc.expr = String(r);
    } catch (e) {
      calc.history = "";
      calc.expr = "";
      $("calcResult").textContent = "Erro";
      $("calcExpr").innerHTML = "&nbsp;";
      return;
    }
  }

  function calcInput(def) {
    if (calc.history) {
      if (def.a === "d") calc.expr = "";
      calc.history = "";
    }
    if (def.a === "clear") { calc.expr = ""; }
    else if (def.a === "back") { calc.expr = calc.expr.slice(0, -1); }
    else if (def.a === "d") { calcAppendChar(def.l); }
    else if (def.a === "op") { calcAppendOp(def.v); }
    else if (def.a === "pct") { calcPct(); }
    else if (def.a === "eq") { calcEquals(); }
    renderCalc();
  }

  function renderCalc() {
    $("calcExpr").innerHTML = calc.history || calcPretty(calc.expr) || "&nbsp;";
    var resEl = $("calcResult");
    if (calc.expr === "") { resEl.textContent = "0"; return; }
    try {
      var r = calcCompute(calcStripTail(calc.expr));
      resEl.textContent = calcFmt(r);
    } catch (e) { resEl.textContent = "—"; }
  }

  function openCalc() {
    $("calcOverlay").classList.add("open");
    renderCalc();
  }
  function closeCalc() { $("calcOverlay").classList.remove("open"); }

  function calcKey(e) {
    if (!$("calcOverlay").classList.contains("open")) return;
    var k = e.key;
    if (/^[0-9]$/.test(k)) { calcInput({ a: "d", l: k }); }
    else if (k === ".") { calcInput({ a: "d", l: "." }); }
    else if (k === "+") { calcInput({ a: "op", v: "+" }); }
    else if (k === "-") { calcInput({ a: "op", v: "-" }); }
    else if (k === "*") { calcInput({ a: "op", v: "*" }); }
    else if (k === "/") { e.preventDefault(); calcInput({ a: "op", v: "/" }); }
    else if (k === "%") { calcInput({ a: "pct" }); }
    else if (k === "Enter" || k === "=") { e.preventDefault(); calcInput({ a: "eq" }); }
    else if (k === "Backspace") { e.preventDefault(); calcInput({ a: "back" }); }
    else if (k === "Delete" || k.toLowerCase() === "c") { calcInput({ a: "clear" }); }
  }

  /* ---------------- Theme ---------------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var moon = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    var sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>';
    $("themeIcon").innerHTML = t === "dark" ? sun : moon;
    Store.setTheme(t);
  }
  function initTheme() {
    var saved;
    saved = Store.getTheme();
    if (!saved) saved = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    applyTheme(saved);
  }

  /* ---------------- Nota / Receipt ---------------- */
  function fmtNow() {
    var d = new Date();
    return d.toLocaleDateString("pt-BR") + " · " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 120);
  }

  function ensureJsPDF(cb) {
    if (window.jspdf && window.jspdf.jsPDF) { cb(); return; }
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = function () { cb(); };
    s.onerror = function () { cb(new Error("offline")); };
    document.head.appendChild(s);
  }

  function notaData() {
    var t = total();
    var pegos = state.items.filter(function (i) { return i.checked; }).length;
    var diff = state.budget - t;
    return { t: t, pegos: pegos, diff: diff, hasBudget: state.budget > 0 };
  }

  function generatePDF() {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "pt", format: "a4" });
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();
    var M = 48, y = M;
    var rSub = W - M, rUnit = rSub - 95, rQtd = rUnit - 78, xName = M;
    var nameMax = rQtd - 50 - xName;
    var d = notaData();

    function colHeader() {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text("ITEM", xName, y);
      doc.text("QTD", rQtd, y, { align: "right" });
      doc.text("UNIT.", rUnit, y, { align: "right" });
      doc.text("SUBTOTAL", rSub, y, { align: "right" });
      y += 8; doc.setDrawColor(220); doc.line(M, y, W - M, y); y += 16;
      doc.setTextColor(30);
    }

    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(20);
    doc.text("Nota de Compra", M, y); y += 20;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(130);
    doc.text("Lista de Mercado · " + fmtNow(), M, y); y += 12;
    doc.text(state.items.length + " itens" + (d.pegos ? " · " + d.pegos + " pegos" : ""), M, y);
    y += 22;
    doc.setDrawColor(30); doc.setLineWidth(1); doc.line(M, y, W - M, y); doc.setLineWidth(1);
    y += 22;
    colHeader();

    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
    state.items.forEach(function (it) {
      if (y > H - 150) { doc.addPage(); y = M; colHeader(); doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); }
      var lines = doc.splitTextToSize(it.name, nameMax);
      var name = lines[0] + (lines.length > 1 ? "…" : "");
      doc.setTextColor(it.checked ? 150 : 25);
      doc.text(name, xName, y);
      doc.setTextColor(90);
      doc.text(String(it.qty), rQtd, y, { align: "right" });
      doc.text(brl(it.price).replace("R$ ", ""), rUnit, y, { align: "right" });
      doc.setTextColor(25);
      doc.text(brl(it.qty * it.price), rSub, y, { align: "right" });
      y += 13; doc.setDrawColor(240); doc.line(M, y, W - M, y); y += 14;
    });

    if (y > H - 170) { doc.addPage(); y = M; }
    y += 6; doc.setDrawColor(30); doc.setLineWidth(1); doc.line(M, y, W - M, y); y += 24;
    function totalLine(label, val, bold, color) {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(bold ? 13 : 11);
      doc.setTextColor(color || (bold ? 20 : 90));
      doc.text(label, M, y);
      doc.text(val, rSub, y, { align: "right" });
      y += bold ? 22 : 18;
    }
    totalLine("Total da lista", brl(d.t), true);
    if (d.hasBudget) {
      totalLine("Orçamento estabelecido", brl(state.budget), false);
      if (d.diff >= 0) totalLine("Economia", brl(d.diff), false, [22, 163, 74]);
      else totalLine("Excedente", "- " + brl(Math.abs(d.diff)), false, [220, 38, 38]);
    }

    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(150);
    doc.text("feito com amor por ojonatasquirino.com", W / 2, H - 36, { align: "center" });

    doc.save("nota-mercado.pdf");
  }

  function generateDOC() {
    var d = notaData();
    var rows = state.items.map(function (it) {
      var style = it.checked ? ' style="color:#9aa0a6;text-decoration:line-through"' : "";
      return '<tr' + style + '>' +
        '<td>' + esc(it.name) + '</td>' +
        '<td class="c">' + it.qty + '</td>' +
        '<td class="r">' + brl(it.price) + '</td>' +
        '<td class="r">' + brl(it.qty * it.price) + '</td></tr>';
    }).join("");

    var totals = '<tr class="tot"><td colspan="3">Total da lista</td><td class="r">' + brl(d.t) + '</td></tr>';
    if (d.hasBudget) {
      totals += '<tr><td colspan="3">Orçamento estabelecido</td><td class="r">' + brl(state.budget) + '</td></tr>';
      if (d.diff >= 0) totals += '<tr style="color:#16a34a"><td colspan="3">Economia</td><td class="r">' + brl(d.diff) + '</td></tr>';
      else totals += '<tr style="color:#dc2626"><td colspan="3">Excedente</td><td class="r">- ' + brl(Math.abs(d.diff)) + '</td></tr>';
    }

    var html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">' +
      '<head><meta charset="utf-8"><title>Nota de Compra</title><style>' +
      'body{font-family:Arial,sans-serif;color:#1a1a1a;font-size:11pt}' +
      'h1{font-size:18pt;margin:0 0 4px}.sub{color:#777;font-size:9.5pt;margin:0 0 16px}' +
      'table{width:100%;border-collapse:collapse}' +
      'th{text-align:left;font-size:8.5pt;color:#777;border-bottom:1.5px solid #333;padding:6px 4px}' +
      'td{padding:7px 4px;border-bottom:1px solid #eee}.c{text-align:center}.r{text-align:right}' +
      '.tot td{font-weight:bold;font-size:13pt;border-top:1.5px solid #333;border-bottom:none;padding-top:12px}' +
      '.foot{text-align:center;color:#999;font-size:9pt;margin-top:30px}' +
      '</style></head><body>' +
      '<h1>Nota de Compra</h1>' +
      '<p class="sub">Lista de Mercado &middot; ' + fmtNow() + ' &middot; ' + state.items.length + ' itens' +
      (d.pegos ? " &middot; " + d.pegos + " pegos" : "") + '</p>' +
      '<table><tr><th>Item</th><th class="c">Qtd</th><th class="r">Unit.</th><th class="r">Subtotal</th></tr>' +
      rows + totals + '</table>' +
      '<p class="foot">feito com amor por ojonatasquirino.com</p>' +
      '</body></html>';

    downloadBlob(new Blob(["\ufeff" + html], { type: "application/msword" }), "nota-mercado.doc");
  }

  function purchasedItems() {
    var picked = state.items.filter(function (i) { return i.checked && i.price > 0; });
    if (!picked.length) picked = state.items.filter(function (i) { return i.price > 0; });
    return picked;
  }

  function checkout() {
    if (!state.items.length) { toast("Adicione itens primeiro"); return; }
    var items = purchasedItems();
    if (!items.length) { toast("Preencha o preço de pelo menos um item"); return; }
    var markets = [];
    hist.forEach(function (h) { if (h.market && markets.indexOf(h.market) < 0) markets.push(h.market); });
    $("marketList").innerHTML = markets.map(function (m) { return '<option value="' + esc(m) + '">'; }).join("");
    $("fMarket").value = hist.length ? hist[hist.length - 1].market || "" : "";
    var tot = items.reduce(function (s, i) { return s + i.qty * i.price; }, 0);
    $("coInfo").textContent = items.length + (items.length === 1 ? " item com preço" : " itens com preço");
    $("coTotal").textContent = brl(tot);
    $("checkoutOverlay").classList.add("open");
    setTimeout(function () { $("fMarket").focus(); }, 40);
  }
  function closeCheckout() { $("checkoutOverlay").classList.remove("open"); }

  function confirmCheckout() {
    var items = purchasedItems();
    var market = $("fMarket").value.trim() || "Sem nome";
    var rec = {
      id: uid(), date: Date.now(), market: market,
      items: items.map(function (i) { return { name: i.name, qty: i.qty, price: i.price }; })
    };
    rec.total = rec.items.reduce(function (s, i) { return s + i.qty * i.price; }, 0);
    hist.push(rec); saveHist();
    closeCheckout();
    generateNota(function () {
      toast("Compra salva em " + market, "Nova lista", function () {
        state.items = []; render(); toast("Lista pronta para a próxima compra");
      });
    });
  }

  function generateNota(done) {
    toast("Gerando nota…");
    ensureJsPDF(function (err) {
      if (err) generateDOC();
      else { try { generatePDF(); } catch (e) { generateDOC(); } }
      if (done) done();
    });
  }

  /* ---------------- Tela de histórico ---------------- */
  function monthKey(ts) { var d = new Date(ts); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2); }
  function monthName(k) {
    var p = k.split("-");
    return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  }
  function shortBRL(n) {
    if (n >= 1000) return "R$ " + (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
    return "R$ " + Math.round(n);
  }
  function pct(a, b) { return b ? ((a - b) / b) * 100 : 0; }
  function pctTxt(v) { return (v > 0 ? "+" : "") + v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%"; }

  function renderHist() {
    var el = $("histBody");
    if (!hist.length) {
      el.innerHTML = '<div class="empty card"><p>Nenhuma compra salva ainda</p>' +
        '<p class="small">Ao tocar em "Finalizar compra", ela aparece aqui com gráficos e comparativos.</p></div>';
      return;
    }
    var now = new Date();
    var cur = monthKey(now);
    var prev = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    var byMonth = {};
    hist.forEach(function (h) { var k = monthKey(h.date); byMonth[k] = (byMonth[k] || 0) + h.total; });
    var curTot = byMonth[cur] || 0, prevTot = byMonth[prev] || 0;
    var monthHist = hist.filter(function (h) { return monthKey(h.date) === cur; });
    var html = "";

    // resumo
    var varTxt = prevTot ? pctTxt(pct(curTot, prevTot)) : "—";
    var varCls = !prevTot ? "" : curTot > prevTot ? " neg" : " pos";
    html += '<div class="hstats">' +
      '<div class="card stat"><div class="label">Este mês</div><div class="value">' + brl(curTot) + '</div><div class="sub">' + monthHist.length + ' compra' + (monthHist.length === 1 ? "" : "s") + '</div></div>' +
      '<div class="card stat"><div class="label">Mês passado</div><div class="value">' + brl(prevTot) + '</div></div>' +
      '<div class="card stat"><div class="label">Variação</div><div class="value' + varCls + '">' + varTxt + '</div><div class="sub">vs. mês passado</div></div>' +
      '</div>';

    // gastos por mês (últimos 6)
    var months = [];
    for (var i = 5; i >= 0; i--) months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
    var maxM = Math.max.apply(null, months.map(function (k) { return byMonth[k] || 0; })) || 1;
    html += '<div class="card hsec"><h4>Gastos por mês <small>últimos 6 meses</small></h4><div class="vbars">' +
      months.map(function (k) {
        var v = byMonth[k] || 0;
        return '<div class="vbar' + (k === cur ? " cur" : "") + '"><span class="v">' + (v ? shortBRL(v) : "") + '</span>' +
          '<div class="b" style="height:' + Math.max(2, (v / maxM) * 100) + '%"></div><span>' + monthName(k) + '</span></div>';
      }).join("") + '</div></div>';

    // por mercado (este mês)
    var byMk = {};
    monthHist.forEach(function (h) { byMk[h.market] = (byMk[h.market] || 0) + h.total; });
    var mk = Object.keys(byMk).sort(function (a, b) { return byMk[b] - byMk[a]; });
    html += '<div class="card hsec"><h4>Por mercado <small>este mês</small></h4>';
    if (!mk.length) html += '<p class="none">Nenhuma compra este mês.</p>';
    else {
      var maxMk = byMk[mk[0]];
      html += '<div class="hrows">' + mk.map(function (m) {
        return '<div class="hrow"><span class="n">' + esc(m) + '</span><span class="amt">' + brl(byMk[m]) + '</span>' +
          '<div class="track"><div class="bar" style="width:' + (byMk[m] / maxMk) * 100 + '%"></div></div></div>';
      }).join("") + '</div>';
    }
    html += '</div>';

    // onde mais gastou (este mês)
    var byItem = {};
    monthHist.forEach(function (h) {
      h.items.forEach(function (it) {
        var k = norm(it.name);
        if (!byItem[k]) byItem[k] = { name: it.name, v: 0 };
        byItem[k].v += it.qty * it.price;
      });
    });
    var top = Object.keys(byItem).map(function (k) { return byItem[k]; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 5);
    html += '<div class="card hsec"><h4>Onde mais gastou <small>este mês</small></h4>';
    if (!top.length) html += '<p class="none">Nenhuma compra este mês.</p>';
    else {
      var maxI = top[0].v;
      html += '<div class="hrows">' + top.map(function (t) {
        return '<div class="hrow"><span class="n">' + esc(t.name) + '</span><span class="amt">' + brl(t.v) + '</span>' +
          '<div class="track"><div class="bar" style="width:' + (t.v / maxI) * 100 + '%"></div></div></div>';
      }).join("") + '</div>';
    }
    html += '</div>';

    // variação de preço: última compra vs anterior do mesmo item
    var series = {};
    hist.forEach(function (h) {
      h.items.forEach(function (it) {
        if (!(it.price > 0)) return;
        var k = norm(it.name);
        if (!series[k]) series[k] = { name: it.name, pts: [] };
        series[k].pts.push({ p: it.price, m: h.market, d: h.date });
      });
    });
    var changes = Object.keys(series).map(function (k) {
      var s = series[k], n = s.pts.length;
      if (n < 2) return null;
      var a = s.pts[n - 2], b = s.pts[n - 1];
      return { name: s.name, from: a, to: b, pct: pct(b.p, a.p) };
    }).filter(function (c) { return c && c.pct !== 0; });
    var ups = changes.filter(function (c) { return c.pct > 0; }).sort(function (a, b) { return b.pct - a.pct; }).slice(0, 5);
    var downs = changes.filter(function (c) { return c.pct < 0; }).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 3);
    function changeRow(c, cls) {
      return '<div class="hrow"><span class="n">' + esc(c.name) + '</span><span class="amt ' + cls + '">' + pctTxt(c.pct) + '</span>' +
        '<span class="sub">' + brl(c.from.p) + ' (' + esc(c.from.m) + ') → ' + brl(c.to.p) + ' (' + esc(c.to.m) + ')</span></div>';
    }
    html += '<div class="card hsec"><h4>Mais subiram de preço <small>vs. compra anterior</small></h4>';
    html += ups.length ? '<div class="hrows">' + ups.map(function (c) { return changeRow(c, "up"); }).join("") + '</div>'
      : '<p class="none">Nada subiu ainda. Aparece quando você compra o mesmo item em duas compras.</p>';
    html += '</div>';
    if (downs.length) {
      html += '<div class="card hsec"><h4>Ficaram mais baratos</h4><div class="hrows">' +
        downs.map(function (c) { return changeRow(c, "down"); }).join("") + '</div></div>';
    }

    // lista de compras
    html += '<div class="card hsec"><h4>Compras <small>' + hist.length + ' no total</small></h4>' +
      hist.slice().reverse().map(function (h) {
        var d = new Date(h.date);
        return '<div class="purchase" data-id="' + h.id + '"><div class="pm"><b>' + esc(h.market) + '</b>' +
          '<span>' + d.toLocaleDateString("pt-BR") + ' · ' + h.items.length + (h.items.length === 1 ? ' item · ' : ' itens · ') + brl(h.total) + '</span></div>' +
          '<button class="btn btn-outline btn-sm h-repeat">Repetir</button>' +
          '<button class="icon-btn del h-del" aria-label="Excluir compra"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button></div>';
      }).join("") + '</div>';

    el.innerHTML = html;
    el.querySelectorAll(".purchase").forEach(function (row) {
      var id = row.getAttribute("data-id");
      row.querySelector(".h-repeat").addEventListener("click", function () { repeatPurchase(id); });
      row.querySelector(".h-del").addEventListener("click", function () { deletePurchase(id); });
    });
  }

  function repeatPurchase(id) {
    var h = hist.find(function (x) { return x.id === id; });
    if (!h) return;
    var have = {};
    state.items.forEach(function (i) { have[norm(i.name)] = 1; });
    var add = h.items.filter(function (i) { return !have[norm(i.name)]; })
      .map(function (i) { return { id: uid(), name: i.name, qty: i.qty, price: 0, checked: false }; });
    state.items = add.concat(state.items);
    render(); closeHist();
    toast(add.length ? add.length + " itens de " + h.market + " na lista" : "Esses itens já estão na lista");
  }

  function deletePurchase(id) {
    var idx = hist.findIndex(function (x) { return x.id === id; });
    if (idx < 0) return;
    var removed = hist.splice(idx, 1)[0];
    saveHist(); renderHist();
    toast("Compra removida", "Desfazer", function () { hist.splice(idx, 0, removed); saveHist(); renderHist(); });
  }

  function openHist() { renderHist(); $("histOverlay").classList.add("open"); }
  function closeHist() { $("histOverlay").classList.remove("open"); }

  /* ---------------- Events ---------------- */
  $("addBtn").addEventListener("click", function () { openItem(null); });
  $("cancelBtn").addEventListener("click", closeItem);
  $("saveBtn").addEventListener("click", saveItem);
  $("fQty").addEventListener("input", updatePreview);
  $("fPrice").addEventListener("input", updatePreview);
  $("fName").addEventListener("keydown", function (e) { if (e.key === "Enter") $("fPrice").focus(); });
  $("fPrice").addEventListener("keydown", function (e) { if (e.key === "Enter") saveItem(); });

  $("budgetVal").addEventListener("click", openBudget);
  $("budgetCancel").addEventListener("click", closeBudget);
  $("budgetSave").addEventListener("click", saveBudget);
  $("fBudget").addEventListener("keydown", function (e) { if (e.key === "Enter") saveBudget(); });

  $("clearBtn").addEventListener("click", clearAll);
  if (Voice.supported()) $("micBtn").style.display = "";
  $("micBtn").addEventListener("click", startVoice);
  $("againBtn").addEventListener("click", startVoice);
  $("voiceOrb").addEventListener("click", function () { $("voiceStatus").textContent = "Processando…"; $("voiceOrb").classList.add("idle"); Voice.stop(); });
  $("voiceCancel").addEventListener("click", cancelVoice);
  $("shareBtn").addEventListener("click", shareList);
  $("fName").addEventListener("input", updatePreview);
  $("checkoutBtn").addEventListener("click", checkout);

  $("calcBtn").addEventListener("click", openCalc);
  $("histBtn").addEventListener("click", openHist);
  $("histClose").addEventListener("click", closeHist);
  $("coCancel").addEventListener("click", closeCheckout);
  $("coSave").addEventListener("click", confirmCheckout);
  $("fMarket").addEventListener("keydown", function (e) { if (e.key === "Enter") confirmCheckout(); });
  $("calcClose").addEventListener("click", closeCalc);

  $("themeBtn").addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "dark" ? "light" : "dark");
  });

  // close overlays on backdrop click / Esc
  [["overlay", closeItem], ["budgetOverlay", closeBudget], ["calcOverlay", closeCalc], ["checkoutOverlay", closeCheckout], ["histOverlay", closeHist], ["voiceOverlay", cancelVoice]].forEach(function (pair) {
    $(pair[0]).addEventListener("click", function (e) { if (e.target === this) pair[1](); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if ($("voiceOverlay").classList.contains("open")) cancelVoice();
      else if ($("calcOverlay").classList.contains("open")) closeCalc();
      else if ($("checkoutOverlay").classList.contains("open")) closeCheckout();
      else if ($("histOverlay").classList.contains("open")) closeHist();
      else if ($("budgetOverlay").classList.contains("open")) closeBudget();
      else closeItem();
    }
    calcKey(e);
  });

  buildCalc();
  initTheme();
  render();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () { }); });
  }
})();
