/*
 * Voice: ditado de itens em português.
 *  - Voice.parse("café vinte e sete e noventa") -> { name: "Café", price: 27.9 }
 *  - Voice.listen({ onPartial, onResult, onError, onEnd }) usa a Web Speech API do navegador.
 */
(function (global) {
  "use strict";

  /* ---------- números por extenso -> dígitos ---------- */
  var UNITS = {
    zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
    dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16,
    dezessete: 17, dezoito: 18, dezenove: 19
  };
  var TENS = { vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90 };
  var HUNDREDS = {
    cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400,
    quatrocentas: 400, quinhentos: 500, quinhentas: 500, seiscentos: 600, seiscentas: 600, setecentos: 700,
    setecentas: 700, oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900
  };

  function strip(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  function wordInfo(w) {
    var k = strip(w);
    if (k in HUNDREDS) return { v: HUNDREDS[k], place: 100 };
    if (k in TENS) return { v: TENS[k], place: 10 };
    if (k in UNITS) return { v: UNITS[k], place: UNITS[k] >= 10 ? 10 : 1 };
    if (k === "mil") return { v: 1000, place: 1000 };
    return null;
  }

  // junta "vinte e sete" -> "27", mas mantém "27 e 90" separados
  function wordsToDigits(text) {
    var toks = text.split(/\s+/), out = [], i = 0;
    while (i < toks.length) {
      var info = wordInfo(toks[i]);
      // "um"/"uma" sozinho antes de palavra comum é artigo, mas ainda vale 1 (ex.: "um pacote")
      if (!info) { out.push(toks[i]); i++; continue; }
      var total = 0, cur = info.v, lastPlace = info.place;
      if (info.place === 1000) { total = 1000; cur = 0; lastPlace = 1000; }
      i++;
      while (i < toks.length) {
        var conn = toks[i] === "e", j = conn ? i + 1 : i;
        var nx = j < toks.length ? wordInfo(toks[j]) : null;
        if (!nx) break;
        if (nx.place === 1000) { total += (cur || 1) * 1000; cur = 0; lastPlace = 1000; i = j + 1; continue; }
        // só compõe se a casa for menor (100 -> 10 -> 1)
        var smaller = nx.place < lastPlace || (lastPlace === 1000 && nx.place <= 100);
        if (!smaller || (lastPlace === 10 && cur % 10 !== 0) || (cur >= 10 && cur < 20 && lastPlace === 10)) break;
        cur += nx.v; lastPlace = nx.place; i = j + 1;
      }
      out.push(String(total + cur));
    }
    return out.join(" ");
  }

  /* ---------- parser: só nome + valor ---------- */
  // "arroz cinco quilos vinte e quatro e noventa" -> { name: "Arroz 5 quilos", price: 24.9 }
  // O valor é sempre a última coisa dita; todo o resto é o nome.
  var NUM = "(\\d+(?:,\\d{1,2})?)";
  function toNum(s) { return parseFloat(String(s).replace(",", ".")); }

  function parse(raw) {
    var t = String(raw || "").toLowerCase()
      .replace(/r\$\s*/g, " reais_pre ")
      .replace(/[!?;:]/g, " ")
      .replace(/(\d)\s*,\s*(\d)/g, "$1,$2")
      .replace(/(\d)\.(\d{2})(?!\d)/g, "$1,$2")
      .replace(/\s+/g, " ").trim();
    t = wordsToDigits(t).replace(/\s+/g, " ").trim();

    var price = 0, m;
    var patterns = [
      // R$ 24,90 / R$ 24 e 90
      [new RegExp("reais_pre " + NUM + "(?: e (\\d{1,2}))?(?: centavos?)?\\s*$"), function (m) { return toNum(m[1]) + (m[2] ? +m[2] / 100 : 0); }],
      // 24 reais e 90 (centavos)
      [new RegExp(NUM + " reais?(?: e (\\d{1,2})(?: centavos?)?)?\\s*$"), function (m) { return toNum(m[1]) + (m[2] ? +m[2] / 100 : 0); }],
      // 90 centavos
      [/(\d+) centavos?\s*$/, function (m) { return +m[1] / 100; }],
      // 24 e 90
      [/(\d+) e (\d{1,2})\s*$/, function (m) { return +m[1] + +m[2] / 100; }],
      // 24,90 ou 24
      [new RegExp("(?:^|\\s)" + NUM + "\\s*$"), function (m) { return toNum(m[1]); }]
    ];
    for (var i = 0; i < patterns.length; i++) {
      m = t.match(patterns[i][0]);
      if (m) { price = patterns[i][1](m); t = t.slice(0, m.index); break; }
    }

    var name = t.replace(/reais_pre/g, " ").replace(/\s+/g, " ").trim()
      .replace(/^((adiciona(r)?|adicione|coloca(r)?|coloque|bota(r)?|anota(r)?|mais|quero|o|a|um|uma)\s+)+/, "")
      .replace(/(\s+(de|do|da|a|e|por|custa|custando|pre[cç]o|valor|reais?|no valor de))+$/, "")
      .trim();
    if (name) name = name.charAt(0).toUpperCase() + name.slice(1);

    return { name: name, price: Math.round(price * 100) / 100 };
  }

  /* ---------- reconhecimento de voz ---------- */
  var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
  var active = null;

  function supported() { return !!SR; }

  function listen(cb) {
    if (!SR) { cb.onError && cb.onError("unsupported"); return null; }
    stop();
    var rec = new SR();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    var finalText = "", lastText = "";
    rec.onresult = function (e) {
      var interim = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      lastText = (finalText + " " + interim).trim();
      cb.onPartial && cb.onPartial(lastText);
    };
    rec.onerror = function (e) { cb.onError && cb.onError(e.error || "error"); };
    rec.onend = function () {
      active = null;
      var text = (finalText || lastText).trim();
      if (text) cb.onResult && cb.onResult(text);
      cb.onEnd && cb.onEnd(text);
    };
    try { rec.start(); } catch (err) { cb.onError && cb.onError("start"); return null; }
    active = rec;
    return rec;
  }

  function stop() { if (active) { try { active.stop(); } catch (e) { } } }

  global.Voice = { parse: parse, wordsToDigits: wordsToDigits, supported: supported, listen: listen, stop: stop };
})(typeof window !== "undefined" ? window : globalThis);
