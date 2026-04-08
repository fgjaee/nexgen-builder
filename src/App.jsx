import React, { useMemo, useState } from "react";
import {
  Upload,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  Settings2,
  ListChecks,
  Tag,
  Clock,
  Circle,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
   Inline UI primitives (no shadcn, no framer-motion)
   ──────────────────────────────────────────────────────────────────────────── */
const cx = (...c) => c.filter(Boolean).join(" ");

const Card = ({ className = "", children }) => (
  <div className={cx("rounded-2xl border border-slate-700 bg-slate-900/60 shadow-lg", className)}>{children}</div>
);
const CardHeader = ({ className = "", children }) => <div className={cx("px-5 pt-5 pb-2", className)}>{children}</div>;
const CardTitle = ({ className = "", children }) => <h3 className={cx("text-lg font-semibold text-slate-100", className)}>{children}</h3>;
const CardDescription = ({ className = "", children }) => <p className={cx("text-sm text-slate-400 mt-1", className)}>{children}</p>;
const CardContent = ({ className = "", children }) => <div className={cx("px-5 pb-5 pt-2", className)}>{children}</div>;

const Button = ({ className = "", variant = "default", size = "md", children, ...rest }) => {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  const variants = {
    default: "bg-emerald-500 hover:bg-emerald-400 text-slate-900",
    outline: "border border-slate-600 bg-transparent hover:bg-slate-800 text-slate-100",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-200",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  );
};

const Textarea = ({ className = "", ...rest }) => (
  <textarea
    className={cx(
      "w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono",
      className
    )}
    {...rest}
  />
);

const Badge = ({ className = "", children }) => (
  <span className={cx("inline-flex items-center rounded-full border border-slate-600 bg-slate-800 px-2.5 py-0.5 text-xs text-slate-200", className)}>
    {children}
  </span>
);

const Tabs = ({ value, onValueChange, children }) => (
  <div>
    {React.Children.map(children, (child) =>
      React.isValidElement(child) ? React.cloneElement(child, { __tabsValue: value, __setTabsValue: onValueChange }) : child
    )}
  </div>
);
const TabsList = ({ className = "", children, __tabsValue, __setTabsValue }) => (
  <div className={cx("inline-flex flex-wrap gap-1 rounded-xl border border-slate-700 bg-slate-900/70 p-1", className)}>
    {React.Children.map(children, (child) =>
      React.isValidElement(child) ? React.cloneElement(child, { __tabsValue, __setTabsValue }) : child
    )}
  </div>
);
const TabsTrigger = ({ value, children, __tabsValue, __setTabsValue }) => {
  const active = __tabsValue === value;
  return (
    <button
      onClick={() => __setTabsValue && __setTabsValue(value)}
      className={cx(
        "px-3 py-1.5 rounded-lg text-sm font-medium transition",
        active ? "bg-emerald-500 text-slate-900" : "text-slate-300 hover:bg-slate-800"
      )}
    >
      {children}
    </button>
  );
};
const TabsContent = ({ value, children, __tabsValue }) => (__tabsValue === value ? <div className="mt-4">{children}</div> : null);

const FileInput = ({ accept, onChange, label = "Choose file" }) => {
  const id = React.useId();
  const [name, setName] = useState("");
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <label
        htmlFor={id}
        className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-medium px-4 py-2 text-sm transition active:scale-[0.98]"
      >
        <Upload className="w-4 h-4" />
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          setName(f ? f.name : "");
          onChange && onChange(f);
        }}
      />
      <span className="text-xs text-slate-400 truncate">{name || "No file selected"}</span>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Roadmap
   ──────────────────────────────────────────────────────────────────────────── */
const ROADMAP = [
  {
    phase: "Phase 1",
    title: "Separated data model",
    status: "done",
    items: [
      "Master perm data stays separate from weekly sale data",
      "Weekly COOL data stays separate from both",
      "The builder emits one merged userscript from all three inputs",
    ],
  },
  {
    phase: "Phase 2",
    title: "Perm workflow preservation",
    status: "done",
    items: [
      "Generated runtime keeps the older working edit, update, and postback flow",
      "Master-first UOM and organic logic are layered on top",
      "Runtime debug log is viewable and downloadable from the userscript panel",
    ],
  },
  {
    phase: "Phase 3",
    title: "Next",
    status: "next",
    items: [
      "Add validation summaries before build",
      "Show dropped row counts",
      "Add compact mode for smaller output size",
    ],
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   CSV parsing + normalizers (builder side)
   ──────────────────────────────────────────────────────────────────────────── */
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function normalizePlu(value) {
  return String(value || "").replace(/[^0-9]/g, "").trim();
}
function pick(row, candidates) {
  const map = new Map();
  Object.keys(row).forEach((k) => map.set(normalizeKey(k), row[k] ?? ""));
  for (const c of candidates) {
    const v = map.get(normalizeKey(c));
    if (v !== undefined) return v;
  }
  return "";
}
function toBool(v) {
  const s = String(v || "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}
function toNumberOrBlank(v) {
  const cleaned = String(v || "").replace(/[^0-9.\-]/g, "");
  if (!cleaned) return "";
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : "";
}

function parseCsv(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

function parseCoolCsv(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]).map((h) => h.trim());
    const norm = cols.map((h) => normalizeKey(h));
    if (
      norm.includes("plu") &&
      (norm.includes("description") || norm.includes("desc")) &&
      (norm.includes("cool") || norm.includes("country_of_origin") || norm.includes("country"))
    ) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) return [];
  const headers = splitCsvLine(lines[headerIndex]).map((h) => h.trim());
  return lines.slice(headerIndex + 1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

function normalizeMasterRow(row, index) {
  const item_id = pick(row, ["item_id", "id", "plu", "itemid"]);
  const raw_name = pick(row, ["raw_name", "name", "product_name", "title"]);
  const clean_name = pick(row, ["clean_name", "normalized_name", "name_clean"]) || raw_name;
  const sign_desc_candidate = pick(row, ["sign_desc_candidate", "perm_desc", "description_clean"]) || clean_name;
  const sold_by = (pick(row, ["sold_by", "perm_uom", "uom", "unit"]) || "").toUpperCase();
  const perm_uom = (pick(row, ["perm_uom", "sold_by", "uom"]) || sold_by || "").toUpperCase();
  const organic_hint =
    /\bORGANIC\b/.test(String(raw_name || sign_desc_candidate).toUpperCase()) ||
    (normalizePlu(item_id).length === 5 && normalizePlu(item_id).startsWith("9"));
  return {
    source_row_id: String(index + 1),
    item_id,
    raw_name,
    clean_name,
    sign_desc_candidate,
    sold_by,
    perm_uom,
    organic_hint,
  };
}

function normalizeSaleRow(row, index) {
  const item_id = pick(row, ["item_id", "id", "plu", "itemid"]);
  const raw_name = pick(row, ["raw_name", "name", "product_name", "title"]);
  const sign_desc_candidate = pick(row, ["sign_desc_candidate", "sale_desc", "description_clean"]) || raw_name;
  return {
    source_row_id: String(index + 1),
    item_id,
    raw_name,
    sign_desc_candidate,
    sale_type: pick(row, ["sale_type"]),
    sale_qty: toNumberOrBlank(pick(row, ["sale_qty", "quantity"])),
    sale_amount: toNumberOrBlank(pick(row, ["sale_amount"])),
    sale_discount: toNumberOrBlank(pick(row, ["sale_discount", "discount"])),
    price_unit: (pick(row, ["price_unit", "unit", "sold_by"]) || "").toUpperCase(),
    sign_price: toNumberOrBlank(pick(row, ["sign_price", "current_unit_price", "sale_price"])),
    raw_promo_text: pick(row, ["raw_promo_text", "promo_text", "promotion_text"]),
  };
}

function normalizeCoolRow(row) {
  return {
    plu: pick(row, ["plu", "item_id", "id"]),
    desc: pick(row, ["description", "desc", "name"]),
    cool: pick(row, ["cool", "country_of_origin", "country"]),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Userscript runtime body — kept as a string with escaped backslashes
   so it survives concatenation. EMBEDDED is injected at build time.
   ──────────────────────────────────────────────────────────────────────────── */
const RUNTIME_BODY = `
  'use strict';

  const CONFIG = {
    COL_UPC: 4,
    COL_TAG_DESC: 5,
    COL_DELETE: 1,
    AJAX_TIMEOUT: 20000,
    EDITFORM_TIMEOUT: 10000,
    POST_SAVE_DELAY: 800,
    POST_DELETE_DELAY: 1000,
    EDIT_FORM_SETTLE_DELAY: 300,
    ENABLE_DESC_OVERWRITE: true
  };

  const STORAGE_KEYS = {
    master: 'nexgen_master_rows_v6',
    sale: 'nexgen_sale_rows_v6',
    cool: 'nexgen_cool_rows_v6'
  };

  let stopRequested = false;
  let runLog = [];
  let debugLog = [];
  let MASTER_ROWS = Array.isArray(EMBEDDED.master_rows) ? EMBEDDED.master_rows.slice() : [];
  let SALE_ROWS = Array.isArray(EMBEDDED.sale_rows) ? EMBEDDED.sale_rows.slice() : [];
  let COOL_DATA = Array.isArray(EMBEDDED.cool_rows) ? EMBEDDED.cool_rows.slice() : [];

  const MASTER_BY_ITEM_ID = new Map();
  const MASTER_BY_DESC = new Map();
  const SALE_BY_ITEM_ID = new Map();
  const COOL_BY_PLU = new Map();
  const COOL_BY_NORM_DESC = new Map();
  const UOM_CACHE = new Map();
  const ORGANIC_CACHE = new Map();
  const COOL_CACHE = new Map();

  /* ── helpers ─────────────────────────────────────────────────────────── */
  function normalizePlu(v) { return String(v || '').replace(/[^0-9]/g, '').trim(); }
  function normalizeDesc(v) {
    return String(v || '').toUpperCase().replace(/\\s+/g, ' ').replace(/[^\\w\\s]/g, ' ').replace(/\\s+/g, ' ').trim();
  }
  function coolNormalize(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z0-9\\s]/g, '').replace(/\\s+/g, ' ').trim();
  }
  function coolGetWords(s) {
    const stop = new Set(['THE','A','AN','AND','OR','OF','IN','FOR','WITH']);
    return coolNormalize(s).split(' ').filter(w => w.length && !stop.has(w));
  }
  function escapeHtml(v) {
    return String(v || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  }
  function serializeForDebug(v) {
    try { return typeof v === 'string' ? v : JSON.stringify(v); } catch (e) { return String(v); }
  }
  function pushDebug(kind, message, extra) {
    debugLog.push({
      ts: new Date().toISOString(),
      kind: kind || 'info',
      message: String(message || ''),
      extra: extra === undefined ? null : serializeForDebug(extra)
    });
    if (debugLog.length > 1500) debugLog.shift();
  }
  function log(msg, level) {
    const lvl = level || 'info';
    const prefix = '[NexGen v6.1] ' + new Date().toLocaleTimeString();
    if (lvl === 'error') console.error(prefix, msg);
    else if (lvl === 'warn') console.warn(prefix, msg);
    else console.log(prefix, msg);
    const el = document.getElementById('nexgen-status');
    if (el) {
      el.textContent = msg;
      el.style.color = lvl === 'error' ? '#e74c3c' : lvl === 'warn' ? '#f1c40f' : '#bdc3c7';
    }
    pushDebug(lvl, msg);
  }
  function updateProgress(t) { const e = document.getElementById('nexgen-progress'); if (e) e.textContent = t; }
  function addLogEntry(e) { runLog.push(e); }
  function clearRunLog() { runLog = []; }
  function downloadTextFile(name, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ── debug hooks (passive only — never replace native console fns
       because pages sometimes introspect console.error.caller/.arguments
       which throws on strict-mode wrappers) ──────────────────────────── */
  function installGlobalDebugHooks() {
    if (window.__nexgenDebugHooksInstalled) return;
    window.__nexgenDebugHooksInstalled = true;
    window.addEventListener('error', (ev) => {
      pushDebug('error', 'window.error', { message: ev.message, filename: ev.filename, lineno: ev.lineno, colno: ev.colno });
    });
    window.addEventListener('unhandledrejection', (ev) => {
      pushDebug('error', 'unhandledrejection', ev.reason && ev.reason.stack ? ev.reason.stack : String(ev.reason));
    });
  }

  /* ── persistence ─────────────────────────────────────────────────────── */
  function saveDatasets() {
    try {
      localStorage.setItem(STORAGE_KEYS.master, JSON.stringify(MASTER_ROWS));
      localStorage.setItem(STORAGE_KEYS.sale, JSON.stringify(SALE_ROWS));
      localStorage.setItem(STORAGE_KEYS.cool, JSON.stringify(COOL_DATA));
    } catch (e) { pushDebug('error', 'saveDatasets failed', e); }
  }
  function loadDatasets() {
    try {
      const m = JSON.parse(localStorage.getItem(STORAGE_KEYS.master) || 'null');
      const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.sale) || 'null');
      const c = JSON.parse(localStorage.getItem(STORAGE_KEYS.cool) || 'null');
      if (Array.isArray(m) && m.length) MASTER_ROWS = m;
      if (Array.isArray(s) && s.length) SALE_ROWS = s;
      if (Array.isArray(c) && c.length) COOL_DATA = c;
    } catch (e) { pushDebug('error', 'loadDatasets failed', e); }
  }

  /* ── indexes ─────────────────────────────────────────────────────────── */
  function buildIndexes() {
    MASTER_BY_ITEM_ID.clear(); MASTER_BY_DESC.clear();
    SALE_BY_ITEM_ID.clear();
    COOL_BY_PLU.clear(); COOL_BY_NORM_DESC.clear();
    UOM_CACHE.clear(); ORGANIC_CACHE.clear(); COOL_CACHE.clear();

    MASTER_ROWS.forEach((row) => {
      const plu = normalizePlu(row.item_id);
      const desc = normalizeDesc(row.sign_desc_candidate || row.clean_name || row.raw_name);
      if (plu) MASTER_BY_ITEM_ID.set(plu, row);
      if (desc && !MASTER_BY_DESC.has(desc)) MASTER_BY_DESC.set(desc, row);
    });
    SALE_ROWS.forEach((row) => {
      const plu = normalizePlu(row.item_id);
      if (plu) SALE_BY_ITEM_ID.set(plu, row);
    });
    COOL_DATA.forEach((row) => {
      const plu = normalizePlu(row.plu);
      const desc = String(row.desc || '').trim();
      const cool = String(row.cool || '').trim();
      if (!plu || !desc || !cool) return;
      const entry = { plu, desc, cool };
      COOL_BY_PLU.set(plu, entry);
      const n = coolNormalize(desc);
      if (n && !COOL_BY_NORM_DESC.has(n)) COOL_BY_NORM_DESC.set(n, entry);
    });
  }

  /* ── lookups ─────────────────────────────────────────────────────────── */
  function findMasterRow(upc, desc) {
    const plu = normalizePlu(upc);
    if (plu && MASTER_BY_ITEM_ID.has(plu)) return MASTER_BY_ITEM_ID.get(plu);
    const n = normalizeDesc(desc);
    if (n && MASTER_BY_DESC.has(n)) return MASTER_BY_DESC.get(n);
    return null;
  }
  function findSaleRow(upc) {
    const plu = normalizePlu(upc);
    return plu ? SALE_BY_ITEM_ID.get(plu) || null : null;
  }

  const PLU_EA = new Map([
    ['3040','EA'],['4062','EA'],['4596','EA'],['4081','EA'],['4750','EA'],
    ['4759','EA'],['4781','EA'],['4758','EA'],['4776','EA'],['4086','EA'],
    ['4067','EA'],['4608','EA'],['4632','EA'],['4545','EA'],['4604','EA'],
    ['4515','EA'],['4068','EA'],['3133','EA'],['4735','EA'],['4480','EA'],
    ['3134','EA'],['4787','EA'],['4820','EA'],['4734','EA'],['3233','EA'],
    ['3132','EA'],['4159','EA']
  ]);

  function getUomFromDescription(desc, upc) {
    const cacheKey = normalizePlu(upc || '') + '|' + normalizeDesc(desc);
    if (UOM_CACHE.has(cacheKey)) return UOM_CACHE.get(cacheKey);
    const m = findMasterRow(upc, desc);
    if (m) {
      const v = String(m.perm_uom || m.sold_by || '').toUpperCase().trim();
      if (v === 'EA' || v === 'LB') { UOM_CACHE.set(cacheKey, v); return v; }
    }
    const plu = normalizePlu(upc || '');
    const upper = normalizeDesc(desc);
    let value = null;
    if (PLU_EA.has(plu)) value = 'EA';
    else if (/\\b(EA|EACH)\\b/.test(upper)) value = 'EA';
    else if (/\\bBUNCH(ES)?\\b/.test(upper)) value = 'EA';
    else if (/\\d+\\s*(CT|COUNT)\\b/.test(upper)) value = 'EA';
    else if (/\\d+\\s*LB\\b/.test(upper)) value = 'EA';
    else if (/\\bLB\\b/.test(upper)) value = 'LB';
    else if (/\\bBULK\\b/.test(upper)) value = 'LB';
    else if (/\\bPER\\s*POUND\\b/.test(upper)) value = 'LB';
    else if (/\\bPEPPERS?\\b/.test(upper)) value = /\\bBELL\\b/.test(upper) ? 'EA' : 'LB';
    else if (/\\b(TOMATO(ES)?|TOMATILLOS?|APPLES?|GRAPES?|BANANAS?|ONIONS?|POTATOES?|GINGER|BEETS?|CARROTS?|PARSNIPS?|RADISH(ES)?|TURNIPS?|RUTABAGAS?|SUNCHOKES?)\\b/.test(upper)) value = 'LB';
    UOM_CACHE.set(cacheKey, value);
    return value;
  }

  function isOrganicItem(upc, desc) {
    const cacheKey = normalizePlu(upc || '') + '|' + normalizeDesc(desc);
    if (ORGANIC_CACHE.has(cacheKey)) return ORGANIC_CACHE.get(cacheKey);
    const m = findMasterRow(upc, desc);
    const plu = normalizePlu(upc || '');
    const result = !!(m && m.organic_hint) || (plu.length === 5 && plu.startsWith('9')) || /\\bORGANIC\\b|\\bORG\\b/.test(normalizeDesc(desc));
    ORGANIC_CACHE.set(cacheKey, result);
    return result;
  }

  function coolSimilarity(g, c) {
    const gN = coolNormalize(g); const cN = coolNormalize(c);
    if (gN === cN) return 1;
    if (gN.includes(cN) || cN.includes(gN)) return 0.9;
    const gW = coolGetWords(g); const cW = coolGetWords(c);
    if (!gW.length || !cW.length) return 0;
    let match = 0; const used = new Set();
    for (const gw of gW) {
      for (let i = 0; i < cW.length; i += 1) {
        if (used.has(i)) continue;
        const cw = cW[i];
        if (gw === cw) { match += 1; used.add(i); break; }
        if ((gw.startsWith(cw) || cw.startsWith(gw)) && Math.min(gw.length, cw.length) >= 4) { match += 0.9; used.add(i); break; }
      }
    }
    return match / Math.max(gW.length, cW.length);
  }

  function findCool(upc, desc) {
    const cacheKey = normalizePlu(upc || '') + '|' + coolNormalize(desc);
    if (COOL_CACHE.has(cacheKey)) return COOL_CACHE.get(cacheKey);
    const p = COOL_BY_PLU.get(normalizePlu(upc || ''));
    if (p) { const r = { cool: p.cool, method: 'PLU', score: 1, matched: p.desc }; COOL_CACHE.set(cacheKey, r); return r; }
    const ed = COOL_BY_NORM_DESC.get(coolNormalize(desc));
    if (ed) { const r = { cool: ed.cool, method: 'DESC_EXACT', score: 1, matched: ed.desc }; COOL_CACHE.set(cacheKey, r); return r; }
    let best = null, score = 0;
    for (const e of COOL_BY_PLU.values()) {
      const s = coolSimilarity(desc, e.desc);
      if (s > score) { score = s; best = e; }
    }
    const r = best && score >= 0.6 ? { cool: best.cool, method: 'DESC', score, matched: best.desc } : null;
    COOL_CACHE.set(cacheKey, r);
    return r;
  }

  /* ── waiters ─────────────────────────────────────────────────────────── */
  function waitForAjax(timeout) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (Date.now() - start > timeout) return resolve();
        let busy = false;
        try {
          if (window.Sys && window.Sys.WebForms && window.Sys.WebForms.PageRequestManager) {
            const prm = window.Sys.WebForms.PageRequestManager.getInstance();
            if (prm && prm.get_isInAsyncPostBack && prm.get_isInAsyncPostBack()) busy = true;
          }
        } catch (e) {}
        if (!busy) {
          const loaders = document.querySelectorAll('[id*="LoadingPanel"], .raDiv, .rgLoading, .RadAjax_Loading, [id*="AjaxLoadingPanel"]');
          for (const l of loaders) {
            const st = window.getComputedStyle(l);
            if (st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0') { busy = true; break; }
          }
        }
        if (busy) setTimeout(check, 200);
        else setTimeout(resolve, 400);
      };
      setTimeout(check, 500);
    });
  }
  function waitForEditForm(timeout) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const ef = document.querySelector('.rgEditRow') || document.querySelector('tr[id*="EditForm"]') || document.querySelector('.rgEditForm');
        if (ef) return resolve(ef);
        const fields = document.querySelector('[id*="radGridStaging"] input[id*="StartDate"], [id*="radGridStaging"] textarea[id*="Sgn_Dsc"]');
        if (fields) return resolve(fields.closest('tr') || fields.closest('.rgEditForm'));
        if (Date.now() - start > timeout) return resolve(null);
        setTimeout(check, 300);
      };
      check();
    });
  }
  function waitForEditFormClose(timeout) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const ef = document.querySelector('.rgEditRow') || document.querySelector('tr[id*="EditForm"]') || document.querySelector('.rgEditForm');
        if (!ef) return resolve(true);
        if (Date.now() - start > timeout) return resolve(false);
        setTimeout(check, 300);
      };
      setTimeout(check, 500);
    });
  }

  /* ── grid + row ops ──────────────────────────────────────────────────── */
  function getRows() {
    const sels = [
      '[id*="radGridStaging"] .rgDataDiv table tbody tr.rgRow, [id*="radGridStaging"] .rgDataDiv table tbody tr.rgAltRow',
      '[id*="radGridStaging"] .rgMasterTable tbody tr.rgRow, [id*="radGridStaging"] .rgMasterTable tbody tr.rgAltRow',
      '[id*="RadGrid"] .rgDataDiv table tbody tr.rgRow, [id*="RadGrid"] .rgDataDiv table tbody tr.rgAltRow'
    ];
    for (const s of sels) {
      const r = document.querySelectorAll(s);
      if (r.length) return Array.from(r);
    }
    return Array.from(document.querySelectorAll('tr.rgRow, tr.rgAltRow'));
  }
  function parseRow(row) {
    if (!row || !row.cells || row.cells.length < 6) return null;
    return {
      upc: row.cells[CONFIG.COL_UPC] && row.cells[CONFIG.COL_UPC].textContent ? row.cells[CONFIG.COL_UPC].textContent.trim() : '',
      desc: row.cells[CONFIG.COL_TAG_DESC] && row.cells[CONFIG.COL_TAG_DESC].textContent ? row.cells[CONFIG.COL_TAG_DESC].textContent.trim() : ''
    };
  }
  function findDuplicates() {
    const rows = getRows();
    const seen = new Map();
    const dupes = [];
    rows.forEach((row, idx) => {
      const p = parseRow(row); if (!p) return;
      const n = normalizeDesc(p.desc); if (!n) return;
      if (seen.has(n)) dupes.push({ idx, upc: p.upc, desc: p.desc, row });
      else seen.set(n, idx);
    });
    return dupes;
  }
  function findDeleteButton(row) {
    if (!row) return null;
    const cell = row.cells && row.cells[CONFIG.COL_DELETE] ? row.cells[CONFIG.COL_DELETE] : null;
    if (cell) {
      const b = cell.querySelector('input[type="image"], a, img, button, [onclick]');
      if (b) return b;
    }
    return row.querySelector('input[id*="DeleteButton"], input[type="image"][alt*="Delete" i], a[id*="DeleteButton"], img[src*="delete" i]');
  }
  function findEditElement(row) {
    if (!row) return null;
    const direct = row.querySelector('input[id*="EditButton"], input[type="image"][alt*="Edit" i], a[id*="EditButton"], a[href*="Edit"], img[src*="edit" i]');
    if (direct) return direct;
    const cell = row.cells && row.cells[2] ? row.cells[2] : null;
    return cell ? cell.querySelector('input[type="image"], a, button, img') : null;
  }
  function postbackFromElement(el) {
    if (!el) return null;
    const onclick = el.getAttribute('onclick') || '';
    const href = el.getAttribute('href') || '';
    const parentLink = el.closest && el.closest('a');
    const parentHref = parentLink && parentLink.getAttribute('href') ? parentLink.getAttribute('href') : '';
    const blob = onclick + ' ' + href + ' ' + parentHref;
    return blob.match(/__doPostBack\\s*\\(\\s*['"]([^'"]+)['"]\\s*,\\s*['"]([^'"]*)['"]\\s*\\)/);
  }

  async function triggerDelete(row, rowIndex) {
    const btn = findDeleteButton(row);
    if (!btn) return false;
    const m = postbackFromElement(btn);
    if (m && window.__doPostBack) { window.__doPostBack(m[1], m[2]); return true; }
    try {
      const grids = document.querySelectorAll('[id*="radGridStaging"], [id*="RadGrid"]');
      for (const g of grids) {
        const obj = window.$find && window.$find(g.id);
        if (obj && obj.get_masterTableView) {
          const mtv = obj.get_masterTableView();
          const items = mtv.get_dataItems();
          if (items && items.length > rowIndex) {
            mtv.fireCommand('Delete', items[rowIndex].get_itemIndex());
            return true;
          }
        }
      }
    } catch (e) {}
    btn.click();
    return true;
  }

  async function triggerEdit(row, rowIndex) {
    try {
      const grids = document.querySelectorAll('[id*="radGridStaging"], [id*="RadGrid"]');
      for (const g of grids) {
        const obj = window.$find && window.$find(g.id);
        if (obj && obj.get_masterTableView) {
          const mtv = obj.get_masterTableView();
          const items = mtv.get_dataItems();
          if (items && items.length > rowIndex) {
            mtv.fireCommand('Edit', items[rowIndex].get_itemIndex());
            return true;
          }
        }
      }
    } catch (e) {}
    const btn = findEditElement(row);
    if (!btn) return false;
    const m = postbackFromElement(btn);
    if (m && window.__doPostBack) { window.__doPostBack(m[1], m[2]); return true; }
    btn.click();
    return true;
  }

  async function runDeduplication() {
    log('Scanning for duplicate descriptions...');
    let total = 0; let max = 500;
    while (max-- > 0) {
      if (stopRequested) { log('Dedup stopped'); break; }
      const dupes = findDuplicates();
      if (!dupes.length) break;
      const d = dupes[dupes.length - 1];
      const oc = window.confirm; window.confirm = () => true;
      const ok = await triggerDelete(d.row, d.idx);
      window.confirm = oc;
      if (!ok) { log('Delete action not found for row ' + (d.idx + 1), 'error'); break; }
      await waitForAjax(CONFIG.AJAX_TIMEOUT);
      await new Promise(r => setTimeout(r, CONFIG.POST_DELETE_DELAY));
      total += 1;
      updateProgress('Dedup removed ' + total);
    }
    log(total ? 'Dedup complete: ' + total + ' removed' : 'No duplicates found');
    return total;
  }

  /* ── form fields ─────────────────────────────────────────────────────── */
  function setFieldValue(field, value, isCheckbox) {
    if (!field) return false;
    try {
      if (isCheckbox) {
        if (field.checked !== !!value) {
          field.checked = !!value;
          field.dispatchEvent(new Event('change', { bubbles: true }));
          field.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
        return true;
      }
      // Telerik combo
      if (field.id && field.id.includes('_Input')) {
        const comboId = field.id.replace('_Input', '');
        const obj = window.$find && window.$find(comboId);
        if (obj && obj.findItemByText) {
          const item = obj.findItemByText(value);
          if (item) { item.select(); return true; }
          if (obj.set_text) { obj.set_text(value); if (obj.commitChanges) obj.commitChanges(); return true; }
        }
      }
      // Telerik date picker
      if (field.id && field.id.includes('_dateInput')) {
        const pickerId = field.id.replace('_dateInput', '').replace('_input', '');
        const obj = window.$find && window.$find(pickerId);
        if (obj && obj.set_selectedDate) { obj.set_selectedDate(new Date(value)); return true; }
      }
      const proto = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      const setter = desc && desc.set;
      if (setter) setter.call(field, value); else field.value = value;
      field.dispatchEvent(new Event('focus', { bubbles: true }));
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    } catch (e) { pushDebug('error', 'setFieldValue failed', e); return false; }
  }

  function findActionButton(scope, kind) {
    // Search a sequence of scopes from narrow to wide so we always find the
    // button regardless of where the page renders the edit form footer.
    const scopes = [];
    if (scope) scopes.push(scope);
    const editArea = document.querySelector('.rgEditRow, .rgEditForm, tr[id*="EditForm"]');
    if (editArea && !scopes.includes(editArea)) scopes.push(editArea);
    const editFooter = document.querySelector('.rgEditFormFooter, .rgFooter, [id*="EditFormItem"]');
    if (editFooter && !scopes.includes(editFooter)) scopes.push(editFooter);
    scopes.push(document);

    const sels = kind === 'update'
      ? ['input[id*="btnUpdate"]','input[id*="UpdateButton"]','input[id*="PerformInsertButton"]','input[value="Update"]','input[value="Save"]','button[id*="Update"]','button[id*="Save"]','a[id*="Update"]','a[id*="Save"]','a[id*="PerformInsert"]']
      : ['input[id*="btnCancel"]','input[id*="CancelButton"]','input[value="Cancel"]','button[id*="Cancel"]','a[id*="Cancel"]'];

    for (const root of scopes) {
      for (const s of sels) {
        const f = root.querySelector(s);
        if (f) return f;
      }
    }
    // Text-based fallback across all scopes
    for (const root of scopes) {
      const ctrls = Array.from(root.querySelectorAll('input, button, a'));
      for (const c of ctrls) {
        const blob = [c.id||'', c.name||'', c.getAttribute('value')||'', (c.textContent||'').trim(), c.getAttribute('title')||'', c.getAttribute('aria-label')||'', c.getAttribute('onclick')||''].join(' ').toUpperCase();
        if (kind === 'update') {
          if (/(UPDATE|SAVE|INSERT)/.test(blob) && !/(CANCEL|CLOSE|DELETE)/.test(blob)) return c;
        } else {
          if (/(CANCEL|CLOSE)/.test(blob) && !/(UPDATE|SAVE|INSERT|DELETE)/.test(blob)) return c;
        }
      }
    }
    return null;
  }

  function dumpButtonCandidates(scope) {
    const root = scope || document;
    const out = [];
    const ctrls = Array.from(root.querySelectorAll('input, button, a')).slice(0, 40);
    for (const c of ctrls) {
      out.push([
        c.tagName,
        'id=' + (c.id || ''),
        'name=' + (c.name || ''),
        'value=' + (c.getAttribute('value') || ''),
        'text=' + ((c.textContent || '').trim().slice(0, 30))
      ].join(' | '));
    }
    return out.join(' || ');
  }

  function findFormFields(root) {
    const scope = root || document;
    const active = (scope.closest && scope.closest('.rgEditRow, .rgEditForm, tr[id*="EditForm"]')) || scope;
    const editArea = document.querySelector('.rgEditRow, .rgEditForm, tr[id*="EditForm"]') || document;
    return {
      uom: active.querySelector('input[id*="UOM_Input"], select[id*="UOM"]') || editArea.querySelector('input[id*="UOM_Input"], select[id*="UOM"]'),
      startDate: active.querySelector('input[id*="StartDate_dateInput"], input[id*="StartDate"]') || editArea.querySelector('input[id*="StartDate_dateInput"], input[id*="StartDate"]'),
      desc: active.querySelector('textarea[id*="Sgn_Dsc_1"], input[id*="Sgn_Dsc_1"]') || editArea.querySelector('textarea[id*="Sgn_Dsc_1"], input[id*="Sgn_Dsc_1"]'),
      cool: active.querySelector('textarea[id*="Text50"], input[id*="Text50"]') || editArea.querySelector('textarea[id*="Text50"], input[id*="Text50"]'),
      organic: active.querySelector('input[type="checkbox"][id*="SP5"]') || editArea.querySelector('input[type="checkbox"][id*="SP5"]'),
      updateBtn: findActionButton(active, 'update') || findActionButton(editArea, 'update'),
      cancelBtn: findActionButton(active, 'cancel') || findActionButton(editArea, 'cancel')
    };
  }

  async function clickButton(btn) {
    if (!btn) return false;
    const m = postbackFromElement(btn);
    if (m && window.__doPostBack) { window.__doPostBack(m[1], m[2]); return true; }
    btn.click();
    return true;
  }

  function getStartDate() {
    const t = new Date(); const d = t.getDay(); const x = new Date(t);
    if (d > 3) x.setDate(t.getDate() - (d - 3));
    else if (d < 3) x.setDate(t.getDate() - (d + 4));
    return (x.getMonth() + 1) + '/' + x.getDate() + '/' + x.getFullYear();
  }
  function describeMasterName(upc, desc) {
    const m = findMasterRow(upc, desc);
    return m && (m.sign_desc_candidate || m.clean_name || m.raw_name) ? (m.sign_desc_candidate || m.clean_name || m.raw_name) : desc;
  }

  async function processRow(idx, total, startDate) {
    const rows = getRows();
    if (idx >= rows.length) return false;
    const row = rows[idx];
    const p = parseRow(row); if (!p) return false;
    const { upc, desc } = p;
    log('[' + (idx + 1) + '/' + total + '] ' + upc + ' - ' + desc);
    if (!await triggerEdit(row, idx)) { log('triggerEdit failed', 'error'); return false; }
    await waitForAjax(CONFIG.AJAX_TIMEOUT);
    const editForm = await waitForEditForm(CONFIG.EDITFORM_TIMEOUT);
    if (!editForm) { log('Edit form did not appear', 'error'); return false; }
    await new Promise(r => setTimeout(r, CONFIG.EDIT_FORM_SETTLE_DELAY));
    const fields = findFormFields(editForm);
    const resolvedDesc = describeMasterName(upc, desc);
    const uom = getUomFromDescription(desc, upc);
    const cool = findCool(upc, desc);
    const organic = isOrganicItem(upc, desc);
    const sale = findSaleRow(upc);

    if (uom && fields.uom) setFieldValue(fields.uom, uom, false);
    if (fields.startDate) setFieldValue(fields.startDate, startDate, false);
    if (CONFIG.ENABLE_DESC_OVERWRITE && fields.desc && resolvedDesc) setFieldValue(fields.desc, resolvedDesc, false);
    if (fields.cool && cool && cool.cool) setFieldValue(fields.cool, cool.cool, false);
    if (fields.organic && organic) setFieldValue(fields.organic, true, true);

    addLogEntry({
      upc, desc: resolvedDesc, uom: uom || '',
      cool: cool && cool.cool ? cool.cool : '',
      coolMethod: cool && cool.method ? cool.method : '',
      coolScore: cool && cool.score ? cool.score.toFixed(2) : '',
      organic, hasSale: !!sale,
      saleType: sale ? sale.sale_type : '',
      signPrice: sale ? sale.sign_price : ''
    });

    if (!fields.updateBtn) {
      log('Update button not found', 'error');
      pushDebug('error', 'edit form button candidates', dumpButtonCandidates(editForm));
      const cancel = fields.cancelBtn || findActionButton(document, 'cancel');
      if (cancel) { await clickButton(cancel); await waitForAjax(CONFIG.AJAX_TIMEOUT); await waitForEditFormClose(5000); }
      return false;
    }
    await clickButton(fields.updateBtn);
    await waitForAjax(CONFIG.AJAX_TIMEOUT);
    await waitForEditFormClose(8000);
    return true;
  }

  async function runAutomation() {
    stopRequested = false; clearRunLog();
    const startDate = getStartDate();
    log('Start ' + startDate + ' | Master ' + MASTER_ROWS.length + ' | Sale ' + SALE_ROWS.length + ' | COOL ' + COOL_DATA.length);
    updateProgress('Phase 1: Dedup...');
    await runDeduplication();
    if (stopRequested) return;
    const rows = getRows();
    const total = rows.length;
    if (!total) { log('No rows found', 'error'); return; }
    let ok = 0, fail = 0;
    for (let i = 0; i < total; i += 1) {
      if (stopRequested) break;
      updateProgress('Phase 2: ' + (i + 1) + '/' + total + ' | OK ' + ok + ' | Fail ' + fail);
      try {
        const r = await processRow(i, total, startDate);
        if (r) ok += 1; else fail += 1;
      } catch (e) { fail += 1; log('Row ' + (i + 1) + ' error: ' + e.message, 'error'); }
      await new Promise(r => setTimeout(r, CONFIG.POST_SAVE_DELAY));
    }
    log('Done: ' + ok + ' saved, ' + fail + ' failed');
    updateProgress('Done: OK ' + ok + ' | Fail ' + fail);
  }

  async function testFirstRow() {
    const rows = getRows();
    if (!rows.length) { log('No rows found', 'error'); return; }
    const ok = await processRow(0, rows.length, getStartDate());
    log(ok ? 'Test row succeeded' : 'Test row failed');
  }

  function scanAllRows() {
    const rows = getRows();
    if (!rows.length) { log('No rows to scan', 'error'); return; }
    clearRunLog();
    for (const row of rows) {
      const p = parseRow(row); if (!p) continue;
      const { upc, desc } = p;
      const resolvedDesc = describeMasterName(upc, desc);
      const uom = getUomFromDescription(desc, upc);
      const c = findCool(upc, desc);
      const organic = isOrganicItem(upc, desc);
      const sale = findSaleRow(upc);
      addLogEntry({
        upc, desc: resolvedDesc, uom: uom || '',
        cool: c && c.cool ? c.cool : '',
        coolMethod: c && c.method ? c.method : '',
        coolScore: c && c.score ? c.score.toFixed(2) : '',
        organic, hasSale: !!sale,
        saleType: sale ? sale.sale_type : '',
        signPrice: sale ? sale.sign_price : ''
      });
    }
    log('Scan complete: ' + runLog.length + ' rows');
  }

  function buildLogCsv() {
    const h = ['UPC/PLU','Description','UOM','COOL','COOL Method','COOL Score','Organic','HasSale','SaleType','SignPrice'];
    const rows = runLog.map(e => [
      e.upc,
      '"' + String(e.desc || '').replace(/"/g, '""') + '"',
      e.uom || '',
      '"' + String(e.cool || '').replace(/"/g, '""') + '"',
      e.coolMethod || '', e.coolScore || '',
      e.organic ? 'Y' : '',
      e.hasSale ? 'Y' : '',
      e.saleType || '', e.signPrice || ''
    ]);
    return [h.join(','), ...rows.map(r => r.join(','))].join('\\n');
  }

  function buildDebugCsv() {
    const h = ['ts','kind','message','extra'];
    const rows = debugLog.map(e => [
      e.ts, e.kind,
      '"' + String(e.message || '').replace(/"/g, '""') + '"',
      '"' + String(e.extra || '').replace(/"/g, '""') + '"'
    ]);
    return [h.join(','), ...rows.map(r => r.join(','))].join('\\n');
  }

  /* ── UI panel ────────────────────────────────────────────────────────── */
  function createUI() {
    if (document.getElementById('nexgen-panel-v6')) return;
    const panel = document.createElement('div');
    panel.id = 'nexgen-panel-v6';
    panel.style.cssText = 'position:fixed; bottom:10px; right:10px; width:340px; max-height:92vh; background:#1a1a2e; color:#e0e0e0; border-radius:10px; padding:12px; font-family:Segoe UI,Arial,sans-serif; z-index:999999; box-shadow:0 6px 20px rgba(0,0,0,0.5); border:1px solid #333; overflow-y:auto;';
    panel.innerHTML =
      '<div style="font-weight:bold; font-size:14px; margin-bottom:4px; color:#4ecca3;">NexGen Unified Automator <span style="color:#888; font-size:11px;">v6</span></div>' +
      '<div style="font-size:10px; color:#888; margin-bottom:8px;">' + MASTER_ROWS.length + ' master | ' + SALE_ROWS.length + ' sale | ' + COOL_DATA.length + ' COOL</div>' +
      '<div id="nexgen-status" style="font-size:11px; margin-bottom:6px; min-height:14px; color:#bdc3c7;">Ready</div>' +
      '<div id="nexgen-progress" style="font-size:11px; margin-bottom:8px; color:#888;"></div>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">' +
        '<button id="ng-run" style="padding:8px; background:#27ae60; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Run All</button>' +
        '<button id="ng-stop" style="padding:8px; background:#c0392b; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Stop</button>' +
        '<button id="ng-test" style="padding:8px; background:#2980b9; color:#fff; border:none; border-radius:6px; cursor:pointer;">Test Row 1</button>' +
        '<button id="ng-scan" style="padding:8px; background:#8e44ad; color:#fff; border:none; border-radius:6px; cursor:pointer;">Scan Only</button>' +
        '<button id="ng-dedup" style="padding:8px; background:#d35400; color:#fff; border:none; border-radius:6px; cursor:pointer;">Dedup</button>' +
        '<button id="ng-csv" style="padding:8px; background:#16a085; color:#fff; border:none; border-radius:6px; cursor:pointer;">Log CSV</button>' +
        '<button id="ng-dbg" style="padding:8px; background:#34495e; color:#fff; border:none; border-radius:6px; cursor:pointer; grid-column:1 / span 2;">Debug CSV</button>' +
      '</div>';
    document.body.appendChild(panel);
    document.getElementById('ng-run').addEventListener('click', runAutomation);
    document.getElementById('ng-stop').addEventListener('click', () => { stopRequested = true; log('Stop requested', 'warn'); });
    document.getElementById('ng-test').addEventListener('click', testFirstRow);
    document.getElementById('ng-scan').addEventListener('click', scanAllRows);
    document.getElementById('ng-dedup').addEventListener('click', runDeduplication);
    document.getElementById('ng-csv').addEventListener('click', () => downloadTextFile('nexgen_sign_log.csv', buildLogCsv(), 'text/csv'));
    document.getElementById('ng-dbg').addEventListener('click', () => downloadTextFile('nexgen_debug.csv', buildDebugCsv(), 'text/csv'));
  }

  /* ── boot ────────────────────────────────────────────────────────────── */
  installGlobalDebugHooks();
  loadDatasets();
  buildIndexes();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }
`;

function buildRuntimeScript(masterRows, saleRows, coolRows) {
  const payload = {
    generated_at: new Date().toISOString(),
    master_rows: masterRows,
    sale_rows: saleRows,
    cool_rows: coolRows,
  };
  const header =
    "// ==UserScript==\n" +
    "// @name         NexGen365 Unified Sign Automator\n" +
    "// @namespace    https://nexgen365.com/\n" +
    "// @version      6.1.0\n" +
    "// @description  Generated by NexGen Script Builder\n" +
    "// @match        https://www.nexgen365.com/Create/CreateSigns.aspx*\n" +
    "// @match        https://nexgen365.com/Create/CreateSigns.aspx*\n" +
    "// @grant        none\n" +
    "// @run-at       document-idle\n" +
    "// ==/UserScript==\n\n";
  return header + "(function () {\n  const EMBEDDED = " + JSON.stringify(payload) + ";\n" + RUNTIME_BODY + "\n})();\n";
}

/* ────────────────────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────────────────────── */
export default function NexGenScriptBuilder() {
  const [tab, setTab] = useState("upload");
  const [masterRows, setMasterRows] = useState([]);
  const [saleRows, setSaleRows] = useState([]);
  const [coolRows, setCoolRows] = useState([]);
  const [masterFileName, setMasterFileName] = useState("");
  const [saleFileName, setSaleFileName] = useState("");
  const [coolFileName, setCoolFileName] = useState("");
  const [error, setError] = useState("");

  const generatedScript = useMemo(() => {
    if (!masterRows.length && !saleRows.length && !coolRows.length) return "";
    return buildRuntimeScript(masterRows, saleRows, coolRows);
  }, [masterRows, saleRows, coolRows]);

  const stats = useMemo(() => {
    const hasPlu = masterRows.filter((r) => !!r.item_id).length;
    const organic = masterRows.filter((r) => r.organic_hint).length;
    const coolWithAll = coolRows.filter((r) => r.plu && r.desc && r.cool).length;
    return { hasPlu, organic, coolWithAll };
  }, [masterRows, coolRows]);

  function loadCsvInto(file, parser, normalizer, setRows, setName, label) {
    if (!file) return;
    setError("");
    setName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = parser(String(reader.result || ""));
        const normalized = raw.map((r, i) => normalizer(r, i));
        setRows(normalized);
      } catch (e) {
        setError(label + " CSV parse error: " + (e && e.message ? e.message : String(e)));
      }
    };
    reader.onerror = () => setError("Failed to read " + label + " CSV");
    reader.readAsText(file);
  }

  function downloadScript() {
    if (!generatedScript) return;
    const blob = new Blob([generatedScript], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexgen_sign_automator.user.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function loadSampleData() {
    const m = [
      { item_id: "4011", raw_name: "Bananas", perm_uom: "LB" },
      { item_id: "94011", raw_name: "Organic Bananas", perm_uom: "LB" },
      { item_id: "4225", raw_name: "Avocado Hass", perm_uom: "EA" },
      { item_id: "4065", raw_name: "Green Bell Pepper", perm_uom: "EA" },
      { item_id: "4688", raw_name: "Red Tomato on Vine", perm_uom: "LB" },
    ].map((r, i) => normalizeMasterRow(r, i));
    const s = [
      { item_id: "4225", raw_name: "Avocado Hass", sale_type: "BOGO", sale_qty: "2", sale_amount: "2.00", price_unit: "EA", sign_price: "1.00", raw_promo_text: "2/$2" },
      { item_id: "4011", raw_name: "Bananas", sale_type: "REG_SALE", sign_price: "0.49", price_unit: "LB", raw_promo_text: "Sale 49¢/lb" },
    ].map((r, i) => normalizeSaleRow(r, i));
    const c = [
      { plu: "4011", desc: "BANANAS", cool: "GUATEMALA" },
      { plu: "94011", desc: "ORGANIC BANANAS", cool: "ECUADOR" },
      { plu: "4225", desc: "AVOCADO HASS", cool: "MEXICO" },
      { plu: "4065", desc: "GREEN BELL PEPPER", cool: "USA" },
      { plu: "4688", desc: "TOMATO ON VINE", cool: "CANADA" },
    ];
    setMasterRows(m); setSaleRows(s); setCoolRows(c);
    setMasterFileName("sample_master.csv");
    setSaleFileName("sample_sale.csv");
    setCoolFileName("sample_cool.csv");
    setError("");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-emerald-400" />
              NexGen Sign Script Builder
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Upload master + sale + COOL data, preview, and generate a Tampermonkey userscript with the full perm workflow embedded.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>v6.1.0</Badge>
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              <Database className="w-4 h-4" />
              Load sample
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-700 bg-rose-950/40 p-3 text-sm text-rose-200">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<ListChecks className="w-4 h-4" />} label="Master rows" value={masterRows.length} />
          <StatCard icon={<Tag className="w-4 h-4" />} label="Sale rows" value={saleRows.length} />
          <StatCard icon={<Database className="w-4 h-4" />} label="COOL rows" value={stats.coolWithAll} />
          <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Organic hints" value={stats.organic} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="upload">1. Upload</TabsTrigger>
            <TabsTrigger value="preview">2. Preview</TabsTrigger>
            <TabsTrigger value="generate">3. Generate</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>

          {/* Upload tab */}
          <TabsContent value="upload">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Upload className="w-4 h-4" /> Master CSV</CardTitle>
                  <CardDescription>Perm data. Columns: item_id/plu, raw_name, perm_uom/sold_by.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <FileInput accept=".csv,text/csv" label="Choose master CSV"
                    onChange={(f) => loadCsvInto(f, parseCsv, normalizeMasterRow, setMasterRows, setMasterFileName, "Master")} />
                  {masterFileName && <p className="text-xs text-emerald-400">{masterFileName} ({masterRows.length} rows)</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Tag className="w-4 h-4" /> Sale CSV</CardTitle>
                  <CardDescription>Weekly sale data. Columns: item_id, sale_type, sale_qty, sale_amount, price_unit, sign_price, raw_promo_text.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <FileInput accept=".csv,text/csv" label="Choose sale CSV"
                    onChange={(f) => loadCsvInto(f, parseCsv, normalizeSaleRow, setSaleRows, setSaleFileName, "Sale")} />
                  {saleFileName && <p className="text-xs text-emerald-400">{saleFileName} ({saleRows.length} rows)</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Database className="w-4 h-4" /> COOL CSV</CardTitle>
                  <CardDescription>Country-of-origin. Columns: plu, description, cool. Header row auto-detected.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <FileInput accept=".csv,text/csv" label="Choose COOL CSV"
                    onChange={(f) => loadCsvInto(f, parseCoolCsv, normalizeCoolRow, setCoolRows, setCoolFileName, "COOL")} />
                  {coolFileName && <p className="text-xs text-emerald-400">{coolFileName} ({coolRows.length} rows)</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preview tab */}
          <TabsContent value="preview">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Master rows (first 20)</CardTitle></CardHeader>
                <CardContent>
                  <PreviewTable rows={masterRows.slice(0, 20)} columns={["item_id","raw_name","perm_uom","organic_hint"]} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Sale rows (first 20)</CardTitle></CardHeader>
                <CardContent>
                  <PreviewTable rows={saleRows.slice(0, 20)} columns={["item_id","sign_desc_candidate","sale_type","sale_qty","sale_amount","sign_price","raw_promo_text"]} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>COOL rows (first 20)</CardTitle></CardHeader>
                <CardContent>
                  <PreviewTable rows={coolRows.slice(0, 20)} columns={["plu","desc","cool"]} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Generate tab */}
          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Download className="w-4 h-4" /> Generated userscript</CardTitle>
                <CardDescription>
                  Embeds {masterRows.length} master + {saleRows.length} sale + {coolRows.length} COOL rows. Install via Tampermonkey or download the .user.js file.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={downloadScript} disabled={!generatedScript}>
                    <Download className="w-4 h-4" /> Download .user.js
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard && generatedScript && navigator.clipboard.writeText(generatedScript)}
                    disabled={!generatedScript}
                  >
                    Copy to clipboard
                  </Button>
                </div>
                <Textarea rows={20} readOnly value={generatedScript || "// Upload CSVs (or click 'Load sample') to generate the script."} />
                <p className="text-xs text-slate-500">
                  Script size: {generatedScript ? (generatedScript.length / 1024).toFixed(1) + " KB" : "—"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roadmap tab */}
          <TabsContent value="roadmap">
            <div className="grid md:grid-cols-3 gap-4">
              {ROADMAP.map((p) => (
                <Card key={p.phase}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {p.status === "done" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : p.status === "next" ? (
                        <Clock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500" />
                      )}
                      {p.phase}
                    </CardTitle>
                    <CardDescription>{p.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
                      {p.items.map((it, i) => <li key={i}>{it}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wide">
        {icon}{label}
      </div>
      <div className="text-2xl font-semibold mt-1 text-slate-100">{value}</div>
    </div>
  );
}

function PreviewTable({ rows, columns }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No data yet. Upload a CSV on the Upload tab.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="w-full text-xs">
        <thead className="bg-slate-800 text-slate-300">
          <tr>{columns.map((c) => <th key={c} className="text-left px-3 py-2 font-medium">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/10"}>
              {columns.map((c) => (
                <td key={c} className="px-3 py-1.5 text-slate-200 whitespace-nowrap">
                  {typeof r[c] === "boolean" ? (r[c] ? "Y" : "") : String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
