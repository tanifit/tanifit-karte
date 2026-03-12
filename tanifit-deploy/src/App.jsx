import React, { useState, useRef, useEffect } from "react";


// ── Anthropic API helper ──────────────────────────────────────────
async function callGemini(apiKey, prompt, maxTokens) {
  var res = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens || 4000,
        messages: [{ role: "user", content: prompt }]
      })
    }
  );
  var data = await res.json();
  if (data.error) throw new Error(data.error.message || "Anthropic APIエラー");
  return ((data.content || [])[0] || {}).text || "";
}

// ── Firebase ──────────────────────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, onSnapshot } from "firebase/firestore";

var _db = null;
var _fbConfigStr = null;

// Firebase config（自動接続）
var DEFAULT_FB_CONFIG = {"apiKey":"AIzaSyDc8WJqN1Mb2OMpnKUv2YNj7gy7KCCVD4Y","authDomain":"tanifit-karte.firebaseapp.com","projectId":"tanifit-karte","storageBucket":"tanifit-karte.firebasestorage.app","messagingSenderId":"642322165188","appId":"1:642322165188:web:c787470966126d220fc891"};

function getDb() {
  return _db;
}
function initFirebase(cfgStr) {
  if (!cfgStr || cfgStr === _fbConfigStr) return;
  try {
    var cfg = typeof cfgStr === "string" ? JSON.parse(cfgStr) : cfgStr;
    var app = getApps().length ? getApps()[0] : initializeApp(cfg);
    _db = getFirestore(app);
    _fbConfigStr = typeof cfgStr === "string" ? cfgStr : JSON.stringify(cfgStr);
  } catch(e) { _db = null; }
}
// 起動時に自動初期化
(function(){ try { initFirebase(DEFAULT_FB_CONFIG); } catch(e){} })();

