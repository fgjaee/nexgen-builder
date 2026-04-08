// ==UserScript==
// @name         NexGen365 Sign Automator v5.2
// @namespace    https://nexgen365.com/
// @version      5.2.0
// @description  Full automation: smart UOM, COOL matching, dedup, skip completed rows, run log
// @match        https://www.nexgen365.com/Create/CreateSigns.aspx*
// @match        https://nexgen365.com/Create/CreateSigns.aspx*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ==================== CONFIG ====================
    const CONFIG = {
        COL_UPC: 4,
        COL_TAG_DESC: 5,
        COL_DELETE: 1,
        AJAX_TIMEOUT: 20000,
        EDITFORM_TIMEOUT: 10000,
        POST_SAVE_DELAY: 800,
        POST_DELETE_DELAY: 1000,
    };

    // ==================== COOL DATA (from CSV 2026-03-29) ====================
    // Stored as array with descriptions for fuzzy matching when PLU→UPC changes
    const COOL_DATA = [
        { plu: "3040", desc: "DRAGON FRUIT", cool: "USA, ECUADOR" },
        { plu: "4062", desc: "CUCUMBERS", cool: "MEXICO" },
        { plu: "4596", desc: "SALAD CUCUMBERS", cool: "MEXICO" },
        { plu: "4081", desc: "EGGPLANT", cool: "MEXICO" },
        { plu: "4729", desc: "LPC MEDLEY POTATOES BULK", cool: "Canada" },
        { plu: "4750", desc: "ACORN SQUASH", cool: "MEXICO" },
        { plu: "4759", desc: "BUTTERNUT SQUASH", cool: "MEXICO" },
        { plu: "4781", desc: "GREY SQUASH", cool: "MEXICO" },
        { plu: "4758", desc: "KABOCHA (BUTTERCUP) SQUASH", cool: "MEXICO" },
        { plu: "4776", desc: "SPAGHETTI SQUASH", cool: "MEXICO" },
        { plu: "4086", desc: "SUMMER SQUASH", cool: "MEXICO" },
        { plu: "4067", desc: "ZUCCHINI SQUASH", cool: "MEXICO" },
        { plu: "4066", desc: "GREEN BEANS", cool: "USA, Mexico" },
        { plu: "4608", desc: "GARLIC LARGE", cool: "USA, Argentina,Spain" },
        { plu: "4082", desc: "RED ONIONS BULK", cool: "USA" },
        { plu: "4662", desc: "SHALLOTS BULK", cool: "USA" },
        { plu: "4093", desc: "SPANISH ONION", cool: "USA" },
        { plu: "4166", desc: "SWEET ONION BULK LB", cool: "USA" },
        { plu: "4663", desc: "WHITE ONIONS BULK", cool: "USA" },
        { plu: "4677", desc: "ANAHEIM PEPPERS", cool: "USA, MEXICO" },
        { plu: "4687", desc: "CUBANELLE PEPPERS", cool: "USA, MEXICO" },
        { plu: "4065", desc: "GREEN BELL PEPPER", cool: "USA, Mexico" },
        { plu: "4690", desc: "HUNGARIAN YELLOW HOT'S", cool: "USA, MEXICO" },
        { plu: "4693", desc: "JALAPENO PEPPERS", cool: "USA, MEXICO" },
        { plu: "4705", desc: "POBLANO PEPPERS", cool: "USA, MEXICO" },
        { plu: "3180", desc: "RED FRESNO PEPPERS", cool: "USA, MEXICO" },
        { plu: "4709", desc: "SERRANO PEPPERS", cool: "USA, MEXICO" },
        { plu: "4801", desc: "TOMATILLOS", cool: "USA, MEXICO" },
        { plu: "4772", desc: "YELLOW CARIBE PEPPERS", cool: "USA, MEXICO" },
        { plu: "4073", desc: "BULK RED POTATOES", cool: "USA" },
        { plu: "4072", desc: "BULK RUSSET POTATOES", cool: "USA" },
        { plu: "3333", desc: "JAPANESE SWEET POTATOES", cool: "USA" },
        { plu: "4074", desc: "RED SWEET POTATOES BULK LB", cool: "USA" },
        { plu: "4091", desc: "SWEET POTATOES", cool: "USA" },
        { plu: "4727", desc: "YELLOW POTATOES BULK LB", cool: "USA" },
        { plu: "4087", desc: "ROMA TOMATOES", cool: "USA, MEXICO, CANADA" },
        { plu: "4545", desc: "BOK CHOY", cool: "USA" },
        { plu: "4632", desc: "BOSTON LETTUCE", cool: "USA" },
        { plu: "4540", desc: "BULK BEETS", cool: "USA" },
        { plu: "4562", desc: "BULK CARROTS", cool: "USA, Canada" },
        { plu: "4672", desc: "BULK PARSNIPS", cool: "USA" },
        { plu: "4742", desc: "BULK RADISHES", cool: "USA" },
        { plu: "4813", desc: "BULK TURNIPS", cool: "USA" },
        { plu: "4069", desc: "CABBAGE", cool: "USA" },
        { plu: "4659", desc: "CEBOLLITAS BUNCH", cool: "MEXICO" },
        { plu: "4604", desc: "ENDIVE LETTUCE", cool: "USA" },
        { plu: "4605", desc: "ESCAROLE LB", cool: "USA" },
        { plu: "4515", desc: "FENNEL ANISE EA", cool: "USA" },
        { plu: "4612", desc: "GINGER ROOT", cool: "Peru" },
        { plu: "4068", desc: "GREEN ONIONS BUNCH", cool: "USA, Mexico" },
        { plu: "4552", desc: "NAPPA", cool: "USA" },
        { plu: "4671", desc: "PARSLEY ROOT", cool: "MEXICO, USA" },
        { plu: "4554", desc: "RED CABBAGE", cool: "USA" },
        { plu: "4747", desc: "RUTABAGAS", cool: "USA, Canada" },
        { plu: "4555", desc: "SAVOY CABBAGE LB", cool: "USA" },
        { plu: "4092", desc: "SNOW PEAS", cool: "Guatemala, Peru" },
        { plu: "4675", desc: "SUGAR SNAP PEAS", cool: "Guatemala,Peru" },
        { plu: "4599", desc: "BABY EGGPLANT", cool: "Canada/Holland/Spain" },
        { plu: "4528", desc: "FAVA BEANS", cool: "Mexico" },
        { plu: "4827", desc: "INDIAN EGGPLANT", cool: "USA, Mexico, and Honduras" },
        { plu: "4078", desc: "SWEET CORN EACH", cool: "USA" },
        { plu: "3133", desc: "CASPER PUMPKIN EA", cool: "Canada" },
        { plu: "4735", desc: "FFM JACK-O-LANTERN PUMPKIN LARGE EA", cool: "USA" },
        { plu: "4480", desc: "FFM ORNAMENTAL HEIRLOOM PUMPKIN EA", cool: "USA" },
        { plu: "3134", desc: "FFM PIE PUMPKIN EA", cool: "USA, Canada" },
        { plu: "4787", desc: "GOURDS 10 CT BAG", cool: "USA, Canada" },
        { plu: "4820", desc: "GOURDS EA", cool: "USA, Canada" },
        { plu: "4734", desc: "MINI PUMPKIN EA", cool: "USA, Canada" },
        { plu: "3233", desc: "TIGER STRIPED PUMPKIN EA", cool: "USA, Canada" },
        { plu: "3132", desc: "WHITE PUMPKIN EA", cool: "USA" },
        { plu: "4159", desc: "VIDALIA ONIONS", cool: "USA" },
        { plu: "4818", desc: "WHITE YAMS", cool: "USA" },
        { plu: "3127", desc: "POMEGRANATES", cool: "Israeli" },
        { plu: "4508", desc: "INDIAN BITTER MELON", cool: "HONDURUS, MEXICO, USA" },
        { plu: "4910", desc: "METHI LEAVES", cool: "USA" },
        { plu: "4745", desc: "RHUBARB", cool: "USA" },
        { plu: "4791", desc: "SUNCHOKES", cool: "USA" },
        { plu: "4848", desc: "TINDORA LB", cool: "DOMINCAN REPUBLIC" },
        { plu: "4527", desc: "CHINESE LONGBEAN", cool: "Mexico" },
    ];

    // Build PLU index for fast exact lookups
    const COOL_BY_PLU = new Map();
    COOL_DATA.forEach(entry => COOL_BY_PLU.set(normalizePlu(entry.plu), entry));


function normalizePlu(value) {
    return String(value || '').replace(/[^0-9]/g, '').trim();
}

function normalizeDesc(value) {
    return String(value || '').toUpperCase().replace(/\s+/g, ' ').trim();
}

function isOrganicItem(upc, desc) {
    const plu = normalizePlu(upc);
    const upper = normalizeDesc(desc);
    return (plu.length === 5 && plu.startsWith('9')) || /\bORGANIC\b|\bORG\b/.test(upper);
}