// localStorage fallback（Firebase未設定時）
const localStore = {
  get: async function(key) {
    try { var v = localStorage.getItem(key); return v ? { value: v } : null; } catch(e) { return null; }
  },
  set: async function(key, value) {
    try { localStorage.setItem(key, value); return { key, value }; } catch(e) { return null; }
  },
  delete: async function(key) {
    try { localStorage.removeItem(key); return { deleted: true }; } catch(e) { return null; }
  }
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --orange: #F07020;
    --orange-light: #FF8A3D;
    --orange-pale: #FFF0E6;
    --teal: #45BFBF;
    --teal-light: #6DD0D0;
    --teal-pale: #E8F8F8;
    --white: #FFFFFF;
    --bg: #F4F5F7;
    --surface: #FFFFFF;
    --surface2: #F9FAFB;
    --border: #E4E8EC;
    --border2: #D0D5DC;
    --text: #1A1E26;
    --text2: #5A6270;
    --text3: #9AA0AC;
    --text4: #C4C8D0;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Outfit', sans-serif; }

  .app {
    min-height: 100vh;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse at 0% 0%, rgba(69,191,191,0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 100%, rgba(240,112,32,0.06) 0%, transparent 50%);
  }

  /* ── Header ── */
  .header {
    padding: 14px 28px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 14px;
    background: var(--white);
    box-shadow: 0 1px 0 var(--border), 0 2px 8px rgba(0,0,0,0.04);
  }
  .logo { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 5px; color: var(--orange); line-height: 1; }
  .logo-sub { font-size: 8px; letter-spacing: 4px; color: var(--text3); margin-top: 2px; text-transform: uppercase; }
  .divider-v { width: 1px; height: 32px; background: var(--border); margin: 0 6px; }
  .header-label { font-size: 11px; color: var(--text3); letter-spacing: 1px; flex: 1; font-weight: 500; }
  .header-right { display: flex; align-items: center; gap: 8px; }
  .badge { font-size: 10px; padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border); color: var(--text3); background: var(--bg); font-weight: 500; }
  .badge.ok { border-color: #B8E8D0; color: #2A8A5A; background: #F0FAF5; }
  .badge.err { border-color: #F8CCC8; color: #C04040; background: #FFF5F5; }

  /* ── Tabs ── */
  .tabs { display: flex; border-bottom: 2px solid var(--border); background: var(--white); padding: 0 20px; }
  .tab { padding: 13px 20px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; font-weight: 600; }
  .tab:hover { color: var(--text2); }
  .tab.active { color: var(--orange); border-bottom-color: var(--orange); }

  /* ── Layout ── */
  .container { max-width: 740px; margin: 0 auto; padding: 28px 20px 60px; }

  /* ── Panel ── */
  .panel {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 0 0 0 transparent;
    transition: box-shadow 0.2s;
  }
  .panel:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
  .panel-header {
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface2);
  }
  .panel-title { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--text3); font-weight: 600; }
  .panel-body { padding: 20px; }
  .label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); margin-bottom: 6px; font-weight: 600; }

  /* ── Inputs ── */
  input[type="text"], input[type="password"] {
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    padding: 9px 12px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  input[type="text"]:focus, input[type="password"]:focus {
    border-color: var(--teal);
    box-shadow: 0 0 0 3px rgba(69,191,191,0.12);
  }
  textarea {
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    line-height: 1.8;
    padding: 12px;
    outline: none;
    resize: vertical;
    width: 100%;
    min-height: 90px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  textarea:focus {
    border-color: var(--teal);
    box-shadow: 0 0 0 3px rgba(69,191,191,0.12);
  }

  /* ── Buttons ── */
  .btn {
    background: var(--orange);
    border: none; border-radius: 6px; color: #fff;
    cursor: pointer; font-family: 'Outfit', sans-serif;
    font-size: 12px; font-weight: 600;
    padding: 9px 16px; transition: all 0.15s; white-space: nowrap;
    letter-spacing: 0.3px;
  }
  .btn:hover { background: var(--orange-light); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(240,112,32,0.3); }
  .btn:disabled { background: var(--border); color: var(--text4); cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-sm { padding: 5px 12px; font-size: 11px; }
  .btn-primary { background: var(--orange); border: none; border-radius: 6px; color: #fff; cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; padding: 9px 16px; transition: all 0.15s; }
  .btn-primary:hover { background: var(--orange-light); }
  .btn-ghost {
    background: transparent;
    border: 1.5px solid var(--border2);
    border-radius: 6px; color: var(--text2);
    cursor: pointer; font-family: 'Outfit', sans-serif;
    font-size: 11px; padding: 7px 14px; transition: all 0.15s;
    text-decoration: none; display: inline-block; font-weight: 500;
  }
  .btn-ghost:hover { border-color: var(--teal); color: var(--teal); background: var(--teal-pale); }
  .hint { font-size: 11px; color: var(--text3); margin-top: 5px; line-height: 1.6; }

  /* ── Generate button ── */
  .generate-btn {
    width: 100%; padding: 16px;
    background: linear-gradient(135deg, var(--orange), #FF8A40);
    border: none; border-radius: 8px; color: #fff;
    cursor: pointer; font-family: 'Bebas Neue', sans-serif;
    font-size: 20px; letter-spacing: 5px;
    transition: all 0.2s; margin-top: 4px;
    box-shadow: 0 4px 16px rgba(240,112,32,0.25);
  }
  .generate-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(240,112,32,0.4);
  }
  .generate-btn:disabled {
    background: var(--border); color: var(--text4);
    cursor: not-allowed; transform: none; box-shadow: none;
  }

  /* ── Recording ── */
  .chrome-note {
    background: var(--teal-pale);
    border: 1px solid #B8E0E0;
    border-radius: 6px; padding: 10px 14px;
    font-size: 11px; color: #2A8A8A;
    margin-bottom: 16px; line-height: 1.6;
  }
  .record-center { text-align: center; padding: 8px 0 20px; }
  .record-btn {
    width: 100px; height: 100px; border-radius: 50%;
    border: 2px solid var(--border2);
    cursor: pointer; background: var(--white);
    display: inline-flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 5px;
    transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  .record-btn:hover { border-color: var(--orange); box-shadow: 0 4px 20px rgba(240,112,32,0.2); }
  .record-btn.recording {
    border-color: var(--orange);
    background: var(--orange-pale);
    animation: pulse 1.5s ease infinite;
  }
  @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(240,112,32,0.3)} 50%{box-shadow:0 0 0 14px rgba(240,112,32,0)} }
  .record-icon { font-size: 28px; line-height: 1; }
  .record-label { font-size: 10px; letter-spacing: 2px; color: var(--text3); font-weight: 600; }
  .record-btn.recording .record-label { color: var(--orange); }
  .rec-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--orange); margin-right:4px; animation: blink 1s ease infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  .timer { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:4px; color:var(--orange); margin: 6px 0 3px; }
  .status-line { font-size: 11px; color: var(--text3); min-height: 16px; margin-top: 5px; }
  .status-line.active { color: var(--orange); }
  .status-line.done { color: #2A8A5A; }
  .transcript-box {
    background: var(--bg); border: 1.5px solid var(--border); border-radius: 6px;
    padding: 12px; font-family: 'DM Mono', monospace; font-size: 12px;
    line-height: 1.8; color: var(--text2); min-height: 70px; max-height: 160px;
    overflow-y: auto; white-space: pre-wrap; word-break: break-all;
  }

  /* ── Loading ── */
  .loading-wrap { text-align: center; padding: 28px 20px; }
  .spinner {
    width: 30px; height: 30px;
    border: 3px solid var(--border);
    border-top-color: var(--orange);
    border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-size: 12px; color: var(--text3); }
  .progress-bar { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-top: 14px; }
  .progress-fill { height: 100%; background: linear-gradient(90deg,var(--orange),var(--teal)); animation: prog 2s ease-in-out infinite; }
  @keyframes prog { 0%{width:5%} 50%{width:75%} 100%{width:95%} }

  /* ── Alerts ── */
  .error-box { background: #FFF5F5; border: 1px solid #F8CCC8; border-radius: 6px; padding: 10px 14px; color: #C04040; font-size: 12px; margin-bottom: 10px; }
  .success-box { background: #F0FAF5; border: 1px solid #B8E8D0; border-radius: 6px; padding: 10px 14px; color: #2A8A5A; font-size: 12px; margin-bottom: 10px; }

  /* ── Karte cards ── */
  .karte-section-title { font-family:'Bebas Neue',sans-serif; font-size:16px; letter-spacing:4px; color:var(--text3); margin-bottom:12px; }
  .karte-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 10px; overflow: hidden; margin-bottom: 14px;
    animation: fadeUp 0.4s ease both;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .karte-card:nth-child(2){animation-delay:.1s} .karte-card:nth-child(3){animation-delay:.2s} .karte-card:nth-child(4){animation-delay:.3s}
  .karte-head {
    padding: 14px 18px;
    background: linear-gradient(135deg, var(--orange) 0%, #FF8A3D 100%);
    border-bottom: none;
    display: flex; align-items: center; justify-content: space-between;
  }
  .karte-name { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:3px; color:#fff; }
  .karte-id { font-family:'DM Mono',monospace; font-size:10px; color:rgba(255,255,255,0.7); margin-top:2px; }
  .karte-date-sm { font-family:'DM Mono',monospace; font-size:10px; color:rgba(255,255,255,0.6); }
  .exercise-list { padding: 8px 18px; }
  .exercise-item { border-bottom: 1px solid var(--border); padding: 9px 0; }
  .exercise-item:last-child { border-bottom: none; }
  .exercise-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 7px; display: flex; align-items: center; gap: 7px; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--orange); flex-shrink: 0; }
  .dot.amber { background: var(--teal); }
  .sets-table { width: 100%; border-collapse: collapse; }
  .sets-table th { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--text4); text-align: left; padding: 0 10px 4px 0; }
  .sets-table td { font-family: 'DM Mono', monospace; font-size: 11px; padding: 3px 10px 3px 0; color: var(--text2); }
  .td-set { color: var(--text4); font-size: 10px; }
  .td-weight { color: var(--orange); font-weight: 600; }
  .td-reps { color: var(--text); }
  .td-note { color: var(--text3); font-size: 10px; }
  .note-box { margin: 0 18px 12px; background: var(--teal-pale); border: 1px solid #B8E0E0; border-radius: 6px; padding: 9px 12px; }
  .note-label { font-size: 9px; letter-spacing: 2px; color: var(--teal); margin-bottom: 3px; font-weight: 600; text-transform: uppercase; }
  .note-text { font-size: 11px; color: #2A7A7A; line-height: 1.6; }
  .karte-foot { padding: 10px 18px; border-top: 1px solid var(--border); display: flex; gap: 8px; flex-wrap: wrap; background: var(--surface2); }

  /* ── Member list ── */
  .member-list {}
  .member-row { border-bottom: 1px solid var(--border); }
  .member-row:last-child { border-bottom: none; }
  .member-row-header { display: flex; align-items: center; padding: 12px 18px; cursor: pointer; transition: background 0.15s; gap: 12px; }
  .member-row-header:hover { background: var(--bg); }
  .member-id-badge {
    font-family:'DM Mono',monospace; font-size:10px; color:var(--orange);
    background:var(--orange-pale); border:1px solid #FFCCA0;
    border-radius:4px; padding:2px 7px; font-weight:600;
  }
  .member-name-big { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:2px; flex:1; color:var(--text); }
  .member-count { font-size:10px; color:var(--text3); font-weight:500; }
  .chevron { font-size:11px; color:var(--text4); transition: transform 0.2s; }
  .chevron.open { transform: rotate(90deg); }
  .history-list { padding: 0 18px 16px; }
  .history-item { border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px; overflow: hidden; }
  .history-item-header { padding: 9px 14px; background: var(--surface2); display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .history-item-header:hover { background: var(--bg); }
  .history-date { font-family:'DM Mono',monospace; font-size:11px; color:var(--text2); font-weight:500; }
  .history-ex-count { font-size:10px; color:var(--text3); flex:1; }
  .history-detail { padding: 12px 14px; background: var(--white); }
  .empty-state { text-align:center; padding:40px 20px; color:var(--text4); font-size:13px; }
  .member-tags { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px; }
  .member-tag { background:var(--bg); border:1px solid var(--border); border-radius:4px; padding:5px 10px; font-size:12px; color:var(--text2); font-weight:500; }

  /* ── Suggest ── */
  .suggest-badge { font-size:10px; letter-spacing:1px; color:var(--teal); border:1px solid #A8D8D8; background:var(--teal-pale); border-radius:4px; padding:2px 8px; font-weight:600; }
  .img-popup-wrap { position:relative; display:inline-flex; align-items:center; flex:1; min-width:120px; }
  .img-popup { position:absolute; bottom:calc(100% + 8px); left:0; z-index:999; background:var(--white); border:1px solid var(--border); border-radius:8px; padding:4px; box-shadow:0 8px 32px rgba(0,0,0,0.15); pointer-events:none; }
  .img-popup img { display:block; width:220px; height:148px; object-fit:cover; border-radius:6px; }
  .img-popup-label { font-size:9px; color:var(--text3); text-align:center; margin-top:3px; letter-spacing:1px; }

  /* ── Edit mode ── */
  .edit-input {
    background: var(--bg); border: 1.5px solid var(--border); border-radius: 4px;
    color: var(--text); font-family: 'DM Mono', monospace; font-size: 11px;
    padding: 3px 7px; outline: none; width: 100%;
  }
  .edit-input:focus { border-color: var(--teal); }
  .edit-input.ex-name { font-size:13px; font-weight:600; font-family:'Outfit',sans-serif; color:var(--text); }
  .edit-input.weight { width:70px; color:var(--orange); }
  .edit-input.reps { width:90px; }
  .edit-input.note { width:100%; }
  .edit-btn { background:transparent; border:1px solid var(--border2); border-radius:4px; color:var(--text3); cursor:pointer; font-size:10px; padding:2px 8px; transition:all 0.15s; font-weight:500; }
  .edit-btn:hover { border-color:var(--orange); color:var(--orange); }
  .edit-btn.del { color:#C8A0A0; border-color:var(--border); }
  .edit-btn.del:hover { border-color:#E05050; color:#E05050; }
  .edit-btn.add { color:#A0C8A0; border-color:var(--border); }
  .edit-btn.add:hover { border-color:#3A9A5A; color:#3A9A5A; }
  .edit-mode-banner { background:var(--orange-pale); border-bottom:1px solid #FFCCA0; padding:6px 18px; font-size:10px; color:var(--orange); letter-spacing:1px; display:flex; align-items:center; justify-content:space-between; font-weight:600; }
`;

// ── Helpers ──────────────────────────────────────────────────
function buildMailtoHref(email, karte, date) {
  const lines = ["【カルテ】" + karte.name + " " + date, ""];
  (karte.exercises || []).forEach(function(ex) {
    lines.push("▶ " + ex.name);
    (ex.sets || []).forEach(function(s, i) {
      var w = s.weight != null ? s.weight + "kg" : "—";
      var r = s.reps != null ? (typeof s.reps === "string" && /[^0-9]/.test(String(s.reps)) ? String(s.reps) : s.reps + "回") : "—";
      var n = s.note ? " (" + s.note + ")" : "";
      lines.push("  Set" + (i + 1) + ": " + w + " × " + r + n);
    });
    lines.push("");
  });
  if (karte.notes) lines.push("📝 " + karte.notes);
  lines.push("", "TANIFITトレーナーより");
  var subject = encodeURIComponent("【TANIFIT】" + date + " トレーニングカルテ");
  var body = encodeURIComponent(lines.join("\n"));
  return "mailto:" + email + "?subject=" + subject + "&body=" + body;
}

function karteToText(karte, dateTime) {
  var lines = ["【カルテ】" + karte.name + (karte.member_id ? " #" + karte.member_id : "") + " " + dateTime];
  (karte.exercises || []).forEach(function(ex) {
    lines.push("▶ " + ex.name);
    (ex.sets || []).forEach(function(s, i) {
      var w = s.weight != null ? s.weight + "kg" : "—";
      var r = s.reps != null ? (typeof s.reps === "string" && /[^0-9]/.test(String(s.reps)) ? String(s.reps) : s.reps + "回") : "—";
      var r2 = s.reps != null ? (typeof s.reps === "string" ? s.reps : s.reps + "回") : "—"; lines.push("  Set" + (i + 1) + ": " + w + " × " + r2 + (s.note ? " (" + s.note + ")" : ""));
    });
  });
  if (karte.notes) lines.push("📝 " + karte.notes);
  return lines.join("\n");
}

// ── Sub components ────────────────────────────────────────────
function SetsTable({ sets, headers }) {
  return (
    <table className="sets-table">
      <thead><tr>{(headers || ["SET","重量","回数","メモ"]).map(function(h,i){ return <th key={i}>{h}</th>; })}</tr></thead>
      <tbody>
        {(sets || []).map(function(s, i) {
          return (
            <tr key={i}>
              <td className="td-set">{i + 1}</td>
              <td className="td-weight">{s.weight != null ? s.weight + "kg" : "—"}</td>
              <td className="td-reps">{s.reps != null ? (typeof s.reps === "string" && /[^0-9]/.test(String(s.reps)) ? String(s.reps) : s.reps + "回") : "—"}</td>
              <td className="td-note">{s.note || ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ExerciseList({ exercises, dotClass }) {
  return (
    <div className="exercise-list">
      {(exercises || []).map(function(ex, i) {
        return (
          <div className="exercise-item" key={i}>
            <div className="exercise-name">
              <span className={"dot" + (dotClass ? " " + dotClass : "")} />
              {ex.name}
            </div>
            <SetsTable sets={ex.sets} />
          </div>
        );
      })}
    </div>
  );
}

function KarteCard({ karte, date, onSave, saved, email, onUpdate }) {
  var [editing, setEditing] = React.useState(false);
  var [draft, setDraft] = React.useState(null);

  function startEdit() {
    setDraft(JSON.parse(JSON.stringify(karte)));
    setEditing(true);
  }
  function cancelEdit() { setEditing(false); setDraft(null); }
  function saveEdit() {
    if (onUpdate) onUpdate(draft);
    setEditing(false); setDraft(null);
  }

  function setEx(ei, field, val) {
    var d = JSON.parse(JSON.stringify(draft));
    d.exercises[ei][field] = val;
    setDraft(d);
  }
  function setSet(ei, si, field, val) {
    var d = JSON.parse(JSON.stringify(draft));
    if (field === "weight") d.exercises[ei].sets[si].weight = val === "" ? null : isNaN(Number(val)) ? val : Number(val);
    else d.exercises[ei].sets[si][field] = val;
    setDraft(d);
  }
  function addSet(ei) {
    var d = JSON.parse(JSON.stringify(draft));
    var prev = d.exercises[ei].sets.slice(-1)[0] || {};
    d.exercises[ei].sets.push({ weight: prev.weight || null, reps: prev.reps || null, note: "" });
    setDraft(d);
  }
  function delSet(ei, si) {
    var d = JSON.parse(JSON.stringify(draft));
    d.exercises[ei].sets.splice(si, 1);
    setDraft(d);
  }
  function addExercise() {
    var d = JSON.parse(JSON.stringify(draft));
    d.exercises.push({ name: "", sets: [{ weight: null, reps: null, note: "" }] });
    setDraft(d);
  }
  function delExercise(ei) {
    var d = JSON.parse(JSON.stringify(draft));
    d.exercises.splice(ei, 1);
    setDraft(d);
  }

  var cur = editing ? draft : karte;
  return (
    <div className="karte-card">
      {editing && <div className="edit-mode-banner"><span>✏️ 編集中</span><div style={{display:"flex",gap:6}}><button className="edit-btn add" onClick={saveEdit}>✓ 保存</button><button className="edit-btn del" onClick={cancelEdit}>✕ キャンセル</button></div></div>}
      <div className="karte-head">
        <div>
          <div className="karte-name">{cur.name}</div>
          {cur.member_id && <div className="karte-id">会員番号 #{cur.member_id}</div>}
        </div>
        <div className="karte-date-sm">{date}</div>
      </div>

      {editing ? (
        <div className="exercise-list">
          {(draft.exercises || []).map(function(ex, ei) {
            return (
              <div className="exercise-item" key={ei} style={{paddingBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <span className="dot"/>
                  <input className="edit-input ex-name" value={ex.name} onChange={function(e){ setEx(ei,"name",e.target.value); }} placeholder="種目名"/>
                  <button className="edit-btn del" onClick={function(){ delExercise(ei); }}>✕</button>
                </div>
                <table className="sets-table">
                  <thead><tr><th>SET</th><th>重量(kg)</th><th>回数</th><th>メモ</th><th></th></tr></thead>
                  <tbody>
                    {(ex.sets || []).map(function(s, si) {
                      return (
                        <tr key={si}>
                          <td className="td-set">{si+1}</td>
                          <td><input className="edit-input weight" value={s.weight != null ? s.weight : ""} onChange={function(e){ setSet(ei,si,"weight",e.target.value); }} placeholder="—"/></td>
                          <td><input className="edit-input reps" value={s.reps != null ? s.reps : ""} onChange={function(e){ setSet(ei,si,"reps",e.target.value); }} placeholder="—"/></td>
                          <td><input className="edit-input note" value={s.note || ""} onChange={function(e){ setSet(ei,si,"note",e.target.value); }} placeholder="メモ"/></td>
                          <td><button className="edit-btn del" onClick={function(){ delSet(ei,si); }}>✕</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button className="edit-btn add" style={{marginTop:5,fontSize:10}} onClick={function(){ addSet(ei); }}>＋ セット追加</button>
              </div>
            );
          })}
          <button className="edit-btn add" style={{width:"100%",padding:"7px",marginTop:4,fontSize:11}} onClick={addExercise}>＋ 種目追加</button>
          <div style={{marginTop:12}}>
            <div className="label" style={{marginBottom:4}}>トレーナーメモ</div>
            <textarea style={{minHeight:60}} value={draft.notes || ""} onChange={function(e){ var d=JSON.parse(JSON.stringify(draft)); d.notes=e.target.value; setDraft(d); }} placeholder="コーチングメモ..."/>
          </div>
        </div>
      ) : (
        <>
          <ExerciseList exercises={karte.exercises} />
          {karte.notes && (
            <div className="note-box">
              <div className="note-label">トレーナーメモ</div>
              <div className="note-text">{karte.notes}</div>
            </div>
          )}
        </>
      )}

      <div className="karte-foot">
        <button className="btn btn-sm" onClick={onSave} disabled={saved}>{saved ? "✓ 保存済み" : "💾 履歴に保存"}</button>
        {!editing && <button className="btn-ghost btn-sm" onClick={startEdit}>✏️ 編集</button>}
        <button className="btn-ghost btn-sm" onClick={function() { navigator.clipboard.writeText(karteToText(karte, date)); }}>📋 コピー</button>
        {email && <a className="btn-ghost btn-sm" href={buildMailtoHref(email, karte, date)}>✉️ メール送信</a>}
      </div>
    </div>
  );
}

function ExNameWithImage({ ex }) {
  var [show, setShow] = React.useState(false);
  var timerRef = React.useRef(null);

  function handleTouchStart() {
    timerRef.current = setTimeout(function(){ setShow(true); }, 180);
  }
  function handleTouchEnd() {
    clearTimeout(timerRef.current);
    setTimeout(function(){ setShow(false); }, 1200);
  }

  if (!ex.image_url && !ex.video_url) {
    return <span style={{fontSize:13,fontWeight:600,color:"#ddd",flex:1,minWidth:120}}>{ex.name}</span>;
  }
  return (
    <div className="img-popup-wrap"
      onMouseEnter={function(){ if(ex.image_url) setShow(true); }}
      onMouseLeave={function(){ setShow(false); }}
      onTouchStart={ex.image_url ? handleTouchStart : undefined}
      onTouchEnd={ex.image_url ? handleTouchEnd : undefined}>
      {show && ex.image_url && (
        <div className="img-popup">
          <img src={ex.image_url} alt={ex.name} onError={function(e){ e.target.parentNode.innerHTML = '<div style="width:220px;padding:8px;font-size:9px;color:#cc5555;word-break:break-all;background:#1a0808;border-radius:4px">⚠️ 画像読込失敗<br/>' + (ex.image_url||"URL無し") + '</div>'; }}/>
          <div className="img-popup-label">📷 {ex.name}</div>
        </div>
      )}
      {ex.video_url ? (
        <span
          onClick={function(){ window.open(ex.video_url, "_blank"); }}
          style={{fontSize:13,fontWeight:600,color:"#F07020",textDecoration:"none",borderBottom:"1px dashed #ff550044",cursor:"pointer",flex:1}}>
          {ex.name}{ex.image_url && <span style={{fontSize:9,color:"#45BFBF",marginLeft:4}}>📷</span>} <span style={{fontSize:10,color:"#F07020",opacity:0.7}}>▶</span>
        </span>
      ) : (
        <span style={{fontSize:13,fontWeight:600,color:"#ddd",flex:1,cursor:ex.image_url?"default":"default"}}>
          {ex.name}{ex.image_url && <span style={{fontSize:9,color:"#45BFBF",marginLeft:4}}>📷</span>}
        </span>
      )}
    </div>
  );
}

function SuggestCard({ s, history }) {
  var [showHist, setShowHist] = React.useState(false);
  var memberHistory = history && s.member_id ? (history[s.member_id] || {}).sessions || [] : [];
  return (
    <div className="karte-card">
      <div className="karte-head">
        <div>
          <div className="karte-name" onClick={memberHistory.length > 0 ? function(){ setShowHist(function(v){ return !v; }); } : undefined}
            style={{cursor: memberHistory.length > 0 ? "pointer" : "default", display:"flex", alignItems:"center", gap:8}}>
            {s.name}
            {memberHistory.length > 0 && (
              <span style={{fontSize:10,color:"rgba(255,255,255,0.7)",fontFamily:"'DM Mono',monospace",border:"1px solid rgba(255,255,255,0.3)",borderRadius:3,padding:"1px 6px"}}>
                {showHist ? "▲" : "履歴 " + memberHistory.length + "回 ▼"}
              </span>
            )}
          </div>
          {s.member_id && <div className="karte-id">会員番号 #{s.member_id}</div>}
        </div>
        <div style={{textAlign:"right"}}>
          {s.target_parts && <div style={{fontSize:10,color:"rgba(255,255,255,0.8)",marginBottom:3}}>{s.target_parts}</div>}
          <span className="suggest-badge">SUGGEST</span>
        </div>
      </div>

      {showHist && memberHistory.length > 0 && (
        <div style={{margin:"0 18px 12px",padding:"10px 12px",background:"#F9FAFB",border:"1px solid #E4E8EC",borderRadius:6}}>
          {memberHistory.slice(0, 3).map(function(sess, si) {
            return (
              <div key={si} style={{marginBottom: si < memberHistory.length - 1 ? 10 : 0}}>
                <div style={{fontSize:10,color:"#F07020",fontFamily:"'DM Mono',monospace",marginBottom:4}}>{sess.date}</div>
                {(sess.karte.exercises || []).map(function(ex, ei) {
                  var setStr = (ex.sets || []).map(function(st, k){ return (st.weight != null ? st.weight + "kg" : "—") + "×" + (st.reps != null ? st.reps + "回" : "—"); }).join("  ");
                  return (
                    <div key={ei} style={{fontSize:11,color:"#9AA0AC",fontWeight:500,padding:"2px 0", display:"flex", gap:10}}>
                      <span style={{color:"#888",minWidth:140}}>{ex.name}</span>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10}}>{setStr}</span>
                    </div>
                  );
                })}
                {sess.karte.notes && <div style={{fontSize:10,color:"#4a7a4a",marginTop:4}}>📝 {sess.karte.notes}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div style={{padding:"6px 18px"}}>
        {(function(){
          var lastCat = null;
          var CAT_COLORS = { "静的ストレッチ": "#5A9AB0", "モビリティ": "#45BFBF", "スタビリティ": "#5AB08A", "ウエイト": "#F07020" };
          var CAT_LABELS = { "静的ストレッチ": "🧘 静的ストレッチ", "モビリティ": "🔄 モビリティ", "スタビリティ": "⚡ スタビリティ", "ウエイト": "🏋️ ウエイト" };
          return (s.exercises || []).map(function(ex, j) {
            var note = (ex.sets && ex.sets[0] && ex.sets[0].note) ? ex.sets[0].note : "";
            var weight = ex.sets && ex.sets[0] && ex.sets[0].weight != null && ex.sets[0].weight !== ""
              ? (typeof ex.sets[0].weight === "string" ? ex.sets[0].weight : ex.sets[0].weight + "kg") : null;
            var reps = ex.sets && ex.sets[0] && ex.sets[0].reps != null ? ex.sets[0].reps + "回" : null;
            var numSets = ex.sets ? ex.sets.length : 0;
            var cat = ex.category || "";
            var catColor = CAT_COLORS[cat] || "#555";
            var showCatHeader = cat && cat !== lastCat;
            lastCat = cat;
            return (
              <React.Fragment key={j}>
                {showCatHeader && (
                  <div style={{display:"flex",alignItems:"center",gap:8,margin:"10px 0 4px",paddingTop: j > 0 ? 6 : 0}}>
                    <div style={{flex:1,height:1,background:"#E4E8EC"}}/>
                    <span style={{fontSize:9,letterSpacing:2,color:catColor,textTransform:"uppercase",whiteSpace:"nowrap"}}>{CAT_LABELS[cat]||cat}</span>
                    <div style={{flex:1,height:1,background:"#E4E8EC"}}/>
                  </div>
                )}
                <div style={{borderBottom:"1px solid #E4E8EC",padding:"9px 0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span className="dot amber" style={{flexShrink:0, background: catColor}}/>
                    <ExNameWithImage ex={ex} />
                    {weight && <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#E06010",fontWeight:700}}>{weight}</span>}
                    {reps && <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#1A1E26",fontWeight:600}}>× {reps}</span>}
                    {numSets > 0 && <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#5A6270",fontWeight:500}}>× {numSets}set</span>}
                    {ex.interval && <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#2A8A6A",background:"#EBF7F2",border:"1px solid #B8E0D0",borderRadius:4,padding:"1px 7px",fontWeight:500}}>⏱ {ex.interval}</span>}
                    {ex.elapsed && <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#9AA0AC",fontWeight:500}}>計{ex.elapsed}</span>}
                  </div>
                  {note && <div style={{fontSize:11,color:"#D07010",marginTop:4,paddingLeft:13,fontWeight:500}}>{note}</div>}
                </div>
              </React.Fragment>
            );
          });
        })()}
      </div>
      {s.coach_note && (
        <div className="note-box">
          <div className="note-label">コーチングポイント</div>
          <div className="note-text">{s.coach_note}</div>
        </div>
      )}
    </div>
  );
}

function HistoryDetail({ karte, onUpdate, onDelete }) {
  var [editing, setEditing] = React.useState(false);
  var [draft, setDraft] = React.useState(null);
  var [confirmDelete, setConfirmDelete] = React.useState(false);

  function startEdit() { setDraft(JSON.parse(JSON.stringify(karte))); setEditing(true); }
  function cancelEdit() { setEditing(false); setDraft(null); }
  function saveEdit() { if (onUpdate) onUpdate(draft); setEditing(false); setDraft(null); }

  function setSet(ei, si, field, val) {
    var d = JSON.parse(JSON.stringify(draft));
    if (field === "weight") d.exercises[ei].sets[si].weight = val === "" ? null : isNaN(Number(val)) ? val : Number(val);
    else d.exercises[ei].sets[si][field] = val;
    setDraft(d);
  }
  function addSet(ei) {
    var d = JSON.parse(JSON.stringify(draft));
    var prev = d.exercises[ei].sets.slice(-1)[0] || {};
    d.exercises[ei].sets.push({ weight: prev.weight || null, reps: prev.reps || null, note: "" });
    setDraft(d);
  }
  function delSet(ei, si) { var d = JSON.parse(JSON.stringify(draft)); d.exercises[ei].sets.splice(si,1); setDraft(d); }
  function setExName(ei, val) { var d = JSON.parse(JSON.stringify(draft)); d.exercises[ei].name = val; setDraft(d); }
  function delEx(ei) { var d = JSON.parse(JSON.stringify(draft)); d.exercises.splice(ei,1); setDraft(d); }
  function addEx() { var d = JSON.parse(JSON.stringify(draft)); d.exercises.push({name:"",sets:[{weight:null,reps:null,note:""}]}); setDraft(d); }

  var cur = editing ? draft : karte;
  return (
    <div className="history-detail">
      {editing ? (
        <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,paddingBottom:8,borderBottom:"1px solid #E4E8EC"}}>
            <span style={{fontSize:10,color:"#D07010",letterSpacing:1,fontWeight:600}}>✏️ 編集中</span>
            <div style={{display:"flex",gap:6}}>
              <button className="edit-btn add" onClick={saveEdit}>✓ 保存</button>
              <button className="edit-btn del" onClick={cancelEdit}>✕ キャンセル</button>
            </div>
          </div>
          {(draft.exercises || []).map(function(ex, ei) {
            return (
              <div key={ei} style={{marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <input className="edit-input ex-name" style={{fontSize:11}} value={ex.name} onChange={function(e){setExName(ei,e.target.value);}} placeholder="種目名"/>
                  <button className="edit-btn del" onClick={function(){delEx(ei);}}>✕</button>
                </div>
                <table className="sets-table">
                  <thead><tr><th>SET</th><th>重量(kg)</th><th>回数</th><th>メモ</th><th></th></tr></thead>
                  <tbody>
                    {(ex.sets||[]).map(function(s,si){
                      return (
                        <tr key={si}>
                          <td className="td-set">{si+1}</td>
                          <td><input className="edit-input weight" value={s.weight!=null?s.weight:""} onChange={function(e){setSet(ei,si,"weight",e.target.value);}} placeholder="—"/></td>
                          <td><input className="edit-input reps" value={s.reps!=null?s.reps:""} onChange={function(e){setSet(ei,si,"reps",e.target.value);}} placeholder="—"/></td>
                          <td><input className="edit-input note" value={s.note||""} onChange={function(e){setSet(ei,si,"note",e.target.value);}} placeholder="メモ"/></td>
                          <td><button className="edit-btn del" onClick={function(){delSet(ei,si);}}>✕</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button className="edit-btn add" style={{marginTop:3,fontSize:10}} onClick={function(){addSet(ei);}}>＋ セット</button>
              </div>
            );
          })}
          <button className="edit-btn add" style={{width:"100%",padding:"6px",fontSize:11,marginBottom:10}} onClick={addEx}>＋ 種目追加</button>
          <div>
            <div className="label" style={{marginBottom:3}}>トレーナーメモ</div>
            <textarea style={{minHeight:50,fontSize:11}} value={draft.notes||""} onChange={function(e){var d=JSON.parse(JSON.stringify(draft));d.notes=e.target.value;setDraft(d);}} placeholder="メモ..."/>
          </div>
        </>
      ) : (
        <>
          {(karte.exercises || []).map(function(ex, i) {
            return (
              <div key={i} style={{marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:600,color:"#1A1E26",marginBottom:4}}>{ex.name}</div>
                <SetsTable sets={ex.sets} />
              </div>
            );
          })}
          {karte.notes && (
            <div style={{fontSize:11,color:"#2A8A5A",marginTop:6,background:"#F0FAF5",padding:"7px 10px",borderRadius:4,border:"1px solid #B8E8D0"}}>
              📝 {karte.notes}
            </div>
          )}
          <div style={{display:"flex",gap:6,marginTop:10,paddingTop:8,borderTop:"1px solid #E4E8EC"}}>
            <button className="edit-btn" onClick={startEdit}>✏️ 編集</button>
            {onDelete && (
              confirmDelete ? (
                <span style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:10,color:"#cc5555"}}>本当に削除しますか？</span>
                  <button className="edit-btn del" onClick={onDelete} style={{background:"#FFF0F0",borderColor:"#E05050",color:"#C03030"}}>✓ 削除</button>
                  <button className="edit-btn" onClick={function(){ setConfirmDelete(false); }}>キャンセル</button>
                </span>
              ) : (
                <button className="edit-btn del" onClick={function(){ setConfirmDelete(true); }}>🗑 削除</button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  var [tab, setTab] = useState("session");

  // Members
  var [members, setMembers] = useState([]);

  // Exercise list
  var [exerciseList, setExerciseList] = useState([]);
  var [exInput, setExInput] = useState("");
  var [exImportMsg, setExImportMsg] = useState("");
  var [exImportOk, setExImportOk] = useState(false);
  var [csvInput, setCsvInput] = useState("");
  var [importMsg, setImportMsg] = useState("");
  var [importOk, setImportOk] = useState(false);

  // Import exercise list (duplicate removed — see importExercises above)
  function importExercisesDupe() {}

  // Session datetime (manually entered by trainer)
  var _now2 = new Date();
  var _defaultDT = _now2.toLocaleDateString("ja-JP", { year:"numeric", month:"2-digit", day:"2-digit" })
    + " " + _now2.toLocaleTimeString("ja-JP", { hour:"2-digit", minute:"2-digit" });
  var [sessionDateTime, setSessionDateTime] = useState(_defaultDT);

  // Recording
  var [recording, setRecording] = useState(false);
  var [transcript, setTranscript] = useState("");
  var [manualText, setManualText] = useState("");
  var [timer, setTimer] = useState(0);
  var speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  var recRef = useRef(null);
  var timerRef = useRef(null);
  var accRef = useRef("");
  var stoppingRef = useRef(false);

  // Karte generation
  var [kartes, setKartes] = useState(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var [savedIds, setSavedIds] = useState({});
  var [apiKey, setApiKey] = useState(localStorage.getItem("tanifit:apikey") || "");
  var [fbConfig, setFbConfig] = useState(localStorage.getItem("tanifit:fbconfig") || "");
  var [isOwner, setIsOwner] = useState(false);
  var [ownerPinInput, setOwnerPinInput] = useState("");
  var [ownerPinError, setOwnerPinError] = useState("");
  var [fbStatus, setFbStatus] = useState("");

  // Prep — 4 slots, each has { id, parts[] }
  var PARTS = ["胸", "肩", "背中", "下半身", "腕", "腹筋"];

  var WARMUP_SEQUENCES = {
    "ベンチプレス": "静的ストレッチ：ドアフレームチェストストレッチ・胸椎伸展ストレッチ → モビリティ：オープンブック・四つん這い胸椎回旋・キャットカウ → スタビリティ：バンドプルアパート・ウォールスライド・テンポプッシュアップ（3-1-1） → ウエイト：ダンベルプレス（軽）→ ベンチプレス",
    "スミスマシンインクラインベンチプレス": "静的ストレッチ：ドアフレームチェストストレッチ・胸椎伸展ストレッチ → モビリティ：オープンブック・四つん這い胸椎回旋 → スタビリティ：バンドプルアパート・ウォールスライド → ウエイト：インクラインダンベルフライ（軽）→ スミスマシンインクラインベンチプレス",
    "スミスマシンスクワット": "静的ストレッチ：ヒップフレクサーストレッチ・ワイドスタンス内転筋ストレッチ・ハムストリングスストレッチ（仰向け） → モビリティ：ヒップサークル・90/90ヒップスイッチ・ワールドグレイテストストレッチ → スタビリティ：グルートブリッジ・クラムシェル・シングルレッグバランス → ウエイト：ゴブレットスクワット（軽）→ スミスマシンスクワット",
    "スミスマシンブルガリアンスクワット": "静的ストレッチ：ヒップフレクサーストレッチ・ピジョンポーズ（鳩のポーズ）・ハムストリングスストレッチ（仰向け） → モビリティ：90/90ヒップスイッチ・レッグスウィング（前後・左右）・ワールドグレイテストストレッチ → スタビリティ：シングルレッググルートブリッジ・クラムシェル → ウエイト：自重ブルガリアン → スミスマシンブルガリアンスクワット",
    "ダンベルブルガリアンスクワット": "静的ストレッチ：ヒップフレクサーストレッチ・ピジョンポーズ（鳩のポーズ） → モビリティ：90/90ヒップスイッチ・レッグスウィング（前後・左右） → スタビリティ：シングルレッググルートブリッジ・クラムシェル → ウエイト：自重ブルガリアン → ダンベルブルガリアンスクワット",
    "チンニング": "静的ストレッチ：広背筋ストレッチ（懸垂バー）・チャイルドポーズ → モビリティ：キャットカウ・オープンブック・フォームローラー胸椎モビリゼーション → スタビリティ：ライイングYTW・バンドプルアパート・デッドバグ → ウエイト：シーテッドローイング（軽）→ チンニング",
    "ラットプルダウン": "静的ストレッチ：広背筋ストレッチ（懸垂バー）・チャイルドポーズ → モビリティ：キャットカウ・オープンブック → スタビリティ：ライイングYTW・バンドプルアパート → ウエイト：シーテッドローイング（軽）→ ラットプルダウン",
    "ミリタリープレス": "静的ストレッチ：クロスボディアームストレッチ・スリーパーズストレッチ・背中での合掌（逆合掌） → モビリティ：ショルダーCARs・バンド肩外旋・ウォールスライド → スタビリティ：バンドエクスターナルローテーション・ダンベルWエクステンション（超軽重量） → ウエイト：サイドレイス（軽）→ ミリタリープレス",
    "スミスマシンショルダープレス": "静的ストレッチ：クロスボディアームストレッチ・スリーパーズストレッチ → モビリティ：ショルダーCARs・ウォールスライド → スタビリティ：バンドエクスターナルローテーション・ダンベルWエクステンション（超軽重量） → ウエイト：サイドレイス（軽）→ スミスマシンショルダープレス",
    "ダンベルショルダープレス": "静的ストレッチ：クロスボディアームストレッチ → モビリティ：ショルダーCARs・バンド肩外旋 → スタビリティ：バンドエクスターナルローテーション → ウエイト：サイドレイス（軽）→ ダンベルショルダープレス",
  };
  var LEVELS = ["初級", "中級", "上級"];
  var [prepSlots, setPrepSlots] = useState([
    { id: "", parts: [], level: "初級" },
    { id: "", parts: [], level: "初級" },
    { id: "", parts: [], level: "初級" },
    { id: "", parts: [], level: "初級" },
  ]);
  var [prepSearch, setPrepSearch] = useState("");
  var [prepResult, setPrepResult] = useState(null);
  var [prepLoading, setPrepLoading] = useState(false);
  var [prepError, setPrepError] = useState("");

  function updateSlotId(idx, val) {
    setPrepSlots(function(prev) {
      var next = prev.map(function(s){ return Object.assign({}, s); });
      next[idx].id = val;
      return next;
    });
  }

  function updateSlotLevel(idx, val) {
    setPrepSlots(function(prev) {
      var next = prev.map(function(s){ return Object.assign({}, s); });
      next[idx].level = val;
      return next;
    });
  }

  function toggleSlotPart(idx, part) {
    setPrepSlots(function(prev) {
      var next = prev.map(function(s){ return Object.assign({}, s, { parts: s.parts.slice() }); });
      var parts = next[idx].parts;
      var pi = parts.indexOf(part);
      if (pi >= 0) parts.splice(pi, 1);
      else parts.push(part);
      return next;
    });
  }

  // History
  var [history, setHistory] = useState({});
  var [openMember, setOpenMember] = useState(null);
  var [openSession, setOpenSession] = useState(null);

  // dateTime is now sessionDateTime (user-editable)

  // Firebase init on fbConfig change
  useEffect(function() {
    if (fbConfig) {
      try { initFirebase(fbConfig); setFbStatus(""); } catch(e) { setFbStatus("Firebaseエラー: " + e.message); }
    }
  }, [fbConfig]);

  // Load storage
  useEffect(function() {
    (async function() {
      var db = getDb();
      if (db) {
        // Firebase から読み込み
        try {
          var cfgSnap = await getDoc(doc(db, "tanifit", "config"));
          if (cfgSnap.exists()) {
            var c = cfgSnap.data();
            if (c.members) setMembers(c.members);
            if (c.exerciseList) setExerciseList(c.exerciseList);
            if (c.apiKey) { setApiKey(c.apiKey); localStorage.setItem("tanifit:apikey", c.apiKey); }
          }
        } catch(e) {}
        try {
          var histSnap = await getDocs(collection(db, "tanifit_history"));
          var h = {};
          histSnap.forEach(function(d){ h[d.id] = d.data(); });
          setHistory(h);
        } catch(e) {}
      } else {
        // localStorageフォールバック
        try {
          var cfg = await localStore.get("tanifit:config");
          if (cfg) { var c = JSON.parse(cfg.value); if (c.members) setMembers(c.members); if (c.exerciseList) setExerciseList(c.exerciseList); }
        } catch(e) {}
        try {
          var hist = await localStore.get("tanifit:history");
          if (hist) setHistory(JSON.parse(hist.value));
        } catch(e) {}
      }
    })();
  }, []);

  async function saveConfig(updates) {
    var merged = Object.assign({ members, exerciseList }, updates);
    if (apiKey) merged.apiKey = apiKey;
    var db = getDb();
    if (db) {
      try { await setDoc(doc(db, "tanifit", "config"), merged); } catch(e) {}
    } else {
      try { await localStore.set("tanifit:config", JSON.stringify(merged)); } catch(e) {}
    }
  }

  async function saveHistory(newHistory) {
    var db = getDb();
    if (db) {
      // 変更されたメンバーのみ保存
      for (var mid in newHistory) {
        try { await setDoc(doc(db, "tanifit_history", String(mid)), newHistory[mid]); } catch(e) {}
      }
    } else {
      await saveHistory(newHistory);
    }
  }

  // Import CSV
  async function importCsv() {
    var lines = csvInput.split("\n").map(function(l){ return l.trim(); }).filter(Boolean);
    var loaded = [];
    lines.forEach(function(line) {
      var parts = line.split(/[\t,]/).map(function(p){ return p.trim(); });
      if (parts.length >= 2 && parts[0] && parts[1]) {
        loaded.push({ id: parts[0], name: parts[1], email: parts[2] || "", furigana: parts[3] || "", gender: parts[4] || "" });
      }
    });
    if (loaded.length === 0) { setImportMsg("読み込める行がありませんでした"); setImportOk(false); return; }
    setMembers(loaded);
    await saveConfig({ members: loaded });
    setImportMsg("✓ " + loaded.length + "名を登録しました");
    setImportOk(true);
  }

  // Import exercise list — detects category headers like 〈胸：静的ストレッチ〉
  async function importExercises() {
    var lines = exInput.split("\n").map(function(l){ return l.trim(); }).filter(Boolean);
    var loaded = [];
    var currentCategory = "";
    lines.forEach(function(line) {
      if (/^[〈<（(]/.test(line) && (line.includes("ストレッチ") || line.includes("モビリティ") || line.includes("スタビリティ") || line.includes("ウエイト") || line.includes("サーキット"))) {
        if (line.includes("静的ストレッチ")) currentCategory = "静的ストレッチ";
        else if (line.includes("モビリティ")) currentCategory = "モビリティ";
        else if (line.includes("スタビリティ")) currentCategory = "スタビリティ";
        else if (line.includes("ウエイト")) currentCategory = "ウエイト";
        else if (line.includes("サーキット")) currentCategory = "サーキット";
        return;
      }
      var p = line.split(/\t/).map(function(x){ return x.trim(); });
      if (!p[0] || p[0].startsWith("種目名") || p[0].startsWith("〈")) return;
      var name = p[0];
      // Auto-detect new format (with タイプ・関連動作パターン columns) vs old format
      var TYPES = ["静的ストレッチ","モビリティ","スタビリティ","ウエイトトレーニング","サーキット"];
      var hasNewFormat = TYPES.indexOf(p[1]) !== -1;
      var offset = hasNewFormat ? 2 : 0; // new format: B=タイプ, C=パターン, D=部位...
      var movementPattern = hasNewFormat ? (p[2] || "") : "";
      var bodyPart = p[1 + offset] || "";
      var wBase = 2 + offset;
      var rawVideo = p[13 + offset] || "";
      var videoUrl = (rawVideo && rawVideo.startsWith("http")) ? rawVideo
        : ("https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " フォーム 解説"));
      var rawImage = p[14 + offset] || "";
      var imageUrl = "";
      if (rawImage.startsWith("http")) {
        var driveMatch = rawImage.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch) {
          imageUrl = "https://drive.google.com/uc?export=view&id=" + driveMatch[1];
        } else {
          imageUrl = rawImage;
        }
      }
      loaded.push({
        name: name,
        category: currentCategory,
        movement_patterns: movementPattern,
        body_part: bodyPart,
        weight: {
          "男初級": p[wBase] || "", "男中級": p[wBase+1] || "", "男上級": p[wBase+2] || "",
          "女初級": p[wBase+3] || "", "女中級": p[wBase+4] || "", "女上級": p[wBase+5] || ""
        },
        reps: p[8 + offset] || "",
        interval: p[9 + offset] || "",
        sets: p[10 + offset] || "3",
        duration: p[11 + offset] || "",
        coaching: p[12 + offset] || "",
        video_url: videoUrl,
        image_url: imageUrl
      });
    });
    if (loaded.length === 0) { setExImportMsg("読み込める行がありませんでした"); setExImportOk(false); return; }
    setExerciseList(loaded);
    await saveConfig({ exerciseList: loaded });
    var catCounts = {};
    loaded.forEach(function(e){ catCounts[e.category||"未分類"] = (catCounts[e.category||"未分類"]||0)+1; });
    var imgCount = loaded.filter(function(e){ return e.image_url; }).length;
    var firstImg = loaded.find(function(e){ return e.image_url; });
    setExImportMsg("✓ " + loaded.length + "種目を登録（" + Object.entries(catCounts).map(function(kv){ return kv[0]+":"+kv[1]; }).join(", ") + "）" + (imgCount > 0 ? " 📷" + imgCount + "件 例:" + (firstImg ? firstImg.image_url.slice(0,40) : "") : " ⚠️画像URL:0件"));
    setExImportOk(true);
  }

  // Recording
  function startRecording() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    accRef.current = ""; stoppingRef.current = false;
    setTranscript(""); setKartes(null); setError(""); setTimer(0); setSavedIds({});
    var r = new SR();
    r.lang = "ja-JP"; r.continuous = true; r.interimResults = true;
    r.onresult = function(e) {
      var interim = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) accRef.current += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(accRef.current + interim);
    };
    r.onend = function() {
      if (!stoppingRef.current) { try { r.start(); } catch(e) {} }
      else setTranscript(accRef.current);
    };
    r.onerror = function(e) {
      if (e.error === "aborted") return;
      if (e.error === "not-allowed") {
        setError("⚠️ マイクが使えません。ファイルをダウンロードしてブラウザで直接開いてください。\n→ または下の「手動入力」にテキストを貼り付けてください。");
      } else {
        setError("音声認識エラー: " + e.error);
      }
      setRecording(false);
      clearInterval(timerRef.current);
    };
    recRef.current = r; r.start();
    setRecording(true);
    timerRef.current = setInterval(function() { setTimer(function(t){ return t + 1; }); }, 1000);
  }

  function stopRecording() {
    stoppingRef.current = true;
    clearInterval(timerRef.current);
    if (recRef.current) recRef.current.stop();
    setRecording(false);
    setTimeout(function() { setTranscript(accRef.current); }, 400);
  }

  function fmtTime(s) {
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }

  // Karte generation
  async function generateKarte() {
    var text = (transcript || manualText).trim();
    if (!text) { setError("文字起こしテキストがありません"); return; }
    if (!apiKey) { setError("設定タブでGeminiのAPIキーを入力してください"); return; }
    setLoading(true); setError(""); setKartes(null); setSavedIds({});

    // Build context from filled slots
    var activeSlots = prepSlots.filter(function(s){ return s.id.trim(); });
    var memberHint = "";
    if (activeSlots.length > 0) {
      memberHint = "\n本日の参加者と担当部位:\n" + activeSlots.map(function(s){
        var m = members.find(function(m){ return m.id === s.id; });
        var name = m ? m.name : "会員#" + s.id;
        return s.id + " " + name + (s.parts.length > 0 ? "（" + s.parts.join("・") + "）" : "");
      }).join("\n");
    } else if (members.length > 0) {
      memberHint = "\n参加会員リスト（会員番号 氏名 ふりがな）:\n" + members.map(function(m){ return m.id + " " + m.name + (m.furigana ? "（" + m.furigana + "）" : ""); }).join("\n");
    }

    var jsonFmt = '{"session_datetime":"2026/03/10 09:00（音声に日時があれば抽出。なければnull）","kartes":[{"name":"名前","member_id":"","exercises":[{"name":"種目名","sets":[{"weight":60,"reps":"15（または立位15→座位15のような文字列も可）","note":""}]}],"notes":""}]}';
    var prompt = "あなたはジムのカルテ作成AIです。以下のトレーニングセッションの文字起こしから、会員ごとのトレーニング記録をJSONで抽出してください。" + memberHint + "\n\nルール:\n- 参加会員リストがある場合、名前・ふりがなの表記ゆれを正式名称に統一し会員番号も付与する。音声認識の誤変換（例：「たかき」→「高木」）にも対応し、ふりがなが近い会員と照合する\n- 【最重要】実施した種目はすべてexercisesに入れる。プランク・サイドプランク・マウンテンクライマー・体幹トレーニング・ストレッチ等も全て種目として記録する\n- notesには怪我・体調・フォーム指導・特記事項のみ記録する。種目をnotesに入れてはいけない\n- セット途中で重量・回数が変わったら各セットに反映する\n- 時間系種目（プランク等）はweightをnull、repsを「60秒」のような文字列で記録する\n- weightはkg数値（不明はnull）。ドロップセット・立位/座位の連続は reps を 立位15→座位15 のような文字列で表現し1セットとして記録する\n- 音声に日時・日付・時刻が含まれていれば session_datetime に 2026/03/10 09:00 形式で入れる。なければnull\n\n文字起こし:\n\"\"\"\n" + text + "\n\"\"\"\n\n以下のJSONのみ返してください:\n" + jsonFmt;

    try {
      var raw = await callGemini(apiKey, prompt, 4000);
      // Strip markdown code fences (Safari-safe string approach)
      while (raw.indexOf("```json") !== -1) raw = raw.split("```json").join("");
      while (raw.indexOf("```") !== -1) raw = raw.split("```").join("");
      raw = raw.trim();
      // Find outermost JSON object
      var start = raw.indexOf("{");
      var end = raw.lastIndexOf("}");
      if (start < 0 || end < 0) throw new Error("JSONが見つかりません: " + raw.slice(0,80));
      var jsonStr = raw.slice(start, end + 1);
      var parsed;
      try { parsed = JSON.parse(jsonStr); }
      catch(pe) {
        // Try to salvage: remove trailing commas
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");
        parsed = JSON.parse(jsonStr);
      }
      // member_idが一致する会員の正式名称で上書き
      var fixedKartes = (parsed.kartes || []).map(function(k) {
        if (k.member_id) {
          var m = members.find(function(m){ return m.id === String(k.member_id); });
          if (m) return Object.assign({}, k, { name: m.name });
        }
        return k;
      });
      setKartes(fixedKartes);
      if (parsed.session_datetime && typeof parsed.session_datetime === "string") {
        setSessionDateTime(parsed.session_datetime);
      }
    } catch(e) {
      setError("生成エラー: " + e.message);
    } finally { setLoading(false); }
  }

  // Prep generation
  async function generatePrep() {
    var activeSlots = prepSlots.filter(function(s){ return s.id.trim() !== ""; });
    if (activeSlots.length === 0) { setPrepError("会員番号を1つ以上入力してください"); return; }
    var noparts = activeSlots.filter(function(s){ return s.parts.length === 0; });
    if (noparts.length > 0) { setPrepError("部位が選択されていないスロットがあります"); return; }
    if (!apiKey) { setPrepError("設定タブでGeminiのAPIキーを入力してください"); return; }
    setPrepLoading(true); setPrepError(""); setPrepResult(null);

    var memberData = activeSlots.map(function(slot) {
      var id = slot.id.trim();
      var member = members.find(function(m){ return m.id === id; });
      var name = member ? member.name : ("会員#" + id);
      var sessions = ((history[id] || {}).sessions || []).slice(0, 3);
      var histText = sessions.length > 0
        ? sessions.map(function(s) {
            var exs = (s.karte.exercises || []).map(function(e) {
              var setStr = (e.sets || []).map(function(st, i) {
                return "Set" + (i + 1) + " " + (st.weight || "?") + "kg×" + (st.reps || "?") + "回";
              }).join(", ");
              return e.name + ": " + setStr;
            }).join(" / ");
            var noteStr = s.karte.notes ? " ／ トレーナーメモ:「" + s.karte.notes + "」" : "";
            return s.date + ": " + exs + noteStr;
          }).join("\n")
        : "履歴なし";
      var member2 = members.find(function(m){ return m.id === id; });
      var genderLabel = member2 && member2.gender ? member2.gender : "";
      var levelLabel = slot.level || "初級";
      var profileLabel = genderLabel && levelLabel ? "（" + genderLabel + "・" + levelLabel + "）" : levelLabel ? "（" + levelLabel + "）" : "";
      return "【" + name + "（#" + id + "）" + profileLabel + " 本日の部位: " + slot.parts.join("・") + "】\n" + histText;
    }).join("\n\n");

    var exListHint = exerciseList.length > 0
      ? "\n\n【使用可能な種目リスト】\n" +
        exerciseList.map(function(e){
          var w = e.weight || {};
          var wStr = ["男初級","男中級","男上級","女初級","女中級","女上級"].map(function(k){ return k+":"+(w[k]||"—"); }).join(", ");
          var patStr = e.movement_patterns ? " | 動作パターン:" + e.movement_patterns : "";
          return "[" + (e.category||"未分類") + "] " + e.name + " | 部位:" + (e.body_part||"?") + patStr + " | 所用時間:" + (e.duration||"?") + " | " + wStr + (e.coaching ? " | 指導:" + e.coaching : "");
        }).join("\n")
      : "";

    // Build warmup sequence hints for relevant goal exercises
    var warmupHint = "";
    var seqKeys = Object.keys(WARMUP_SEQUENCES);
    var relevantSeqs = seqKeys.filter(function(key){
      return activeSlots.some(function(s){ return s.parts.length > 0; });
    });
    if (relevantSeqs.length > 0) {
      warmupHint = "\n\n【ゴール種目別ウォームアップ流れ表】\n" +
        seqKeys.map(function(k){ return k + " → " + WARMUP_SEQUENCES[k]; }).join("\n");
    }

    // JSON format: AI only picks exercise names and coaching note. Everything else is overridden by code.
    var jsonFmt2 = '{"suggestions":[{"name":"会員名","member_id":"会員番号","target_parts":"胸・肩","main_exercises":["メインのウエイト種目名"],"movement_patterns_needed":["プッシュ","プランク"],"exercises":[{"name":"種目リストの種目名をそのままコピー","note":"重量の引き継ぎや痛みの注意点のみ"}],"coach_note":"全体アドバイス"}]}';
    var prompt2 = "あなたはプロのパーソナルトレーナーAIです。\n\n" + memberData + exListHint + "\n\n【メニュー設計の哲学】\n全てのウエイトトレーニングは7つの基礎動作（プランク・スクワット・ランジ・ヒンジ・ローテーション・プッシュ・プル）の組み合わせです。\nウォームアップはゴール（メインウエイト種目）の動作パターンを逆算して設計します。\n\n【設計手順】（必ずこの順序で考えること）\nSTEP1: 会員の部位から本日のメインウエイト種目を2種選ぶ（[ウエイトトレーニング]タグの種目から）\nSTEP2: その種目の「動作パターン」を確認する（例: ベンチプレス→プッシュ,プランク）\nSTEP3: 同じ動作パターンを持つウォームアップ種目を選ぶ（以下の構成で）：\n  ①静的ストレッチ（1〜2種）: 動作パターンが一致する[静的ストレッチ]から\n  ②モビリティ（2〜3種）: 動作パターンが一致する[モビリティ]から\n  ③スタビリティ（1〜2種）: 動作パターンが一致する[スタビリティ]から（プランクは汎用的なので優先）\n  ④ウエイトトレーニング（2種）: STEP1で選んだメイン種目\n\n【絶対ルール】\n- exercisesのnameは種目リストの種目名を一字一句そのままコピー。変更厳禁\n- 【30分制約】所用時間の合計を30分以内に収める。超えたら種目を削る\n- セット数・回数・インターバル・時間はJSONに含めない\n- noteには重量引き継ぎ（前回→今回）と⚠️痛み注意のみ\n- 重量引き継ぎ: 履歴に同じ種目があれば引き継ぐ。「次回○kg」メモがあれば優先\n- 痛み引き継ぎ: メモに痛み・違和感があればnoteに「⚠️ ○○に注意」\n\n以下のJSONのみ返してください:\n" + jsonFmt2;

    try {
      var raw2 = await callGemini(apiKey, prompt2, 6000);
      while (raw2.indexOf("```json") !== -1) raw2 = raw2.split("```json").join("");
      while (raw2.indexOf("```") !== -1) raw2 = raw2.split("```").join("");
      raw2 = raw2.trim();
      var start2 = raw2.indexOf("{");
      var end2 = raw2.lastIndexOf("}");
      if (start2 < 0 || end2 < 0) throw new Error("JSONが見つかりません");
      var jsonStr2 = raw2.slice(start2, end2 + 1);
      var parsed2;
      try { parsed2 = JSON.parse(jsonStr2); }
      catch(pe2) { jsonStr2 = jsonStr2.replace(/,\s*([}\]])/g, "$1"); parsed2 = JSON.parse(jsonStr2); }

      // Helper: parse duration string to seconds
      function parseDurSec(s) {
        s = (s || "").trim();
        if (!s) return 0;
        if (s.includes(":")) { var p = s.split(":"); return parseInt(p[0]||0)*60 + parseInt(p[1]||0); }
        return (parseFloat(s.replace(/[^0-9.]/g, "")) || 0) * 60;
      }

      // Post-process: ALL values come from exerciseList, not AI
      var suggestions = (parsed2.suggestions || []).map(function(sug) {
        var slot = activeSlots.find(function(s){ return s.id === sug.member_id; }) || {};
        var gender = (members.find(function(m){ return m.id === sug.member_id; }) || {}).gender || "";
        var level = slot.level || "初級";
        var key = gender + level;
        // If gender not registered, fall back to any available weight key for this level
        var fallbackKeys = [key, "男" + level, "女" + level];

        // Step1: resolve each AI exercise name → master record
        var resolved = (sug.exercises || []).map(function(ex) {
          var aiName = ex.name.replace(/[\s　]*[（(（][^）)）]*[）)）]/g, "").trim();
          var master = exerciseList.find(function(e){ return e.name === ex.name; })
            || exerciseList.find(function(e){ return e.name === aiName; })
            || exerciseList.find(function(e){ return aiName && (e.name.startsWith(aiName) || aiName.startsWith(e.name)); });
          if (!master) return null;
          return { master: master, note: ex.note || "" };
        }).filter(Boolean);

        // Step2: apply 30-min hard cap
        // ウエイトトレーニングを必ず含める：先にウエイトを確保してから残り時間でウォームアップを詰める
        var weightItems = resolved.filter(function(r){ return r.master.category === "ウエイトトレーニング"; });
        var warmupItems = resolved.filter(function(r){ return r.master.category !== "ウエイトトレーニング"; });
        
        // ウエイト最大2種目を確保
        var reservedWeight = weightItems.slice(0, 2);
        var reservedSec = reservedWeight.reduce(function(acc, r){ return acc + parseDurSec(r.master.duration); }, 0);
        var remainSec = Math.max(1800 - reservedSec, 0);
        
        // 残り時間でウォームアップを詰める
        var warmupCapped = [];
        var warmupSec = 0;
        for (var i = 0; i < warmupItems.length; i++) {
          var dur = parseDurSec(warmupItems[i].master.duration);
          if (warmupSec + dur <= remainSec) {
            warmupSec += dur;
            warmupCapped.push(warmupItems[i]);
          }
        }
        var capped = warmupCapped.concat(reservedWeight);
        var totalSec = warmupSec + reservedSec;

        // Step3: build final exercises with elapsed time
        var runSec = 0;
        var exercises = capped.map(function(r) {
          var master = r.master;
          var w = "";
          for (var fi = 0; fi < fallbackKeys.length; fi++) {
            w = (master.weight || {})[fallbackKeys[fi]] || "";
            if (w) break;
          }
          var numSets = parseInt(master.sets) || 3;
          var sets = [];
          for (var j = 0; j < numSets; j++) {
            sets.push({ weight: w || null, reps: master.reps || null, note: j === 0 ? r.note : "" });
          }
          runSec += parseDurSec(master.duration);
          var eMin = Math.floor(runSec / 60), eSec = Math.round(runSec % 60);
          var elapsed = eMin > 0 || eSec > 0 ? (eSec > 0 ? eMin + "分" + eSec + "秒" : eMin + "分") : "";
          return { name: master.name, category: master.category || "", video_url: master.video_url || "", sets: sets, interval: master.interval || "", elapsed: elapsed };
        });

        return Object.assign({}, sug, { exercises: exercises });
      });
      setPrepResult(suggestions);
    } catch(e) {
      setPrepError("生成エラー: " + e.message);
    } finally { setPrepLoading(false); }
  }

  // Save to history
  async function saveToHistory(karte, idx) {
    var key = karte.member_id || karte.name;
    var newHistory = Object.assign({}, history);
    if (!newHistory[key]) newHistory[key] = { name: karte.name, member_id: karte.member_id, sessions: [] };
    newHistory[key].sessions = [{ date: sessionDateTime, karte }].concat(newHistory[key].sessions || []);
    setHistory(newHistory);
    setSavedIds(function(prev){ return Object.assign({}, prev, { [idx]: true }); });
    await saveHistory(newHistory);
  }

  async function updateHistorySession(memberKey, si, updatedKarte) {
    var newHistory = JSON.parse(JSON.stringify(history));
    if (newHistory[memberKey] && newHistory[memberKey].sessions[si]) {
      newHistory[memberKey].sessions[si].karte = updatedKarte;
      setHistory(newHistory);
      await saveHistory(newHistory);
    }
  }

  async function deleteHistorySession(memberKey, si) {
    var newHistory = JSON.parse(JSON.stringify(history));
    if (newHistory[memberKey]) {
      newHistory[memberKey].sessions.splice(si, 1);
      setHistory(newHistory);
      await saveHistory(newHistory);
    }
  }

  function getMemberEmail(karte) {
    var m = members.find(function(m){ return m.id === karte.member_id || m.name === karte.name; });
    return m ? (m.email || "") : "";
  }

  var hasText = (transcript || manualText).trim().length > 0;
  var historyKeys = Object.keys(history);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <div>
            <div className="logo">TANIFIT</div>
            <div className="logo-sub">KARTE GENERATOR</div>
          </div>
          <div className="divider-v" />
          <div className="header-label">AIカルテ自動生成</div>
          <div className="header-right">
            {importMsg && <span className={"badge" + (importOk ? " ok" : " err")}>{importMsg}</span>}
            {members.length > 0 && <span className="badge ok">👥 {members.length}名</span>}
          </div>
        </div>

        <div className="tabs">
          <div className={"tab" + (tab === "session" ? " active" : "")} onClick={function(){ setTab("session"); }}>セッション</div>
          <div className={"tab" + (tab === "history" ? " active" : "")} onClick={function(){ setTab("history"); }}>会員履歴</div>
          <div className={"tab" + (tab === "settings" ? " active" : "")} onClick={function(){ setTab("settings"); }}>設定</div>
        </div>

        <div className="container">

          {/* ── GENERATE ── */}
          {tab === "session" && (
            <>
              {/* ── STEP 1: 参加者 ── */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">① 参加者と部位</div>
                </div>
                <div className="panel-body">
                  <div style={{marginBottom:16, position:"relative"}}>
                    <input type="text" value={prepSearch} onChange={function(e){ setPrepSearch(e.target.value); }}
                      placeholder="名前・ふりがなで検索して追加..." />
                    {prepSearch.trim() && (function(){
                      var q = prepSearch.trim();
                      var toHira = function(s){ return s.replace(/[\u30A1-\u30F6]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) - 0x60); }); };
                      var qH = toHira(q);
                      var results = members.filter(function(m){ return m.name.includes(q) || (m.furigana && (toHira(m.furigana).includes(qH))); });
                      if (results.length === 0) return <div style={{marginTop:4,fontSize:11,color:"#444"}}>該当なし</div>;
                      return (
                        <div style={{position:"absolute",zIndex:10,top:"100%",left:0,right:0,background:"#141414",border:"1px solid #2a2a2a",borderRadius:4,marginTop:2,overflow:"hidden"}}>
                          {results.map(function(m) {
                            var emptySlot = prepSlots.findIndex(function(s){ return s.id === ""; });
                            var alreadyIn = prepSlots.some(function(s){ return s.id === m.id; });
                            return (
                              <div key={m.id}
                                onClick={function(){
                                  if (alreadyIn || emptySlot < 0) return;
                                  updateSlotId(emptySlot, m.id);
                                  setPrepSearch("");
                                }}
                                style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10,cursor:(alreadyIn||emptySlot<0)?"default":"pointer",opacity:(alreadyIn||emptySlot<0)?0.4:1,borderBottom:"1px solid #1e1e1e"}}>
                                <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#F07020"}}>#{m.id}</span>
                                <span style={{fontSize:13}}>{m.name}</span>
                                {m.furigana && <span style={{fontSize:10,color:"#555"}}>{m.furigana}</span>}
                                {alreadyIn && <span style={{fontSize:10,color:"#555",marginLeft:"auto"}}>追加済み</span>}
                                {!alreadyIn && emptySlot < 0 && <span style={{fontSize:10,color:"#555",marginLeft:"auto"}}>満員</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  {prepSlots.map(function(slot, idx) {
                    var member = slot.id ? members.find(function(m){ return m.id === slot.id; }) : null;
                    return (
                      <div key={idx} style={{marginBottom:8,padding:10,background:slot.id?"#FFFFFF":"#F9FAFB",border:slot.id?"1px solid #E4E8EC":"1px dashed #D0D5DC",borderRadius:5,opacity:slot.id?1:0.45}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:slot.id?8:0}}>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:2,color:slot.id?"#F07020":"#C4C8D0",minWidth:18}}>{idx+1}</div>
                          {slot.id ? (
                            <>
                              <span style={{fontSize:13,color:"#1A1E26",fontWeight:600,flex:1}}>{member?member.name:"会員#"+slot.id}</span>
                              {member&&member.gender&&<span style={{fontSize:10,color:member.gender==="女"?"#e07090":"#5090cc",border:"1px solid",borderColor:member.gender==="女"?"#602040":"#203060",borderRadius:3,padding:"1px 5px"}}>{member.gender}</span>}
                              <div style={{display:"flex",gap:3}}>
                                {LEVELS.map(function(lv){ return (
                                  <button key={lv} onClick={function(){ updateSlotLevel(idx,lv); setPrepResult(null); }}
                                    style={{padding:"2px 7px",borderRadius:3,fontSize:10,cursor:"pointer",border:slot.level===lv?"1px solid #F07020":"1px solid #E4E8EC",background:slot.level===lv?"#FFF0E6":"transparent",color:slot.level===lv?"#F07020":"#9AA0AC",transition:"all 0.12s"}}>
                                    {lv}
                                  </button>
                                );})}
                              </div>
                              <button onClick={function(){ updateSlotId(idx,""); setPrepResult(null); }} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:13,lineHeight:1,padding:"2px 4px"}}>✕</button>
                            </>
                          ) : (
                            <span style={{fontSize:11,color:"#2a2a2a"}}>空き — 上で検索して追加</span>
                          )}
                        </div>
                        {slot.id && (
                          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                            {PARTS.map(function(part){
                              var selected = slot.parts.indexOf(part)>=0;
                              return (
                                <button key={part} onClick={function(){ toggleSlotPart(idx,part); setPrepResult(null); }}
                                  style={{padding:"4px 11px",borderRadius:3,fontSize:11,cursor:"pointer",border:selected?"1px solid #F07020":"1px solid #E4E8EC",background:selected?"#FFF0E6":"transparent",color:selected?"#F07020":"#9AA0AC",transition:"all 0.15s"}}>
                                  {part}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {prepError && <div className="error-box" style={{marginTop:8}}>⚠️ {prepError}</div>}
                  {prepSlots.some(function(s){ return s.id; }) && (
                    <button className="btn" style={{marginTop:12,width:"100%",padding:11}} onClick={generatePrep} disabled={prepLoading}>
                      {prepLoading ? "サジェスト生成中..." : "💡 セッション前メニューを提案"}
                    </button>
                  )}
                  {prepLoading && <div className="loading-wrap" style={{padding:"16px 0 0"}}><div className="spinner"/><div className="loading-text">直近履歴からメニューを考えています...</div><div className="progress-bar"><div className="progress-fill"/></div></div>}
                </div>
              </div>

              {prepResult && (
                <div style={{marginBottom:14}}>
                  <div className="karte-section-title">本日のサジェストメニュー</div>
                  {prepResult.map(function(s,i){ return <SuggestCard key={i} s={s} history={history} />; })}
                </div>
              )}

              {/* ── STEP 2: 録音 ── */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">② セッション録音</div>
                  {recording && <span style={{fontSize:11,color:"#F07020"}}><span className="rec-dot"/>録音中</span>}
                </div>
                <div className="panel-body">
                  <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:12,color:"#666",whiteSpace:"nowrap"}}>📅 セッション実施日時</span>
                    <input
                      type="text"
                      value={sessionDateTime}
                      onChange={function(e){ setSessionDateTime(e.target.value); }}
                      placeholder="例: 2026/03/10 09:00"
                      style={{flex:1,background:"#F4F5F7",border:"1px solid #E4E8EC",borderRadius:6,color:"#1A1E26",fontSize:13,padding:"5px 10px",fontFamily:"'DM Mono',monospace"}}
                    />
                  </div>
                  <div className="chrome-note">💡 <strong>Chrome / Edge</strong> で動作します。マイクの許可を求められたら「許可」を選択してください。</div>
                  <div className="record-center">
                    <button className={"record-btn"+(recording?" recording":"")} onClick={recording?stopRecording:startRecording} disabled={!speechSupported}>
                      <div className="record-icon">{recording?"⏹":"🎙️"}</div>
                      <div className="record-label">{recording?"停止":"録音"}</div>
                    </button>
                    {recording && <div className="timer">{fmtTime(timer)}</div>}
                    <div className={"status-line"+(recording?" active":transcript?" done":"")}>
                      {!speechSupported?"⚠️ Chrome/Edgeをご利用ください"
                        :recording?"セッション音声を認識しています..."
                        :transcript?"✓ 録音完了 — カルテを生成できます"
                        :"ボタンを押して録音開始"}
                    </div>
                  </div>
                  {transcript ? (
                    <div>
                      <div className="label" style={{marginBottom:5}}>文字起こし結果</div>
                      <div className="transcript-box">{transcript}</div>
                      <div style={{marginTop:7,textAlign:"right"}}>
                        <button className="btn-ghost btn-sm" onClick={function(){ accRef.current=""; setTranscript(""); }}>クリア</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{marginTop:4}}>
                      <div className="label" style={{marginBottom:6,color:"#2a2a2a"}}>または — テキストを手動入力</div>
                      <textarea value={manualText} onChange={function(e){ setManualText(e.target.value); }} placeholder="文字起こしテキストをここに貼り付け..."/>
                    </div>
                  )}
                </div>
              </div>

              {/* ── STEP 3: 生成 ── */}
              {error && <div className="error-box">⚠️ {error}</div>}
              <button className="generate-btn" onClick={generateKarte} disabled={loading||!hasText}>
                {loading?"カルテ生成中...":"▶  カルテを生成する"}
              </button>
              {loading && <div className="loading-wrap"><div className="spinner"/><div className="loading-text">AIがカルテを作成しています...</div><div className="progress-bar"><div className="progress-fill"/></div></div>}

              {kartes && (
                <div style={{marginTop:28}}>
                  <div className="karte-section-title">生成カルテ — {sessionDateTime}</div>
                  {kartes.map(function(k,i){
                    return <KarteCard key={i} karte={k} date={sessionDateTime} onSave={function(){ saveToHistory(kartes[i],i); }} saved={!!savedIds[i]} email={getMemberEmail(k)} onUpdate={function(updated){ var next=kartes.slice(); next[i]=updated; setKartes(next); setSavedIds({}); }}/>;
                  })}
                  <button className="generate-btn" style={{background:"transparent",border:"1px solid #2a2a2a",color:"#555",fontSize:13,letterSpacing:2}} onClick={generateKarte} disabled={loading}>🔄 再生成</button>
                </div>
              )}
            </>
          )}

          {/* ── HISTORY ── */}
          {tab === "history" && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">会員別カルテ履歴</div>
                <span style={{fontSize:11,color:"#444"}}>{historyKeys.length}名</span>
              </div>
              {historyKeys.length === 0 ? (
                <div className="empty-state">📋 カルテを生成して「履歴に保存」するとここに蓄積されます</div>
              ) : (
                <div className="member-list">
                  {historyKeys.map(function(key) {
                    var m = history[key];
                    var isOpen = openMember === key;
                    return (
                      <div className="member-row" key={key}>
                        <div className={"member-row-header" + (isOpen ? " open" : "")} onClick={function(){ setOpenMember(isOpen ? null : key); }}>
                          {m.member_id && <span className="member-id-badge">#{m.member_id}</span>}
                          <span className="member-name-big">{m.name}</span>
                          <span className="member-count">{(m.sessions || []).length}回</span>
                          <span className={"chevron" + (isOpen ? " open" : "")}>▶</span>
                        </div>
                        {isOpen && (
                          <div className="history-list">
                            {(m.sessions || []).map(function(s, si) {
                              var sk = key + si;
                              var isSessionOpen = openSession === sk;
                              var summary = (s.karte.exercises || []).map(function(e){ return e.name; }).join(" / ");
                              return (
                                <div className="history-item" key={si}>
                                  <div className="history-item-header" onClick={function(){ setOpenSession(isSessionOpen ? null : sk); }}>
                                    <span className="history-date">{s.date}</span>
                                    <span className="history-summary">{summary}</span>
                                    <span className="chevron" style={{fontSize:10}}>{isSessionOpen ? "▼" : "▶"}</span>
                                  </div>
                                  {isSessionOpen && <HistoryDetail karte={s.karte} onUpdate={function(updated){ updateHistorySession(key, si, updated); }} onDelete={function(){ deleteHistorySession(key, si); setOpenSession(null); }} />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === "settings" && (
            <>
              {/* Firebase設定 */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">🔥 Firebase設定（全デバイス同期）</div>
                </div>
                <div className="panel-body">
                  <div className="hint" style={{marginBottom:10}}>
                    Firebase Firestoreを設定すると、会員履歴・種目DB・APIキーが全デバイスで共有されます。<br/>
                    <a href="https://console.firebase.google.com" target="_blank" style={{color:"#ff7030"}}>console.firebase.google.com</a> でプロジェクトを作成し、設定オブジェクト（JSON）を貼り付けてください。
                  </div>
                  <textarea
                    value={fbConfig}
                    onChange={function(e){ setFbConfig(e.target.value); localStorage.setItem("tanifit:fbconfig", e.target.value); }}
                    placeholder={'{"apiKey":"AIza...","authDomain":"xxx.firebaseapp.com","projectId":"xxx","storageBucket":"xxx","messagingSenderId":"xxx","appId":"xxx"}'}
                    style={{height:80, fontSize:11, fontFamily:"'DM Mono',monospace", marginBottom:8}}
                  />
                  {fbStatus && <div className="error-box" style={{marginBottom:8}}>{fbStatus}</div>}
                  {getDb() && <div className="success-box" style={{marginBottom:8}}>✓ Firebase接続済み</div>}

                  {/* オーナーPIN */}
                  <div className="label" style={{marginTop:12, marginBottom:6}}>🔐 オーナーPIN（設定の編集権限）</div>
                  {isOwner ? (
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <div className="success-box" style={{flex:1,marginBottom:0}}>✓ オーナーモード有効</div>
                      <button className="btn-ghost" style={{fontSize:11}} onClick={function(){ setIsOwner(false); }}>解除</button>
                    </div>
                  ) : (
                    <div style={{display:"flex",gap:8}}>
                      <input type="password" value={ownerPinInput} onChange={function(e){ setOwnerPinInput(e.target.value); }}
                        placeholder="PINを入力" style={{flex:1,marginBottom:0}} />
                      <button className="btn-primary" style={{padding:"8px 14px",fontSize:12}} onClick={async function(){
                        var db = getDb();
                        if (!db) { setOwnerPinError("Firebase未設定"); return; }
                        try {
                          var pinSnap = await getDoc(doc(db, "tanifit", "owner"));
                          if (!pinSnap.exists()) {
                            // 初回設定：このPINをオーナーPINとして登録
                            await setDoc(doc(db, "tanifit", "owner"), { pin: ownerPinInput });
                            setIsOwner(true); setOwnerPinError("✓ オーナーPINを新規登録しました");
                          } else {
                            if (pinSnap.data().pin === ownerPinInput) { setIsOwner(true); setOwnerPinError(""); }
                            else { setOwnerPinError("PINが違います"); }
                          }
                        } catch(e) { setOwnerPinError("エラー: " + e.message); }
                      }}>認証</button>
                    </div>
                  )}
                  {ownerPinError && <div style={{fontSize:11,color: ownerPinError.startsWith("✓") ? "#2A8A5A":"#ff5500",marginTop:4}}>{ownerPinError}</div>}
                  <div className="hint" style={{marginTop:6}}>オーナーモード時のみ会員リスト・種目DB・APIキーの編集が全デバイスに反映されます</div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">🔑 Anthropic APIキー</div>
                </div>
                <div className="panel-body">
                  <div className="label" style={{marginBottom:6}}>APIキー</div>
                  <input type="password" value={apiKey}
                    onChange={function(e){
                      var k = e.target.value;
                      setApiKey(k);
                      localStorage.setItem("tanifit:apikey", k);
                      // Firebase にも保存（オーナーのみ）
                      if (isOwner) { saveConfig({ apiKey: k }); }
                    }}
                    placeholder="sk-ant-..."
                    style={{marginBottom:8, fontFamily:"'DM Mono',monospace"}}
                  />
                  <div className="hint">
                    Anthropic Console（console.anthropic.com）でAPIキーを取得できます。<br/>
                    キーはこのブラウザのみに保存されます。
                  </div>
                  {apiKey && <div className="success-box" style={{marginTop:10,marginBottom:0}}>✓ APIキー設定済み（{apiKey.slice(0,12)}...）</div>}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">会員リスト 登録</div>
                </div>
                <div className="panel-body">
                  <div className="label" style={{marginBottom:8}}>スプレッドシートから貼り付け</div>
                  <div className="hint" style={{marginBottom:12}}>
                    Googleスプレッドシートで以下の列をコピー＆ペーストしてください。<br/>
                    <code style={{color:"#ff7030", fontSize:11}}>会員番号[タブ]氏名[タブ]メールアドレス[タブ]ふりがな[タブ]性別(男/女)</code><br/>
                    <code style={{color:"#555", fontSize:10}}>例: 3	田中太郎	taro@example.com	たなかたろう	男</code>
                  </div>
                  <textarea
                    value={csvInput}
                    onChange={function(e){ setCsvInput(e.target.value); }}
                    placeholder={"3\t田中太郎\ttaro@example.com\tたなかたろう\n4\t谷川直斗\ttanikawa@example.com\tたにかわなおと"}
                    style={{minHeight:140,marginBottom:12}}
                  />
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <button className="btn" onClick={importCsv} disabled={!csvInput.trim()}>📋 登録する</button>
                    {members.length > 0 && (
                      <button className="btn-ghost" onClick={function(){ setMembers([]); saveConfig({ members: [] }); setImportMsg("クリアしました"); setImportOk(false); }}>
                        クリア
                      </button>
                    )}
                  </div>
                  {importMsg && <div className={"success-box" + (importOk ? "" : " error-box")} style={{marginTop:12,marginBottom:0}}>{importMsg}</div>}
                </div>
              </div>

              <div className="panel" style={{marginTop:14}}>
                <div className="panel-header">
                  <div className="panel-title">種目リスト 登録</div>
                </div>
                <div className="panel-body">
                  <div className="label" style={{marginBottom:8}}>スプレッドシートから貼り付け</div>
                  <div className="hint" style={{marginBottom:12}}>
                    形式: <code style={{color:"#ff7030"}}>種目名/部位/男性-初級/男性-中級/男性-上級/女性-初級/女性-中級/女性-上級/レップ数/インターバル/セット数/所用時間/一言レクチャー/動画URL(省略可)/画像URL(省略可)</code><br/>
                    ※スプレッドシートからそのままコピー&ペーストでOK。動画URL列がない場合はYouTube検索URLを自動生成します。
                  </div>
                  <textarea value={exInput} onChange={function(e){ setExInput(e.target.value); }}
                    placeholder={"ベンチプレス\t胸\t20kg\t40kg\t60kg\t10kg\t20kg\t30kg\t10回\t60秒\t3\t5分\t肩甲骨を寄せて胸をしっかり張る"}
                    style={{minHeight:120, marginBottom:12}} />
                  <div style={{display:"flex", gap:10, alignItems:"center"}}>
                    <button className="btn" onClick={importExercises} disabled={!exInput.trim()}>📋 登録する</button>
                    {exerciseList.length > 0 && (
                      <button className="btn-ghost" onClick={function(){ setExerciseList([]); saveConfig({ exerciseList:[] }); setExImportMsg("クリアしました"); setExImportOk(false); }}>クリア</button>
                    )}
                  </div>
                  {exImportMsg && <div className={"success-box"+(exImportOk?"":" error-box")} style={{marginTop:12,marginBottom:0}}>{exImportMsg}</div>}
                  {exerciseList.length > 0 && (
                    <div style={{marginTop:14, maxHeight:220, overflowY:"auto", borderTop:"1px solid #E4E8EC", paddingTop:10}}>
                      <div style={{display:"grid", gridTemplateColumns:"80px 1fr 50px 50px 50px 50px 50px 50px 50px 50px 30px", gap:4, marginBottom:6, padding:"0 4px"}}>
                        {["カテゴリ","種目名","男初","男中","男上","女初","女中","女上","回数","時間","画像"].map(function(h){ return <span key={h} style={{fontSize:9,color:"#333",letterSpacing:1}}>{h}</span>; })}
                      </div>
                      {exerciseList.map(function(e, i){
                        var CAT_COLORS = { "静的ストレッチ": "#5A9AB0", "モビリティ": "#45BFBF", "スタビリティ": "#5AB08A", "ウエイト": "#F07020" };
                        return (
                          <div key={i} style={{display:"grid", gridTemplateColumns:"80px 1fr 50px 50px 50px 50px 50px 50px 50px 50px 30px", gap:4, padding:"5px 4px", borderBottom:"1px solid #141414", fontSize:11, alignItems:"center"}}>
                            <span style={{color: CAT_COLORS[e.category]||"#444", fontSize:9, letterSpacing:1}}>{e.category||"—"}</span>
                            <span style={{color:"#ddd"}}>{e.name}</span>
                            {["男初級","男中級","男上級","女初級","女中級","女上級"].map(function(k){ return <span key={k} style={{color:"#ff7030",fontSize:10,fontFamily:"'DM Mono',monospace"}}>{(e.weight||{})[k]||"—"}</span>; })}
                            <span style={{color:"#888",fontSize:10}}>{e.reps||"—"}</span>
                            <span style={{color:"#666",fontSize:10}}>{e.duration||"—"}</span>
                            {e.image_url ? <span style={{color:"#5588aa",fontSize:9}} title={e.image_url}>📷</span> : <span style={{color:"#222",fontSize:9}}>—</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {members.length > 0 && (
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">登録会員一覧</div>
                    <span style={{fontSize:11,color:"#444"}}>{members.length}名</span>
                  </div>
                  <div style={{padding:"8px 0",maxHeight:240,overflowY:"auto"}}>
                    {members.map(function(m) {
                      return (
                        <div key={m.id} style={{display:"flex",gap:12,padding:"7px 20px",borderBottom:"1px solid #161616",fontSize:12,alignItems:"center"}}>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#F07020",minWidth:40}}>#{m.id}</span>
                          <span style={{flex:1}}>{m.name}</span>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#444"}}>{m.furigana || "—"}</span>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color: m.gender==="女"?"#e07090":"#5090cc"}}>{m.gender || "—"}</span>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#444"}}>{m.email || "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