const UOM_PLU_OVERRIDES = new Map([
    ['3040', 'EA'],
    ['4062', 'EA'],
    ['4596', 'EA'],
    ['4081', 'EA'],
    ['4750', 'EA'],
    ['4759', 'EA'],
    ['4781', 'EA'],
    ['4758', 'EA'],
    ['4776', 'EA'],
    ['4086', 'EA'],
    ['4067', 'EA'],
    ['4608', 'EA'],
    ['4632', 'EA'],
    ['4545', 'EA'],
    ['4604', 'EA'],
    ['4515', 'EA'],
    ['4068', 'EA'],
    ['3133', 'EA'],
    ['4735', 'EA'],
    ['4480', 'EA'],
    ['3134', 'EA'],
    ['4787', 'EA'],
    ['4820', 'EA'],
    ['4734', 'EA'],
    ['3233', 'EA'],
    ['3132', 'EA'],
    ['4159', 'EA'],
]);

const UOM_DESC_OVERRIDES = [
    [/\bCUCUMBERS?\b/, 'EA'],
    [/\bSALAD\s+CUCUMBERS?\b/, 'EA'],
    [/\bDRAGON\s+FRUITS?\b/, 'EA'],
    [/\bEGGPLANT\b/, 'EA'],
    [/\b(BOSTON|ENDIVE)\s+LETTUCE\b/, 'EA'],
    [/\bBOK\s+CHOY\b/, 'EA'],
    [/\bGREEN\s+ONIONS?\s+BUNCH\b/, 'EA'],
    [/\bCEBOLLITAS?\s+BUNCH\b/, 'EA'],
    [/\bFENNEL\b/, 'EA'],
    [/\bVIDALIA\s+ONIONS?\b/, 'EA'],
    [/\bPUMPKINS?\b/, 'EA'],
    [/\bGOURDS?\b/, 'EA'],
    [/\bSQUASH\b/, 'EA'],
    [/\bZUCCHINI\s+SQUASH\b/, 'EA'],
    [/\bSUMMER\s+SQUASH\b/, 'EA'],
    [/\bSPAGHETTI\s+SQUASH\b/, 'EA'],
    [/\bACORN\s+SQUASH\b/, 'EA'],
    [/\bBUTTERNUT\s+SQUASH\b/, 'EA'],
    [/\bKABOCHA\b/, 'EA'],
    [/\bGREY\s+SQUASH\b/, 'EA'],
    [/\bGARLIC\b/, 'EA'],
];

    // ==================== COOL MATCHING ENGINE ====================

    function coolNormalize(str) {
        return str.toUpperCase()
            .replace(/[^A-Z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function coolGetWords(str) {
        const stopWords = new Set(['THE', 'A', 'AN', 'AND', 'OR', 'OF', 'IN', 'FOR', 'WITH']);
        return coolNormalize(str).split(' ').filter(w => w.length > 0 && !stopWords.has(w));
    }

    function coolSimilarity(gridDesc, coolDesc) {
        const gNorm = coolNormalize(gridDesc);
        const cNorm = coolNormalize(coolDesc);

        // Exact match after normalization
        if (gNorm === cNorm) return 1.0;

        // One contains the other fully
        if (gNorm.includes(cNorm) || cNorm.includes(gNorm)) return 0.9;

        // Word overlap score
        const gWords = coolGetWords(gridDesc);
        const cWords = coolGetWords(coolDesc);

        if (gWords.length === 0 || cWords.length === 0) return 0;

        let matchCount = 0;
        const cUsed = new Set();

        for (const gw of gWords) {
            for (let i = 0; i < cWords.length; i++) {
                if (cUsed.has(i)) continue;
                const cw = cWords[i];
                // Exact word match
                if (gw === cw) { matchCount++; cUsed.add(i); break; }
                // Prefix match (CUCUMBER↔CUCUMBERS, TOMATO↔TOMATOES)
                if ((gw.startsWith(cw) || cw.startsWith(gw)) && Math.min(gw.length, cw.length) >= 4) {
                    matchCount += 0.9; cUsed.add(i); break;
                }
            }
        }

        return matchCount / Math.max(gWords.length, cWords.length);
    }

    function findCool(upc, desc) {
        // Strategy 1: Exact PLU/UPC match (fast path)
        const pluMatch = COOL_BY_PLU.get(normalizePlu(upc));
        if (pluMatch) return { cool: pluMatch.cool, method: 'PLU', score: 1.0, matched: pluMatch.desc };

        // Strategy 2: Fuzzy description match (handles PLU→UPC changes)
        let bestMatch = null;
        let bestScore = 0;

        for (const entry of COOL_DATA) {
            const score = coolSimilarity(desc, entry.desc);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = entry;
            }
        }

        // Threshold: 0.6 minimum similarity
        if (bestMatch && bestScore >= 0.6) {
            return { cool: bestMatch.cool, method: 'DESC', score: bestScore, matched: bestMatch.desc };
        }

        return null;
    }

    // ==================================================================
    //     COMPREHENSIVE UOM RULES ENGINE v2 (plural-safe)
    // ==================================================================
    //
    // Priority order:
    //   0. Exact PLU overrides
    //   1. Exact description overrides
    //   2. Explicit packaging keywords in description → EA
    //   3. Explicit BULK / LB keywords → LB
    //   4. Specific EA items (by name pattern, plural-safe)
    //   5. Specific LB items / category patterns
    //   6. null (leave blank if truly unknown)
    // ==================================================================

    function getUomFromDescription(desc, upc = '') {
        const plu = normalizePlu(upc);
        if (plu && UOM_PLU_OVERRIDES.has(plu)) return UOM_PLU_OVERRIDES.get(plu);

        if (!desc) return null;
        const upper = normalizeDesc(desc);

        for (const [rx, value] of UOM_DESC_OVERRIDES) {
            if (rx.test(upper)) return value;
        }

        // ── RULE 0: FFM / Frederik's items → always packaged EA ──
        if (/\b(FFM|FREDERIKS?|FREDERICKS?|FRESH\s*FROM\s*MEIJER)\b/.test(upper)) return 'EA';

        // ── RULE 1: Explicit packaging keywords → EA ──
        if (/\b(EA|EACH)\b/.test(upper)) return 'EA';
        if (/\bBUNCH(ES)?\b/.test(upper)) return 'EA';
        if (/\d+\s*(CT|COUNT)\b/.test(upper)) return 'EA';
        if (/\d+\s*(OZ|FL\s*OZ)\b/.test(upper)) return 'EA';
        if (/\d+\s*PK\b/.test(upper)) return 'EA';
        if (/\b(BAG|PKG|PACK|CLAMSHELL|TRAY|SLEEVE|CONTAINER|PINT|BASKET)\b/.test(upper)) return 'EA';
        if (/\b(KIT|MIX)\b/.test(upper) && /\b(SALAD|STIR\s*FRY)\b/.test(upper)) return 'EA';

        // ── RULE 2: LB handling ──
        // NUMBER + LB = package weight → EA (e.g. "BABY CUT CARROTS 1 LB", "CLEMENTINE MANDARINS 3 LB")
        if (/\d+\s*LB\b/.test(upper)) return 'EA';
        // Plain LB without a number = sold by the pound (e.g. "CABBAGE GREEN LB", "ESCAROLE LB")
        if (/\bLB\b/.test(upper)) return 'LB';
        // BULK usually means by weight, but not for known EA overrides already handled above
        if (/\bBULK\b/.test(upper)) return 'LB';
        if (/\bPER\s*POUND\b/.test(upper)) return 'LB';

        // ── RULE 3: Specific EA items ──

        // Berries (always packaged)
        if (/\b(STRAWBERR|BLUEBERR|RASPBERR|BLACKBERR|BOYSENBERR|CRANBERR|HUCKLEBERR)/.test(upper)) return 'EA';

        // Herbs (bunches)
        if (/\b(CILANTRO|PARSLEY|DILL|BASIL|MINT|ROSEMARY|THYME|SAGE|OREGANO|CHIVES?|TARRAGON|MARJORAM|LEMONGRASS)\b/.test(upper)) return 'EA';

        // Greens sold as bunches (NOT cabbage/lettuce)
        if (/\b(COLLARDS?|KALE|TURNIP\s*GREENS?|MUSTARD\s*GREENS?|DANDELION|SWISS\s*CHARD|CHARD)\b/.test(upper)) return 'EA';

        // Bagged salads & salad kits
        if (/\b(SALADS?|SLAW|COLESLAW|SPRING\s*MIX|POWER\s*GREENS?|SPINACH)\b/.test(upper)) {
            if (/\b(BABY|ORGANIC|TRIPLE\s*WASH|WASHED|POWER|CHOPPED|HEARTS)\b/.test(upper)) return 'EA';
            if (/\bSALADS?\b/.test(upper)) return 'EA';
        }

        // Individual EA items
        if (/\bAVOCADOS?\b/.test(upper)) return 'EA';

        // Citrus
        if (/\b(LEMONS?|LIMES?|ORANGES?|GRAPEFRUITS?|TANGERINES?|TANGELOS?|CLEMENTINES?|MANDARINS?|SATSUMAS?|BLOOD\s*ORANGES?|CARA\s*CARA|NAVELS?|VALENCIAS?|MEYER|KEY\s*LIMES?|POMELOS?|UGLI\s*FRUIT|MINNEOLAS?)\b/.test(upper)) return 'EA';

        // Melons
        if (/\b(MELONS?|WATERMELONS?|CANTALOUPES?|HONEYDEWS?|CANARY|CASABA|CRENSHAW|GALIA|SHARLYN)\b/.test(upper)) return 'EA';

        // Other EA fruits
        if (/\bPINEAPPLES?\b/.test(upper)) return 'EA';
        if (/\bMANGO(S|ES)?\b/.test(upper)) return 'EA';
        if (/\bCOCONUTS?\b/.test(upper)) return 'EA';
        if (/\bKIWIS?\b/.test(upper)) return 'EA';
        if (/\bPOMEGRANATES?\b/.test(upper)) return 'EA';
        if (/\bPAPAYAS?\b/.test(upper)) return 'EA';
        if (/\bPASSION\s*FRUITS?\b/.test(upper)) return 'EA';
        if (/\bSTAR\s*FRUITS?\b/.test(upper)) return 'EA';
        if (/\bGUAVAS?\b/.test(upper)) return 'EA';
        if (/\bPERSIMMONS?\b/.test(upper)) return 'EA';
        if (/\bJACKFRUITS?\b/.test(upper)) return 'EA';
        if (/\b(CACTUS\s*PEARS?|PRICKLY\s*PEARS?)\b/.test(upper)) return 'EA';

        // Corn
        if (/\b(CORN|SWEET\s*CORN)\b/.test(upper) && !/\bBABY\s*CORN\b/.test(upper)) return 'EA';

        // Named onion varieties → EA
        if (/\b(VIDALIA|SPANISH|SWEET)\b/.test(upper) && /\bONIONS?\b/.test(upper) && !/\bBULK\b/.test(upper)) return 'EA';
        if (/\b(GREEN\s*ONIONS?|SCALLIONS?|CEBOLLITAS?)\b/.test(upper)) return 'EA';

        // Vegetables sold EA
        if (/\bCELERY\b/.test(upper)) return 'EA';
        if (/\b(BROCCOLI|CAULIFLOWER)\b/.test(upper) && !/\bFLORETS?\b/.test(upper)) return 'EA';
        if (/\bBRUSSEL/.test(upper)) return 'EA';
        if (/\bARTICHOKES?\b/.test(upper)) return 'EA';
        if (/\bPLANTAINS?\b/.test(upper)) return 'EA';
        if (/\bASPARAGUS\b/.test(upper)) return 'EA';

        // Lettuce heads → EA
        if (/\b(ROMAINE|ICEBERG|BUTTER\s*LETTUCE|BOSTON\s*LETTUCE|GREEN\s*LEAF|RED\s*LEAF|BIBB)\b/.test(upper)) return 'EA';
        if (/\bLETTUCE\b/.test(upper) && !/\bSALAD\b/.test(upper)) return 'EA';

        // ── RULE 4: Category LB patterns ──

        if (/\bRHUBARB\b/.test(upper)) return 'LB';

        // Peppers: bell → EA, all others → LB
        if (/\bPEPPERS?\b/.test(upper)) {
            if (/\bBELL\b/.test(upper)) return 'EA';
            return 'LB';
        }

        // Root vegetables
        if (/\b(POTATOES?|YAMS?|SWEET\s*POTATOES?|GINGER|BEETS?|CARROTS?|PARSNIPS?|RADISH(ES)?|TURNIPS?|RUTABAGAS?|SUNCHOKES?|JICAMAS?|TARO|YUCA|CASSAVA|HORSERADISH|CELERY\s*ROOT|CELERIAC|DAIKON|TURMERIC)\b/.test(upper)) return 'LB';

        // Cabbage family → LB
        if (/\bCABBAGE\b/.test(upper)) return 'LB';
        if (/\bNAPPA\b/.test(upper)) return 'LB';

        // Tomatoes → LB
        if (/\bTOMATO(ES)?\b/.test(upper)) return 'LB';
        if (/\bTOMATILLOS?\b/.test(upper)) return 'LB';

        // Fruits sold LB
        if (/\bAPPLES?\b/.test(upper) && !/\bPINEAPPLE\b/.test(upper)) return 'LB';
        if (/\bGRAPES?\b/.test(upper) && !/\bGRAPEFRUIT\b/.test(upper)) return 'LB';
        if (/\bBANANAS?\b/.test(upper) && !/\bPLANTAIN\b/.test(upper)) return 'LB';
        if (/\bPEARS?\b/.test(upper) && !/\bPRICKLY\b/.test(upper) && !/\bCACTUS\b/.test(upper)) return 'LB';
        if (/\b(PEACH(ES)?|NECTARINES?|PLUMS?|APRICOTS?|CHERR(Y|IES))\b/.test(upper)) return 'LB';

        // Beans / peas (loose)
        if (/\b(GREEN\s*BEANS?|SNAP\s*BEANS?|WAX\s*BEANS?|STRING\s*BEANS?|FAVA|LONGBEANS?|SNOW\s*PEAS?|SUGAR\s*SNAPS?|ENGLISH\s*PEAS?)\b/.test(upper)) return 'LB';

        if (/\bOKRA\b/.test(upper)) return 'LB';
        if (/\bMUSHROOMS?\b/.test(upper) && !/\b(PKG|OZ|PACK|SLICED)\b/.test(upper)) return 'LB';
        if (/\b(ENDIVE|ESCAROLE)\b/.test(upper)) return 'LB';
        if (/\b(BITTER\s*MELONS?|TINDORA|METHI|KARELA)\b/.test(upper)) return 'LB';
        if (/\bPARSLEY\s*ROOT\b/.test(upper)) return 'LB';

        // Onions (generic fallback) → LB
        if (/\bONIONS?\b/.test(upper)) return 'LB';

        // Broccoli/cauliflower crowns/florets that didn't match EA above → LB
        if (/\b(BROCCOLI|CAULIFLOWER)\b/.test(upper)) return 'LB';

        // ── RULE 5: No match → leave blank ──
        return null;
    }

    // ==================== LOGGING ====================
    function log(msg, level = 'info') {
        const prefix = `[NexGen v5.2] ${new Date().toLocaleTimeString()}`;
        if (level === 'error') console.error(prefix, msg);
        else if (level === 'warn') console.warn(prefix, msg);
        else console.log(prefix, msg);

        const statusEl = document.getElementById('nexgen-status');
        if (statusEl) {
            statusEl.textContent = msg;
            statusEl.style.color =
                level === 'error' ? '#e74c3c' :
                level === 'warn' ? '#f1c40f' : '#bdc3c7';
        }
    }

    function updateProgress(text) {
        const progEl = document.getElementById('nexgen-progress');
        if (progEl) progEl.textContent = text;
    }

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // ==================== DATE UTILITY ====================
    function getStartDate() {
        const today = new Date();
        const dow = today.getDay();
        let target = new Date(today);
        if (dow === 3) {}
        else if (dow > 3) target.setDate(today.getDate() - (dow - 3));
        else target.setDate(today.getDate() - (dow + 4));
        return (target.getMonth() + 1) + '/' + target.getDate() + '/' + target.getFullYear();
    }

    // ==================== WAIT FOR AJAX ====================
    function waitForAjax(timeout = CONFIG.AJAX_TIMEOUT) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                if (Date.now() - start > timeout) { resolve(); return; }
                let busy = false;
                try {
                    if (window.Sys?.WebForms?.PageRequestManager) {
                        const prm = window.Sys.WebForms.PageRequestManager.getInstance();
                        if (prm?.get_isInAsyncPostBack()) busy = true;
                    }
                } catch (e) {}
                if (!busy) {
                    const loaders = document.querySelectorAll(
                        '[id*="LoadingPanel"], .raDiv, .rgLoading, .RadAjax_Loading, [id*="AjaxLoadingPanel"]'
                    );
                    for (const loader of loaders) {
                        const style = window.getComputedStyle(loader);
                        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') { busy = true; break; }
                    }
                }
                if (busy) setTimeout(check, 200);
                else setTimeout(resolve, 400);
            };
            setTimeout(check, 500);
        });
    }

    function waitForEditForm(timeout = CONFIG.EDITFORM_TIMEOUT) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const ef = document.querySelector('.rgEditRow') || document.querySelector('tr[id*="EditForm"]') || document.querySelector('.rgEditForm');
                if (!ef) {
                    const fields = document.querySelector('[id*="radGridStaging"] input[id*="StartDate"], [id*="radGridStaging"] textarea[id*="Sgn_Dsc"]');
                    if (fields) { resolve(fields.closest('tr') || fields.closest('.rgEditForm')); return; }
                }
                if (ef) { resolve(ef); return; }
                if (Date.now() - start > timeout) { resolve(null); return; }
                setTimeout(check, 300);
            };
            check();
        });
    }

    function waitForEditFormClose(timeout = 8000) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const ef = document.querySelector('.rgEditRow') || document.querySelector('tr[id*="EditForm"]') || document.querySelector('.rgEditForm');
                if (!ef) { resolve(true); return; }
                if (Date.now() - start > timeout) { resolve(false); return; }
                setTimeout(check, 300);
            };
            setTimeout(check, 500);
        });
    }

    // ==================== GET GRID ROWS ====================
    function getRows() {
        const selectors = [
            '[id*="radGridStaging"] .rgDataDiv table tbody tr.rgRow, [id*="radGridStaging"] .rgDataDiv table tbody tr.rgAltRow',
            '[id*="radGridStaging"] .rgMasterTable tbody tr.rgRow, [id*="radGridStaging"] .rgMasterTable tbody tr.rgAltRow',
            '[id*="RadGrid"] .rgDataDiv table tbody tr.rgRow, [id*="RadGrid"] .rgDataDiv table tbody tr.rgAltRow',
        ];
        for (const sel of selectors) {
            const rows = document.querySelectorAll(sel);
            if (rows.length > 0) return Array.from(rows);
        }
        return Array.from(document.querySelectorAll('tr.rgRow, tr.rgAltRow'));
    }

    function parseRow(row) {
        if (!row?.cells || row.cells.length < 6) return null;
        return {
            upc: row.cells[CONFIG.COL_UPC]?.textContent?.trim() || '',
            desc: row.cells[CONFIG.COL_TAG_DESC]?.textContent?.trim() || '',
        };
    }

    // ==================================================================
    //                    DEDUPLICATION
    // ==================================================================

    function findDuplicates() {
        const rows = getRows();
        const seen = new Map(); // normalized description → first index
        const dupeIndices = [];
        rows.forEach((row, idx) => {
            const parsed = parseRow(row);
            if (!parsed) return;

            // Dedup by DESCRIPTION, not UPC
            // Multiple UPCs can represent the same product (e.g. 50+ grape UPCs)
            // We only need one sign per unique description
            const normDesc = (parsed.desc || '').toUpperCase().replace(/\s+/g, ' ').trim();
            if (!normDesc) return;

            if (seen.has(normDesc)) {
                dupeIndices.push({ idx, upc: parsed.upc, desc: parsed.desc, row });
            } else {
                seen.set(normDesc, idx);
            }
        });
        return dupeIndices;
    }

    function findDeleteButton(row) {
        if (!row) return null;
        const deleteCell = row.cells?.[CONFIG.COL_DELETE];
        if (deleteCell) {
            const btn = deleteCell.querySelector('input[type="image"]') || deleteCell.querySelector('a') || deleteCell.querySelector('img') || deleteCell.querySelector('button') || deleteCell.querySelector('[onclick]');
            if (btn) return btn;
        }
        const selectors = ['input[id*="DeleteButton"]', 'input[type="image"][alt*="Delete" i]', 'input[type="image"][src*="delete" i]', 'a[id*="DeleteButton"]', 'img[src*="delete" i]'];
        for (const sel of selectors) { const el = row.querySelector(sel); if (el) return el; }
        return null;
    }

    async function triggerDelete(row, rowIndex) {
        const deleteBtn = findDeleteButton(row);
        if (!deleteBtn) { log(`Delete btn not found row ${rowIndex}`, 'error'); return false; }

        const onclick = deleteBtn.getAttribute('onclick') || '';
        const href = deleteBtn.getAttribute('href') || deleteBtn.parentElement?.getAttribute('href') || '';
        const parentLink = deleteBtn.closest('a');
        const parentHref = parentLink?.getAttribute('href') || '';
        const allSources = onclick + ' ' + href + ' ' + parentHref;
        const match = allSources.match(/__doPostBack\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/);

        if (match && window.__doPostBack) {
            window.__doPostBack(match[1], match[2]);
            return true;
        }

        try {
            const gridElements = document.querySelectorAll('[id*="radGridStaging"], [id*="RadGrid"]');
            for (const gridEl of gridElements) {
                const gridObj = window.$find?.(gridEl.id);
                if (gridObj?.get_masterTableView) {
                    const mtv = gridObj.get_masterTableView();
                    const dataItems = mtv.get_dataItems();
                    if (dataItems && dataItems.length > rowIndex) { mtv.fireCommand('Delete', dataItems[rowIndex].get_itemIndex()); return true; }
                }
            }
        } catch (e) {}

        deleteBtn.click();
        return true;
    }

    async function runDeduplication() {
        log('🔍 Scanning for duplicate descriptions...');
        let totalRemoved = 0;
        let maxPasses = 500; // Produce can have 100+ UPCs per item (e.g. grapes)

        while (maxPasses-- > 0) {
            if (stopRequested) { log('🛑 Dedup stopped'); break; }

            const dupes = findDuplicates();
            if (dupes.length === 0) break;

            const dupe = dupes[dupes.length - 1];
            log(`Removing dupe [${totalRemoved + 1}]: "${dupe.desc}" UPC:${dupe.upc} (row ${dupe.idx + 1})`);

            const origConfirm = window.confirm;
            window.confirm = () => true;
            const deleted = await triggerDelete(dupe.row, dupe.idx);
            window.confirm = origConfirm;

            if (!deleted) { log(`Failed to delete row ${dupe.idx + 1}`, 'error'); break; }

            await waitForAjax();
            await sleep(CONFIG.POST_DELETE_DELAY);
            totalRemoved++;
            updateProgress(`Dedup: removed ${totalRemoved} (${dupes.length - 1} remaining)...`);
        }

        const remaining = getRows().length;
        log(totalRemoved > 0 ? `✅ Dedup: removed ${totalRemoved} duplicates, ${remaining} unique rows remain` : '✅ No duplicates found');
        return totalRemoved;
    }

    // ==================================================================
    //                    EDIT / FILL
    // ==================================================================

    async function triggerEdit(row, rowIndex) {
        try {
            const gridElements = document.querySelectorAll('[id*="radGridStaging"], [id*="RadGrid"]');
            for (const gridEl of gridElements) {
                const gridObj = window.$find?.(gridEl.id);
                if (gridObj?.get_masterTableView) {
                    const mtv = gridObj.get_masterTableView();
                    const dataItems = mtv.get_dataItems();
                    if (dataItems && dataItems.length > rowIndex) {
                        mtv.fireCommand('Edit', dataItems[rowIndex].get_itemIndex());
                        return true;
                    }
                    try { mtv.editItem(mtv.get_dataItems()[rowIndex].get_element()); return true; } catch (e) {}
                }
            }
        } catch (e) {}

        const editBtn = findEditElement(row);
        if (editBtn) {
            const onclick = editBtn.getAttribute('onclick') || '';
            const href = editBtn.getAttribute('href') || editBtn.parentElement?.getAttribute('href') || '';
            const parentLink = editBtn.closest('a');
            const parentHref = parentLink?.getAttribute('href') || '';
            const allSources = onclick + ' ' + href + ' ' + parentHref;
            const match = allSources.match(/__doPostBack\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/);
            if (match && window.__doPostBack) { window.__doPostBack(match[1], match[2]); return true; }
        }

        try {
            const gridEl = document.querySelector('[id*="radGridStaging"], [id*="RadGrid"]');
            if (gridEl && window.__doPostBack) { window.__doPostBack(gridEl.id + '$ctl00', 'Edit:' + rowIndex); return true; }
        } catch (e) {}

        if (editBtn) { editBtn.click(); return true; }
        return false;
    }

    function findEditElement(row) {
        if (!row) return null;
        const selectors = ['input[id*="EditButton"]', 'input[type="image"][alt*="Edit" i]', 'input[type="image"][src*="edit" i]', 'a[id*="EditButton"]', 'a[href*="Edit"]', 'img[src*="edit" i]'];
        for (const sel of selectors) { const el = row.querySelector(sel); if (el) return el; }
        const editCell = row.cells?.[2];
        if (editCell) { const el = editCell.querySelector('input[type="image"], a, button, img'); if (el) return el; }
        return null;
    }

    function setFieldValue(field, value, isCheckbox = false) {
        if (!field) return false;
        try {
            if (isCheckbox) {
                if (field.checked !== value) { field.checked = value; field.dispatchEvent(new Event('change', { bubbles: true })); field.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
                return true;
            }
            if (field.id?.includes('_Input')) {
                const comboId = field.id.replace('_Input', '');
                const comboObj = window.$find?.(comboId);
                if (comboObj?.findItemByText) {
                    const item = comboObj.findItemByText(value);
                    if (item) { item.select(); return true; }
                    if (comboObj.set_text) { comboObj.set_text(value); comboObj.commitChanges?.(); return true; }
                }
            }
            if (field.id?.includes('_dateInput')) {
                const pickerId = field.id.replace('_dateInput', '').replace('_input', '');
                const dateObj = window.$find?.(pickerId);
                if (dateObj?.set_selectedDate) { dateObj.set_selectedDate(new Date(value)); return true; }
                const dateInputObj = window.$find?.(field.id.replace('_input', ''));
                if (dateInputObj?.set_selectedDate) { dateInputObj.set_selectedDate(new Date(value)); return true; }
            }
            const nativeSetter = Object.getOwnPropertyDescriptor(
                field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value'
            )?.set;
            if (nativeSetter) nativeSetter.call(field, value);
            else field.value = value;
            field.dispatchEvent(new Event('focus', { bubbles: true }));
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('blur', { bubbles: true }));
            field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
            return true;
        } catch (e) { log(`Error setting field: ${e.message}`, 'error'); return false; }
    }

    function findFormFields() {
        const f = {};
        f.uom = document.querySelector('.rgEditRow input[id*="UOM_Input"]') || document.querySelector('.rgEditRow select[id*="UOM"]') || document.querySelector('[id*="EditForm"] input[id*="UOM_Input"]') || document.querySelector('input[id*="UOM_Input"]') || document.querySelector('select[id*="UOM"]');
        f.startDate = document.querySelector('.rgEditRow input[id*="StartDate_dateInput"]') || document.querySelector('[id*="EditForm"] input[id*="StartDate"]') || document.querySelector('input[id*="StartDate_dateInput"]') || document.querySelector('input[id*="StartDate_dateInput_input"]');
        f.desc = document.querySelector('.rgEditRow textarea[id*="Sgn_Dsc_1"]') || document.querySelector('.rgEditRow input[id*="Sgn_Dsc_1"]') || document.querySelector('[id*="EditForm"] textarea[id*="Sgn_Dsc_1"]') || document.querySelector('textarea[id*="Sgn_Dsc_1"]') || document.querySelector('input[id*="Sgn_Dsc_1"]');
        f.cool = document.querySelector('.rgEditRow textarea[id*="Text50"]') || document.querySelector('.rgEditRow input[id*="Text50"]') || document.querySelector('[id*="EditForm"] textarea[id*="Text50"]') || document.querySelector('textarea[id*="Text50"]') || document.querySelector('input[id*="Text50"]');
        f.organic = document.querySelector('.rgEditRow input[type="checkbox"][id*="SP5"]') || document.querySelector('[id*="EditForm"] input[type="checkbox"][id*="SP5"]') || document.querySelector('input[type="checkbox"][id*="SP5"]');
        f.updateBtn = document.querySelector('.rgEditRow input[id*="btnUpdate"]') || document.querySelector('.rgEditRow input[id*="UpdateButton"]') || document.querySelector('.rgEditRow input[value*="Update"]') || document.querySelector('.rgEditRow a[id*="Update"]') || document.querySelector('[id*="EditForm"] input[id*="Update"]') || document.querySelector('input[id*="btnUpdate"]') || document.querySelector('input[id*="UpdateButton"]') || document.querySelector('input[value="Update"]');
        f.cancelBtn = document.querySelector('.rgEditRow input[id*="btnCancel"]') || document.querySelector('.rgEditRow input[id*="CancelButton"]') || document.querySelector('[id*="EditForm"] input[id*="Cancel"]') || document.querySelector('input[id*="btnCancel"]');
        return f;
    }

    async function clickButton(btn) {
        if (!btn) return false;
        const onclick = btn.getAttribute('onclick') || '';
        const href = btn.getAttribute('href') || '';
        const match = (onclick + ' ' + href).match(/__doPostBack\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/);
        if (match && window.__doPostBack) { window.__doPostBack(match[1], match[2]); return true; }
        btn.click();
        return true;
    }

    async function processRow(idx, totalRows, startDate) {
        const rows = getRows();
        if (idx >= rows.length) { log(`Row ${idx} out of bounds`, 'error'); return false; }

        const row = rows[idx];
        const parsed = parseRow(row);
        if (!parsed) return false;

        const { upc, desc } = parsed;
        log(`[${idx + 1}/${totalRows}] ${upc} - ${desc}`);

        const editTriggered = await triggerEdit(row, idx);
        if (!editTriggered) { log(`Could not trigger edit for ${upc}`, 'error'); return false; }

        await waitForAjax();
        const editForm = await waitForEditForm();
        if (!editForm) { log(`Edit form never appeared for ${upc}`, 'error'); return false; }
        await sleep(500);

        const fields = findFormFields();

        // UOM
        const uom = getUomFromDescription(desc, upc);
        if (uom && fields.uom) {
            setFieldValue(fields.uom, uom);
            log(`  UOM → ${uom}`);
        } else if (!uom) {
            log(`  UOM → no rule matched, leaving as-is`, 'warn');
        }

        // Start Date
        if (fields.startDate) setFieldValue(fields.startDate, startDate);

        // Description
        if (fields.desc) setFieldValue(fields.desc, desc);

        // COOL — try PLU first, then fuzzy description match
        const coolResult = findCool(upc, desc);
        if (coolResult && fields.cool) {
            setFieldValue(fields.cool, coolResult.cool);
            if (coolResult.method === 'DESC') {
                log(`  COOL → ${coolResult.cool} [fuzzy match: "${coolResult.matched}" score=${coolResult.score.toFixed(2)}]`);
            } else {
                log(`  COOL → ${coolResult.cool}`);
            }
        } else if (!coolResult) {
            log(`  COOL → no data for ${upc} "${desc}"`);
        }

        // Organic
        const isOrganic = isOrganicItem(upc, desc);
        if (fields.organic) {
            setFieldValue(fields.organic, isOrganic, true);
            if (isOrganic) log(`  Organic → ✓`);
        }

        // Determine local flag: COOL is exclusively from Meijer operating states
        let isLocal = false;
        if (coolResult) {
            const coolUpper = coolResult.cool.toUpperCase();
            // Check if ALL listed countries/states are Meijer local states
            // "USA" alone counts as potentially local, but multi-country does not
            const countries = coolUpper.split(/[,\/&]+/).map(s => s.replace(/\bAND\b/g, '').trim()).filter(s => s.length > 0);
            isLocal = countries.length > 0 && countries.every(c =>
                c === 'USA' || c === 'US' || c === 'UNITED STATES' ||
                MEIJER_LOCAL_STATES.includes(c)
            );
        }

        // Record to run log
        addLogEntry({
            upc,
            desc,
            uom: uom || '',
            cool: coolResult ? coolResult.cool : '',
            coolMethod: coolResult ? coolResult.method : '',
            coolScore: coolResult ? coolResult.score.toFixed(2) : '',
            organic: isOrganic,
            local: isLocal,
        });

        // Save
        if (!fields.updateBtn) {
            log(`Update btn not found for ${upc}`, 'error');
            if (fields.cancelBtn) { await clickButton(fields.cancelBtn); await waitForAjax(); }
            return false;
        }

        await clickButton(fields.updateBtn);
        await waitForAjax();
        const savedOk = await waitForEditFormClose();
        log(savedOk ? `✅ ${upc}` : `⚠️ Form may still be open for ${upc}`);
        return true;
    }

    // ==================== CSV LOADER ====================
    function splitCsvLine(line) {
        const out = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                out.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }
        out.push(cur);
        return out;
    }

    function loadCoolFromCSV(csvText) {
        const lines = csvText.replace(/\r/g, '').split('\n').filter(Boolean);
        let loaded = 0;
        COOL_DATA.length = 0;
        COOL_BY_PLU.clear();

        // Try Meijer COOL export format first
        let startIndex = -1;
        let idxPLU = -1, idxDESC = -1, idxCOOL = -1;

        for (let i = 0; i < lines.length; i++) {
            const cols = splitCsvLine(lines[i]).map(s => s.trim());
            const norm = cols.map(s => s.toUpperCase());
            if (norm.includes('PLU') && norm.includes('DESCRIPTION') && norm.includes('COOL')) {
                startIndex = i + 1;
                idxPLU = norm.indexOf('PLU');
                idxDESC = norm.indexOf('DESCRIPTION');
                idxCOOL = norm.indexOf('COOL');
                break;
            }
        }

        if (startIndex !== -1) {
            for (let i = startIndex; i < lines.length; i++) {
                const cols = splitCsvLine(lines[i]);
                if (!cols.length) continue;
                const plu = normalizePlu(cols[idxPLU] || '');
                const desc = String(cols[idxDESC] || '').trim();
                const cool = String(cols[idxCOOL] || '').trim();
                if (!plu || !desc || !cool) continue;
                const entry = { plu, desc, cool };
                COOL_DATA.push(entry);
                COOL_BY_PLU.set(plu, entry);
                loaded++;
            }
            log(`📂 Loaded ${loaded} COOL entries from full CSV`);
            const el = document.getElementById('nexgen-cool-count');
            if (el) el.textContent = `${COOL_DATA.length} COOL entries loaded`;
            return;
        }

        // Fallback simple 3-column CSV: plu,desc,cool
        for (let i = 1; i < lines.length; i++) {
            const cols = splitCsvLine(lines[i]);
            if (cols.length < 3) continue;
            const plu = normalizePlu(cols[0] || '');
            const desc = String(cols[1] || '').trim();
            const cool = String(cols.slice(2).join(',') || '').trim().replace(/^"|"$/g, '');
            if (!plu || !desc || !cool) continue;
            const entry = { plu, desc, cool };
            COOL_DATA.push(entry);
            COOL_BY_PLU.set(plu, entry);
            loaded++;
        }

        log(`📂 Loaded ${loaded} COOL entries from CSV`);
        const el = document.getElementById('nexgen-cool-count');
        if (el) el.textContent = `${COOL_DATA.length} COOL entries loaded`;
    }

    // ==================== UOM TEST ====================
    function testUomRules() {
        const rows = getRows();
        if (!rows.length) { log('No rows to test', 'error'); return; }

        console.group('[NexGen v5.2] UOM Rule Test');
        let matched = 0, unmatched = 0;
        const unmatchedItems = [];

        rows.forEach((row, idx) => {
            const parsed = parseRow(row);
            if (!parsed) return;
            const uom = getUomFromDescription(parsed.desc, parsed.upc);
            if (uom) {
                matched++;
                console.log(`  ✅ ${parsed.upc} "${parsed.desc}" → ${uom}`);
            } else {
                unmatched++;
                unmatchedItems.push(parsed.desc);
                console.warn(`  ❓ ${parsed.upc} "${parsed.desc}" → NO MATCH`);
            }
        });

        console.log(`\nMatched: ${matched}, Unmatched: ${unmatched}`);
        if (unmatchedItems.length) console.log('Unmatched descriptions:', unmatchedItems);
        console.groupEnd();

        log(`UOM test: ${matched} matched, ${unmatched} unmatched (see F12)`);
    }

    // ==================== MAIN ====================
    let stopRequested = false;

    // Detect if a row has already been completed (white) vs needs editing (yellow)
    function isRowCompleted(row) {
        if (!row) return false;

        // Check inline background-color style on the row itself
        const bgColor = row.style.backgroundColor || '';
        if (bgColor) {
            // Yellow shades = unedited, White/no color = completed
            const lower = bgColor.toLowerCase();
            if (lower.includes('yellow') || lower === '#ffff00' || lower === '#ffffcc' ||
                lower === '#fff8dc' || lower === '#fafad2' || lower === 'rgb(255, 255, 0)' ||
                lower === 'rgb(255, 255, 204)' || lower === 'rgb(255, 255, 153)') {
                return false; // yellow = NOT completed
            }
        }

        // Check computed background
        try {
            const computed = window.getComputedStyle(row);
            const bg = computed.backgroundColor || '';
            // Parse RGB values
            const match = bg.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
            if (match) {
                const [, r, g, b] = match.map(Number);
                // Yellow-ish: high R, high G, low-ish B
                if (r > 200 && g > 200 && b < 180) return false; // yellow = NOT completed
                // White-ish: all channels high
                if (r > 240 && g > 240 && b > 240) return true; // white = completed
            }
        } catch (e) {}

        // Check first cell background too (some grids color cells not rows)
        if (row.cells && row.cells.length > 0) {
            const cellBg = row.cells[0].style.backgroundColor || '';
            if (cellBg) {
                const lower = cellBg.toLowerCase();
                if (lower.includes('yellow') || lower === '#ffff00' || lower === '#ffffcc') {
                    return false;
                }
            }
        }

        // Check for CSS classes that might indicate status
        const classes = row.className || '';
        if (classes.match(/completed|done|saved|white/i)) return true;
        if (classes.match(/pending|unsaved|yellow|new/i)) return false;

        // Default: assume NOT completed (process it to be safe)
        return false;
    }

    async function runAutomation(yellowOnly = false) {
        stopRequested = false;
        clearRunLog();
        const startDate = getStartDate();
        log(`Start date: ${startDate} | COOL: ${COOL_DATA.length} | Mode: ${yellowOnly ? 'YELLOW ONLY' : 'ALL ROWS'}`);

        updateProgress('Phase 1: Deduplication...');
        await runDeduplication();
        if (stopRequested) { log('🛑 Stopped'); return; }

        await sleep(500);
        const rows = getRows();
        const totalRows = rows.length;
        if (totalRows === 0) { log('No rows found!', 'error'); return; }

        // Count yellow vs white
        let needsEdit = 0, alreadyDone = 0;
        rows.forEach(r => { if (isRowCompleted(r)) alreadyDone++; else needsEdit++; });

        if (yellowOnly && alreadyDone > 0) {
            log(`Skipping ${alreadyDone} completed (white) rows, editing ${needsEdit} remaining`);
        } else if (!yellowOnly) {
            log(`Processing ALL ${totalRows} rows`);
        }

        log(`Phase 2: Editing ${yellowOnly ? needsEdit + ' of ' : ''}${totalRows} rows...`);
        const startBtn = document.getElementById('nexgen-start');
        const resumeBtn = document.getElementById('nexgen-resume');
        startBtn.disabled = true;
        startBtn.style.background = '#7f8c8d';
        resumeBtn.disabled = true;
        resumeBtn.style.background = '#7f8c8d';

        let success = 0, failed = 0, skipped = 0;

        for (let i = 0; i < totalRows; i++) {
            if (stopRequested) { log('🛑 Stopped'); break; }

            // Re-fetch rows each iteration (DOM may have changed)
            const freshRows = getRows();
            if (i >= freshRows.length) break;

            // Skip completed rows if yellowOnly mode
            if (yellowOnly && isRowCompleted(freshRows[i])) {
                skipped++;
                updateProgress(`Phase 2: ${i + 1}/${totalRows} | ✅ ${success} ❌ ${failed} ⏭ ${skipped}`);
                continue;
            }

            updateProgress(`Phase 2: ${i + 1}/${totalRows} | ✅ ${success} ❌ ${failed}${skipped ? ' ⏭ ' + skipped : ''}`);

            try {
                const ok = await processRow(i, totalRows, startDate);
                if (ok) success++; else failed++;
            } catch (e) {
                log(`Row ${i + 1} error: ${e.message}`, 'error');
                failed++;
            }
            await sleep(CONFIG.POST_SAVE_DELAY);
        }

        log(`🏁 Done: ${success} saved, ${failed} failed${skipped ? ', ' + skipped + ' skipped' : ''}`);
        updateProgress(`Done: ✅ ${success}  ❌ ${failed}${skipped ? '  ⏭ ' + skipped : ''}`);
        startBtn.disabled = false;
        startBtn.style.background = '#27ae60';
        resumeBtn.disabled = false;
        resumeBtn.style.background = '#f39c12';

        // Show the run log
        if (runLog.length > 0) {
            log(`📋 Log: ${runLog.length} entries — tap View Log`);
            showLogTable();
        }
    }

    async function testFirstRow() {
        const startDate = getStartDate();
        const rows = getRows();
        if (!rows.length) { log('No rows!', 'error'); return; }
        try {
            const ok = await processRow(0, rows.length, startDate);
            log(ok ? '✅ Test row succeeded' : '❌ Test row failed');
        } catch (e) { log('Test error: ' + e.message, 'error'); }
    }

    // ==================== FIELD INSPECTOR (mobile-friendly) ====================
    async function inspectEditForm() {
        const rows = getRows();
        if (!rows.length) { log('No rows!', 'error'); return; }

        const row = rows[0];
        const parsed = parseRow(row);
        if (!parsed) { log('Cannot parse row', 'error'); return; }

        log(`🔬 Inspecting row: ${parsed.upc} - ${parsed.desc}`);

        // Open edit form
        const editTriggered = await triggerEdit(row, 0);
        if (!editTriggered) { log('Could not trigger edit', 'error'); return; }

        await waitForAjax();
        const editForm = await waitForEditForm();
        if (!editForm) { log('Edit form never appeared!', 'error'); return; }
        await sleep(800);

        // Collect ALL form fields in the edit area
        const report = [];
        report.push(`=== FIELD INSPECTOR ===`);
        report.push(`Row: ${parsed.upc} "${parsed.desc}"`);
        report.push(``);

        // Find all inputs, textareas, selects in the entire document that look like edit fields
        const allInputs = document.querySelectorAll('.rgEditRow input, .rgEditRow textarea, .rgEditRow select, [id*="EditForm"] input, [id*="EditForm"] textarea, [id*="EditForm"] select');

        report.push(`Found ${allInputs.length} fields in edit form:`);
        report.push(``);

        allInputs.forEach((el, i) => {
            const tag = el.tagName;
            const type = el.type || '';
            const id = el.id || '(no id)';
            const name = el.name || '';
            const val = el.value || '';
            const shortId = id.length > 60 ? '...' + id.slice(-57) : id;

            // Skip hidden fields and viewstate
            if (type === 'hidden' && !id.match(/UOM|Text50|Cool|Country|Sgn_Dsc|StartDate|SP5|Organic/i)) return;
            if (id.includes('__VIEWSTATE') || id.includes('__EVENTVALIDATION')) return;

            let line = `${i}. [${tag}${type ? ' type=' + type : ''}]`;
            line += `\n   ID: ${shortId}`;
            if (val) line += `\n   Val: "${val.substring(0, 50)}"`;

            report.push(line);
        });

        report.push(``);

        // Specifically check our target fields
        report.push(`=== TARGET FIELD CHECK ===`);

        const fields = findFormFields();
        const targets = {
            uom: fields.uom,
            startDate: fields.startDate,
            desc: fields.desc,
            cool: fields.cool,
            organic: fields.organic,
            updateBtn: fields.updateBtn,
            cancelBtn: fields.cancelBtn,
        };

        for (const [name, el] of Object.entries(targets)) {
            if (el) {
                report.push(`✅ ${name}: FOUND`);
                report.push(`   ID: ${el.id || '(no id)'}`);
                report.push(`   Val: "${(el.value || el.textContent || '').substring(0, 50)}"`);

                // For UOM, check if it's a Telerik combo and list options
                if (name === 'uom' && el.id) {
                    const comboId = el.id.replace('_Input', '');
                    const comboObj = window.$find?.(comboId);
                    if (comboObj?.get_items) {
                        const items = comboObj.get_items();
                        const opts = [];
                        for (let j = 0; j < items.get_count(); j++) {
                            opts.push(items.getItem(j).get_text());
                        }
                        report.push(`   Combo options: [${opts.join(', ')}]`);
                    } else {
                        report.push(`   (not a Telerik combo or $find failed)`);
                    }
                    // Also check if it's a <select>
                    if (el.tagName === 'SELECT') {
                        const opts = Array.from(el.options).map(o => o.text + '=' + o.value);
                        report.push(`   Select options: [${opts.join(', ')}]`);
                    }
                }
            } else {
                report.push(`❌ ${name}: NOT FOUND`);
            }
        }

        report.push(``);

        // Test COOL matching
        report.push(`=== COOL MATCH TEST ===`);
        const coolResult = findCool(parsed.upc, parsed.desc);
        if (coolResult) {
            report.push(`✅ Match: "${coolResult.cool}"`);
            report.push(`   Method: ${coolResult.method}, Score: ${coolResult.score.toFixed(2)}`);
            report.push(`   Matched desc: "${coolResult.matched}"`);
        } else {
            report.push(`❌ No COOL match for PLU=${parsed.upc} desc="${parsed.desc}"`);
        }

        report.push(``);

        // Test UOM rule
        report.push(`=== UOM RULE TEST ===`);
        const uom = getUomFromDescription(parsed.desc, parsed.upc);
        report.push(uom ? `✅ Rule says: ${uom}` : `❌ No rule matched`);

        report.push(``);

        // Also scan for any field that might be the COOL field with a different ID
        report.push(`=== POSSIBLE COOL FIELDS ===`);
        const possibleCool = document.querySelectorAll('.rgEditRow textarea, .rgEditRow input[type="text"], [id*="EditForm"] textarea, [id*="EditForm"] input[type="text"]');
        possibleCool.forEach(el => {
            const id = el.id || '';
            const name = el.name || '';
            // Look for anything that could be country/cool/origin related
            if (id.match(/cool|country|origin|text50|coo\b|sgn.*50/i) || name.match(/cool|country|origin|text50|coo\b/i)) {
                report.push(`  🔎 ${el.tagName} id="${id}" val="${el.value.substring(0, 40)}"`);
            }
        });
        // Also just list ALL textareas since COOL is likely a textarea
        const allTextareas = document.querySelectorAll('.rgEditRow textarea, [id*="EditForm"] textarea');
        if (allTextareas.length > 0) {
            report.push(`  All textareas in form:`);
            allTextareas.forEach(el => {
                report.push(`  📝 id="${el.id || '(none)'}" val="${el.value.substring(0, 40)}"`);
            });
        } else {
            report.push(`  (no textareas found in edit form)`);
        }

        // Cancel out
        if (fields.cancelBtn) {
            await clickButton(fields.cancelBtn);
            await waitForAjax();
        }

        // Show report in the log panel
        const logArea = document.getElementById('nexgen-inspect-log');
        if (logArea) {
            logArea.textContent = report.join('\n');
            logArea.style.display = 'block';
        } else {
            // Fallback: alert
            alert(report.join('\n'));
        }

        log('🔬 Inspection complete — see report below');
    }

    function debugGrid() {
        const report = [];
        report.push('=== GRID DEBUG ===');
        const grids = document.querySelectorAll('[id*="radGrid"], [id*="RadGrid"]');
        report.push(`Grids found: ${grids.length}`);
        grids.forEach((g) => report.push(`  ID: ${g.id} | Client: ${window.$find?.(g.id) ? 'YES' : 'NO'}`));
        const rows = getRows();
        report.push(`Rows: ${rows.length}`);
        if (rows.length > 0) {
            report.push(`Cells per row: ${rows[0].cells.length}`);
            for (let c = 0; c < Math.min(rows[0].cells.length, 8); c++) {
                report.push(`  [${c}]: "${rows[0].cells[c].textContent.trim().substring(0, 50)}"`);
            }
            report.push(`Delete btn: ${findDeleteButton(rows[0]) ? 'YES' : 'NO'}`);
            report.push(`Edit btn: ${findEditElement(rows[0]) ? 'YES' : 'NO'}`);
            report.push(`Dupes: ${findDuplicates().length}`);
        }
        report.push(`COOL entries: ${COOL_DATA.length}`);

        const logArea = document.getElementById('nexgen-inspect-log');
        if (logArea) {
            logArea.textContent = report.join('\n');
            logArea.style.display = 'block';
        }
        log('Debug info shown below');
    }

    // ==================================================================
    //              VERIFY COOL (fast check all rows)
    // ==================================================================

    async function verifyCool() {
        const rows = getRows();
        if (!rows.length) { log('No rows!', 'error'); return; }

        log(`🔍 Verifying COOL on ${rows.length} rows...`);
        clearRunLog();

        let hasCool = 0, missingCool = 0, errors = 0;
        const missing = [];

        for (let i = 0; i < rows.length; i++) {
            if (stopRequested) { log('🛑 Stopped'); break; }
            updateProgress(`Verifying COOL: ${i + 1}/${rows.length}...`);

            const freshRows = getRows();
            if (i >= freshRows.length) break;

            const row = freshRows[i];
            const parsed = parseRow(row);
            if (!parsed) { errors++; continue; }

            const { upc, desc } = parsed;

            // Open the edit form
            const editTriggered = await triggerEdit(row, i);
            if (!editTriggered) { errors++; continue; }

            await waitForAjax();
            const editForm = await waitForEditForm();
            if (!editForm) { errors++; continue; }
            await sleep(400);

            // Check the COOL field
            const fields = findFormFields();
            const coolValue = fields.cool ? (fields.cool.value || '').trim() : '';
            const uomValue = fields.uom ? (fields.uom.value || '').trim() : '';

            if (coolValue) {
                hasCool++;
            } else {
                missingCool++;
                missing.push({ upc, desc });
            }

            // Record to log with actual values from the form
            const coolResult = findCool(upc, desc);
            const isOrganic = isOrganicItem(upc, desc);
            let isLocal = false;
            if (coolValue) {
                const coolUpper = coolValue.toUpperCase();
                const countries = coolUpper.split(/[,\/&]+/).map(s => s.replace(/\bAND\b/g, '').trim()).filter(s => s.length > 0);
                isLocal = countries.length > 0 && countries.every(c =>
                    c === 'USA' || c === 'US' || c === 'UNITED STATES' ||
                    MEIJER_LOCAL_STATES.includes(c)
                );
            }

            addLogEntry({
                upc,
                desc,
                uom: uomValue || '',
                cool: coolValue || '',
                coolMethod: coolValue ? (coolResult ? coolResult.method : 'MANUAL') : '',
                coolScore: coolResult ? coolResult.score.toFixed(2) : '',
                organic: isOrganic,
                local: isLocal,
                verified: true,
                coolMissing: !coolValue,
            });

            // Cancel without saving
            if (fields.cancelBtn) {
                await clickButton(fields.cancelBtn);
                await waitForAjax();
            }

            await sleep(300);
        }

        log(`✅ COOL Verify: ${hasCool} have COOL, ${missingCool} missing, ${errors} errors`);

        if (missing.length > 0) {
            log(`⚠️ Missing COOL: ${missing.map(m => m.desc).join(', ')}`, 'warn');
        }

        showLogTable();
    }

    // ==================================================================
    //                 SCAN ALL (dry-run, no edits)
    // ==================================================================

    function scanAllRows() {
        const rows = getRows();
        if (!rows.length) { log('No rows to scan!', 'error'); return; }

        clearRunLog();
        log(`🔎 Scanning ${rows.length} rows (no edits)...`);

        let uomMatched = 0, uomMissed = 0, coolMatched = 0, coolMissed = 0;

        rows.forEach((row, idx) => {
            const parsed = parseRow(row);
            if (!parsed) return;

            const { upc, desc } = parsed;

            // UOM
            const uom = getUomFromDescription(desc, upc);
            if (uom) uomMatched++; else uomMissed++;

            // COOL
            const coolResult = findCool(upc, desc);
            if (coolResult) coolMatched++; else coolMissed++;

            // Organic
            const isOrganic = isOrganicItem(upc, desc);

            // Local
            let isLocal = false;
            if (coolResult) {
                const coolUpper = coolResult.cool.toUpperCase();
                const countries = coolUpper.split(/[,\/&]+/).map(s => s.replace(/\bAND\b/g, '').trim()).filter(s => s.length > 0);
                isLocal = countries.length > 0 && countries.every(c =>
                    c === 'USA' || c === 'US' || c === 'UNITED STATES' ||
                    MEIJER_LOCAL_STATES.includes(c)
                );
            }

            addLogEntry({
                upc,
                desc,
                uom: uom || '',
                cool: coolResult ? coolResult.cool : '',
                coolMethod: coolResult ? coolResult.method : '',
                coolScore: coolResult ? coolResult.score.toFixed(2) : '',
                organic: isOrganic,
                local: isLocal,
            });
        });

        log(`🔎 Scan done: UOM ${uomMatched}✅ ${uomMissed}❌ | COOL ${coolMatched}✅ ${coolMissed}❌`);
        showLogTable();
    }

    // ==================================================================
    //                    RUN LOG SYSTEM
    // ==================================================================

    // Meijer local states (states where Meijer operates)
    const MEIJER_LOCAL_STATES = ['MICHIGAN', 'OHIO', 'INDIANA', 'ILLINOIS', 'KENTUCKY', 'WISCONSIN',
                                  'MI', 'OH', 'IN', 'IL', 'KY', 'WI'];

    // Log entries collected during automation
    let runLog = [];

    function addLogEntry(entry) {
        runLog.push(entry);
    }

    function clearRunLog() {
        runLog = [];
    }

    function generateCSV() {
        const headers = ['UPC/PLU', 'Description', 'UOM', 'COOL', 'COOL Match Method', 'COOL Match Score', 'Organic', 'Local'];
        const rows = runLog.map(e => [
            e.upc,
            `"${(e.desc || '').replace(/"/g, '""')}"`,
            e.uom || '',
            `"${(e.cool || '').replace(/"/g, '""')}"`,
            e.coolMethod || '',
            e.coolScore || '',
            e.organic ? 'Y' : '',
            e.local ? 'Y' : '',
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    function downloadCSV() {
        if (runLog.length === 0) {
            log('No log data to download', 'warn');
            return;
        }
        const csv = generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const d = new Date();
        a.download = `nexgen_sign_log_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`📥 Downloaded CSV (${runLog.length} rows)`);
    }

    function showLogTable() {
        if (runLog.length === 0) {
            log('No log data to display', 'warn');
            return;
        }

        // Remove existing overlay if present
        const existing = document.getElementById('nexgen-log-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'nexgen-log-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:1000000; overflow:auto; padding:20px; box-sizing:border-box;';

        let html = `
            <div style="max-width:1200px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h2 style="color:#4ecca3; margin:0; font-family:'Segoe UI',Arial,sans-serif;">📋 Sign Automation Log (${runLog.length} items)</h2>
                    <div style="display:flex; gap:8px;">
                        <button id="nexgen-log-csv" style="padding:8px 16px; background:#27ae60; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">📥 Download CSV</button>
                        <button id="nexgen-log-close" style="padding:8px 16px; background:#c0392b; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">✕ Close</button>
                    </div>
                </div>
                <table style="width:100%; border-collapse:collapse; font-family:'Segoe UI',Arial,sans-serif; font-size:12px;">
                    <thead>
                        <tr style="background:#2c3e50; color:white;">
                            <th style="padding:8px; text-align:left; border:1px solid #444;">#</th>
                            <th style="padding:8px; text-align:left; border:1px solid #444;">UPC/PLU</th>
                            <th style="padding:8px; text-align:left; border:1px solid #444;">Description</th>
                            <th style="padding:8px; text-align:center; border:1px solid #444;">UOM</th>
                            <th style="padding:8px; text-align:left; border:1px solid #444;">COOL</th>
                            <th style="padding:8px; text-align:center; border:1px solid #444;">Match</th>
                            <th style="padding:8px; text-align:center; border:1px solid #444;">🌿</th>
                            <th style="padding:8px; text-align:center; border:1px solid #444;">📍</th>
                        </tr>
                    </thead>
                    <tbody>`;

        runLog.forEach((e, i) => {
            const bgColor = i % 2 === 0 ? '#1a1a2e' : '#1e1e3a';
            const uomColor = e.uom ? '#fff' : '#e74c3c';
            const coolColor = e.cool ? '#fff' : '#e74c3c';
            const matchBadge = e.coolMethod === 'PLU' ? '🎯' : e.coolMethod === 'DESC' ? `🔍 ${e.coolScore}` : '—';

            html += `
                <tr style="background:${bgColor}; color:#e0e0e0;">
                    <td style="padding:6px 8px; border:1px solid #333;">${i + 1}</td>
                    <td style="padding:6px 8px; border:1px solid #333; font-family:monospace;">${e.upc}</td>
                    <td style="padding:6px 8px; border:1px solid #333;">${e.desc}</td>
                    <td style="padding:6px 8px; border:1px solid #333; text-align:center; color:${uomColor}; font-weight:bold;">${e.uom || '⚠️'}</td>
                    <td style="padding:6px 8px; border:1px solid #333; color:${coolColor};">${e.cool || '—'}</td>
                    <td style="padding:6px 8px; border:1px solid #333; text-align:center;">${matchBadge}</td>
                    <td style="padding:6px 8px; border:1px solid #333; text-align:center;">${e.organic ? '✅' : ''}</td>
                    <td style="padding:6px 8px; border:1px solid #333; text-align:center;">${e.local ? '✅' : ''}</td>
                </tr>`;
        });

        html += `</tbody></table>
            <div style="margin-top:12px; color:#888; font-family:'Segoe UI',Arial,sans-serif; font-size:11px;">
                🎯 = PLU exact match &nbsp; 🔍 = Fuzzy description match &nbsp; 🌿 = Organic &nbsp; 📍 = Local (grown in MI/OH/IN/IL/KY/WI)
            </div>
            </div>`;

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        document.getElementById('nexgen-log-csv').addEventListener('click', downloadCSV);
        document.getElementById('nexgen-log-close').addEventListener('click', () => overlay.remove());
    }
    function createUI() {
        if (document.getElementById('nexgen-panel-v50')) return;

        const panel = document.createElement('div');
        panel.id = 'nexgen-panel-v50';
        panel.innerHTML = `
            <div style="position:fixed; bottom:10px; right:10px; width:300px; max-height:90vh; background:#1a1a2e; color:#e0e0e0; border-radius:10px; padding:12px; font-family:'Segoe UI',Arial,sans-serif; z-index:999999; box-shadow:0 6px 20px rgba(0,0,0,0.5); border:1px solid #333; overflow-y:auto;">
                <div style="font-weight:bold; font-size:14px; margin-bottom:4px; color:#4ecca3;">
                    🥬 NexGen Automator <span style="color:#888; font-size:11px;">v5.2</span>
                </div>
                <div id="nexgen-cool-count" style="font-size:10px; color:#888; margin-bottom:8px;">${COOL_DATA.length} COOL entries loaded</div>

                <div style="display:flex; gap:4px; margin-bottom:6px;">
                    <button id="nexgen-start" style="flex:1; padding:10px; background:#27ae60; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:11px;">
                        ▶ ALL ROWS
                    </button>
                    <button id="nexgen-resume" style="flex:1; padding:10px; background:#f39c12; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:11px;">
                        ▶ YELLOW ONLY
                    </button>
                </div>

                <div style="display:flex; gap:4px; margin-bottom:6px;">
                    <button id="nexgen-dedup-only" style="flex:1; padding:7px; background:#e67e22; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px;">🗑 Dedup</button>
                    <button id="nexgen-test" style="flex:1; padding:7px; background:#2980b9; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px;">🧪 Test Row 1</button>
                    <button id="nexgen-stop" style="flex:1; padding:7px; background:#555; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px;">⏹ Stop</button>
                </div>

                <div style="display:flex; gap:4px; margin-bottom:6px;">
                    <button id="nexgen-scan-all" style="flex:1; padding:7px; background:#e74c3c; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px;">🔎 Scan All</button>
                    <button id="nexgen-verify-cool" style="flex:1; padding:7px; background:#9b59b6; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px;">✅ Verify COOL</button>
                    <button id="nexgen-inspect" style="flex:1; padding:7px; background:#8e44ad; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px;">🔬 Inspect</button>
                </div>

                <div style="display:flex; gap:4px; margin-bottom:6px;">
                    <button id="nexgen-view-log" style="flex:1; padding:7px; background:#2980b9; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px;">📋 View Log</button>
                    <button id="nexgen-dl-csv" style="flex:1; padding:7px; background:#16a085; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px;">📥 Download Log</button>
                    <label style="flex:1; padding:7px; background:#2c3e50; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px; text-align:center;">
                        📂 Load CSV
                        <input type="file" id="nexgen-csv-input" accept=".csv" style="display:none;">
                    </label>
                </div>

                <div style="padding:8px; background:#0f0f23; border-radius:6px; margin-bottom:6px;">
                    <div id="nexgen-progress" style="font-size:11px; color:#4ecca3; margin-bottom:4px;">Ready</div>
                    <div id="nexgen-status" style="font-size:11px; color:#bdc3c7; word-break:break-word;">Waiting to start...</div>
                </div>

                <pre id="nexgen-inspect-log" style="display:none; padding:8px; background:#0a0a1a; border-radius:6px; font-size:9px; color:#0f0; white-space:pre-wrap; word-break:break-all; max-height:50vh; overflow-y:auto; margin:0; border:1px solid #333;"></pre>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('nexgen-start').addEventListener('click', () => runAutomation(false).catch(e => log('Fatal: ' + e.message, 'error')));
        document.getElementById('nexgen-resume').addEventListener('click', () => runAutomation(true).catch(e => log('Fatal: ' + e.message, 'error')));
        document.getElementById('nexgen-dedup-only').addEventListener('click', () => runDeduplication().catch(e => log('Error: ' + e.message, 'error')));
        document.getElementById('nexgen-test').addEventListener('click', () => testFirstRow().catch(e => log('Error: ' + e.message, 'error')));
        document.getElementById('nexgen-stop').addEventListener('click', () => { stopRequested = true; log('Stopping...', 'warn'); });
        document.getElementById('nexgen-scan-all').addEventListener('click', () => scanAllRows());
        document.getElementById('nexgen-verify-cool').addEventListener('click', () => verifyCool().catch(e => log('Verify error: ' + e.message, 'error')));
        document.getElementById('nexgen-inspect').addEventListener('click', () => inspectEditForm().catch(e => log('Inspect error: ' + e.message, 'error')));
        document.getElementById('nexgen-view-log').addEventListener('click', () => showLogTable());
        document.getElementById('nexgen-dl-csv').addEventListener('click', () => downloadCSV());
        document.getElementById('nexgen-csv-input').addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => loadCoolFromCSV(reader.result);
            reader.readAsText(file);
        });
    }

    // ==================== INIT ====================
    function init() {
        log('Script initialized');
        createUI();
        setTimeout(() => {
            const rows = getRows();
            const dupes = findDuplicates();
            log(`${rows.length} rows, ${dupes.length} dupes, ${COOL_DATA.length} COOL`);
        }, 2000);
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();