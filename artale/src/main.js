// ────────────────────────────────
//  入口：DOM 快取、初始化
// ────────────────────────────────

const STATE_FIELDS = [
    'job', 'level', 'weapon-atk', 'armor-atk', 'elixir-atk', 'projectile-atk',
    'equip-acc', 'elixir-acc',
    'mastery', 'weapon-type', 'maple-blessing', 'expert', 'hex-level',
    'boa-level', 'focus-level', 'concentrate-level',
    'str', 'dex', 'int', 'luk', 'extra-str', 'extra-dex', 'extra-int', 'extra-luk',
];

const dom = {
    job:              $('job'),
    level:            $('level'),
    points:           $('points'),
    remaining:        $('remaining'),

    attackField:      $('attack-field'),
    attackLabel:      $('attack-label'),
    attackDisplay:    $('attack-display'),

    weaponAtk:        $('weapon-atk'),
    armorAtk:         $('armor-atk'),
    projectileAtk:    $('projectile-atk'),
    elixirAtk:        $('elixir-atk'),

    weaponLabel:      $('weapon-label'),
    weaponAtkWrap:    $('weapon-atk-wrap'),
    armorLabel:       $('armor-label'),
    projectileLabel:  $('projectile-label'),
    projectileWrap:   $('projectile-wrap'),
    elixirLabel:      $('elixir-label'),

    equipAcc:         $('equip-acc'),
    elixirAcc:        $('elixir-acc'),
    accuracyField:    $('accuracy-field'),
    accuracyDisplay:  $('accuracy-display'),

    masteryGroup:     $('mastery-group'),
    masteryName:      $('mastery-name'),
    mastery:          $('mastery'),
    weaponType:       $('weapon-type'),

    masteryPct:       $('mastery-pct'),
    mapleBlessing:    $('maple-blessing'),
    maplePct:         $('maple-pct'),

    expertName:       $('expert-name'),
    expert:           $('expert'),
    expertInfo:       $('expert-info'),

    boaLevel:           $('boa-level'),
    focusLevel:         $('focus-level'),
    concentrateLevel:   $('concentrate-level'),
    concentrateInfo:    $('concentrate-info'),

    hexLevel:         $('hex-level'),
    hexInfo:          $('hex-info'),

    angelBlessing:      $('angel-blessing'),
    angelBlessingLabel: $('angel-blessing-label'),

    potionBuff:         $('potion-buff'),
    potionSelect:       $('potion-select'),

    themeToggle:      $('theme-toggle'),
};

// ────────────────────────────────
//  localStorage 存取
// ────────────────────────────────

function saveState() {
    const state = {};
    STATE_FIELDS.forEach(id => {
        const el = $(id);
        if (el) state[id] = el.value;
    });
    state['angel-blessing'] = dom.angelBlessing.checked;
    state['potion-buff'] = dom.potionBuff.checked;
    state['potion-select'] = dom.potionSelect.value;
    state['char-mode'] = charMode;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    try {
        const state = JSON.parse(raw);

        // 1. 角色資訊模式
        if (state['char-mode']) setCharMode(state['char-mode']);

        // 2. 設定 job → 產生 weapon-type 選項
        if (state['job'] != null) dom.job.value = state['job'];
        updateJobUI();

        // 3. 設定 weapon-type（選項已由 updateJobUI 產生）
        if (state['weapon-type'] != null) dom.weaponType.value = state['weapon-type'];

        // 4. 設定 equipment 欄位
        ['weapon-atk', 'armor-atk', 'elixir-atk', 'projectile-atk', 'equip-acc', 'elixir-acc', 'mastery', 'maple-blessing', 'expert', 'hex-level', 'boa-level', 'focus-level', 'concentrate-level'].forEach(id => {
            if (state[id] != null) $(id).value = state[id];
        });

        // 5. 設定 attribute 欄位
        ['str', 'dex', 'int', 'luk', 'extra-str', 'extra-dex', 'extra-int', 'extra-luk'].forEach(id => {
            if (state[id] != null) $(id).value = state[id];
        });

        // 6. 天使祝福
        dom.angelBlessing.checked = !!state['angel-blessing'];
        applyAngelBlessing();

        // 7. 藥水 Buff
        if (state['potion-select'] != null) dom.potionSelect.value = state['potion-select'];
        dom.potionBuff.checked = !!state['potion-buff'];
        applyPotionBuff();

        // 8. 設定 level & prevLevel
        if (state['level'] != null) dom.level.value = state['level'];
        prevLevel = getVal('level', 1);

        // 9. 更新所有 UI
        updateWeaponCoeff();
        updateMasteryLabel();
        updateMapleLabel();
        updateExpertLabel();
        updateHexLabel();
        updateConcentrateLabel();
        updateBoaLabel();
        updateFocusLabel();
        updateAttributes();
        updateTotals();
        updateAttack();

        return true;
    } catch {
        return false;
    }
}

// ────────────────────────────────
//  分享 / 匯入匯出
// ────────────────────────────────

// 短鍵名映射（分享連結用）
const KEY_TO_SHORT = {
    'job':'j', 'level':'lv', 'weapon-atk':'wa', 'armor-atk':'aa',
    'elixir-atk':'ea', 'projectile-atk':'pa', 'equip-acc':'ec', 'elixir-acc':'xa',
    'mastery':'ms', 'weapon-type':'wt', 'maple-blessing':'mb', 'expert':'ex',
    'hex-level':'hx', 'boa-level':'ba', 'focus-level':'fc', 'concentrate-level':'cc',
    'str':'s', 'dex':'d', 'int':'i', 'luk':'l',
    'extra-str':'es', 'extra-dex':'ed', 'extra-int':'ei', 'extra-luk':'el',
    'angel-blessing':'ab', 'potion-buff':'pb', 'potion-select':'ps',
    'char-mode':'cm', 'equipMode':'em', 'armorMode':'am',
    'equipData':'eq', 'elixirDetail':'xd', 'elixirAccDetail':'xc', 'projectileDetail':'pd',
};
const SHORT_TO_KEY = Object.fromEntries(Object.entries(KEY_TO_SHORT).map(([k, v]) => [v, k]));

function toShortKeys(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        out[KEY_TO_SHORT[k] || k] = v;
    }
    return out;
}

function fromShortKeys(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        out[SHORT_TO_KEY[k] || k] = v;
    }
    return out;
}

const STATE_DEFAULTS = {
    'job': '劍士 (英雄)', 'level': '200', 'weapon-atk': '1',
    'armor-atk': '0', 'elixir-atk': '0', 'projectile-atk': '0',
    'equip-acc': '0', 'elixir-acc': '0', 'mastery': '0',
    'maple-blessing': '0', 'expert': '0', 'hex-level': '0',
    'boa-level': '0', 'focus-level': '0', 'concentrate-level': '0',
    'str': '4', 'dex': '4', 'int': '4', 'luk': '4',
    'extra-str': '0', 'extra-dex': '0', 'extra-int': '0', 'extra-luk': '0',
};

function collectFullState(compact) {
    const state = {};
    STATE_FIELDS.forEach(id => {
        const el = $(id);
        if (!el) return;
        if (compact && el.value === (STATE_DEFAULTS[id] ?? '')) return;
        state[id] = el.value;
    });
    if (!compact || dom.angelBlessing.checked) state['angel-blessing'] = dom.angelBlessing.checked;
    if (!compact || dom.potionBuff.checked) state['potion-buff'] = dom.potionBuff.checked;
    if (!compact || dom.potionBuff.checked) state['potion-select'] = dom.potionSelect.value;
    if (!compact || charMode !== 'summary') state['char-mode'] = charMode;
    if (!compact || equipMode !== 'summary') state['equipMode'] = equipMode;
    if (!compact || armorMode !== 'top-bottom') state['armorMode'] = armorMode;

    // equipData: 只保留非零值的欄位
    const ed = {};
    let hasEquipData = false;
    EQUIPMENT_SLOTS.forEach(s => {
        const slot = equipData[s.id];
        if (!slot) return;
        const nonZero = {};
        let any = false;
        EQUIP_STATS.forEach(stat => {
            if (slot[stat]) { nonZero[stat] = slot[stat]; any = true; }
        });
        if (any) { ed[s.id] = nonZero; hasEquipData = true; }
    });
    if (!compact || hasEquipData) state['equipData'] = compact ? ed : equipData;

    const elixirD = parseInt($('elixir-atk-detail').value) || 0;
    const elixirAccD = parseInt($('elixir-acc-detail').value) || 0;
    const projD = parseInt($('projectile-atk-detail').value) || 0;
    if (!compact || elixirD) state['elixirDetail'] = elixirD;
    if (!compact || elixirAccD) state['elixirAccDetail'] = elixirAccD;
    if (!compact || projD) state['projectileDetail'] = projD;
    return state;
}

function applyFullState(state) {
    // 1. 角色資訊模式
    if (state['char-mode']) setCharMode(state['char-mode']);

    // 2. 設定 job → 產生 weapon-type 選項
    if (state['job'] != null) dom.job.value = state['job'];
    updateJobUI();

    // 3. 設定 weapon-type（選項已由 updateJobUI 產生）
    if (state['weapon-type'] != null) dom.weaponType.value = state['weapon-type'];

    // 4. 設定 equipment 欄位
    ['weapon-atk', 'armor-atk', 'elixir-atk', 'projectile-atk', 'equip-acc', 'elixir-acc', 'mastery', 'maple-blessing', 'expert', 'hex-level', 'boa-level', 'focus-level', 'concentrate-level'].forEach(id => {
        if (state[id] != null) $(id).value = state[id];
    });

    // 5. 設定 attribute 欄位
    ['str', 'dex', 'int', 'luk', 'extra-str', 'extra-dex', 'extra-int', 'extra-luk'].forEach(id => {
        if (state[id] != null) $(id).value = state[id];
    });

    // 6. 天使祝福
    dom.angelBlessing.checked = !!state['angel-blessing'];
    applyAngelBlessing();

    // 7. 藥水 Buff
    if (state['potion-select'] != null) dom.potionSelect.value = state['potion-select'];
    dom.potionBuff.checked = !!state['potion-buff'];
    applyPotionBuff();

    // 8. 設定 level & prevLevel
    if (state['level'] != null) dom.level.value = state['level'];
    prevLevel = getVal('level', 1);

    // 9. equip detail 部分：先全部重置再套用
    EQUIPMENT_SLOTS.forEach(s => {
        equipData[s.id] = makeEmptySlot();
        EQUIP_STATS.forEach(stat => {
            const input = $(`equip-${s.id}-${stat}`);
            if (input) input.value = 0;
        });
    });
    if (state['equipData']) {
        EQUIPMENT_SLOTS.forEach(s => {
            if (state['equipData'][s.id]) {
                equipData[s.id] = { ...makeEmptySlot(), ...state['equipData'][s.id] };
            }
        });
        EQUIPMENT_SLOTS.forEach(slot => {
            EQUIP_STATS.forEach(stat => {
                const input = $(`equip-${slot.id}-${stat}`);
                if (input) input.value = equipData[slot.id][stat] || 0;
            });
        });
    }
    if (state['armorMode']) {
        armorMode = state['armorMode'];
        updateArmorMode();
    }
    if (state['elixirDetail'] != null) $('elixir-atk-detail').value = state['elixirDetail'];
    if (state['elixirAccDetail'] != null) $('elixir-acc-detail').value = state['elixirAccDetail'];
    if (state['projectileDetail'] != null) $('projectile-atk-detail').value = state['projectileDetail'];
    if (state['equipMode']) setEquipMode(state['equipMode']);

    // 10. 更新所有 UI
    updateWeaponCoeff();
    updateMasteryLabel();
    updateMapleLabel();
    updateExpertLabel();
    updateHexLabel();
    updateConcentrateLabel();
    updateBoaLabel();
    updateFocusLabel();
    updateAttributes();
    updateTotals();
    updateAttack();

    // 11. 寫入 localStorage
    saveState();
    saveEquipDetail();
}

async function compressState(obj) {
    const json = JSON.stringify(obj);
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const buf = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function decompressState(str) {
    const binary = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const text = await new Response(stream).text();
    return JSON.parse(text);
}

function showToast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
}

async function shareState() {
    try {
        const compressed = await compressState(toShortKeys(collectFullState(true)));
        const url = location.origin + location.pathname + '#' + compressed;
        await navigator.clipboard.writeText(url);
        showToast('已複製分享連結');
    } catch {
        showToast('複製失敗');
    }
}

function exportState() {
    const json = JSON.stringify(collectFullState(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'artale-config.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('已匯出檔案');
}

function importState(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const state = JSON.parse(reader.result);
            applyFullState(state);
            showToast('匯入成功');
        } catch {
            showToast('匯入失敗：檔案格式錯誤');
        }
    };
    reader.readAsText(file);
}

function resetAll() {
    if (!confirm('確定要全部重置嗎？')) return;
    resetCharacter();
    resetEquipment();
    resetStats(false);
    resetStats(true);
    if (equipMode === 'detail') {
        resetEquipDetail();
    }
    showToast('已全部重置');
}

// ────────────────────────────────
//  設定 dialog 事件
// ────────────────────────────────

function initSettings() {
    const dialog = $('settings-dialog');
    $('btn-settings').addEventListener('click', () => dialog.showModal());
    $('btn-settings-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
    });
    $('btn-share').addEventListener('click', () => { shareState(); dialog.close(); });
    $('btn-export').addEventListener('click', () => { exportState(); dialog.close(); });
    $('btn-import-trigger').addEventListener('click', () => $('file-import').click());
    $('file-import').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importState(e.target.files[0]);
            e.target.value = '';
            dialog.close();
        }
    });
    $('btn-reset-all').addEventListener('click', () => { resetAll(); dialog.close(); });
}

// ────────────────────────────────
//  綁定事件 & 初始化
// ────────────────────────────────

initCharacter();
initEquipment();
initAttributes();
initSettings();

setTheme(localStorage.getItem('theme') !== 'light');

// URL hash 載入
async function loadFromHash() {
    const hash = location.hash.slice(1);
    if (!hash) return false;
    try {
        const raw = await decompressState(hash);
        const state = fromShortKeys(raw);
        applyFullState(state);
        history.replaceState(null, '', location.pathname);
        return true;
    } catch { return false; }
}

window.addEventListener('hashchange', () => loadFromHash());

(async function() {
    const hash = location.hash.slice(1);
    if (hash) {
        try {
            const raw = await decompressState(hash);
            const state = fromShortKeys(raw);
            initEquipDetail();
            applyFullState(state);
            history.replaceState(null, '', location.pathname);
            return;
        } catch { /* fallback to localStorage */ }
    }
    if (!loadState()) {
        updateWeaponCoeff();
        updateMasteryLabel();
        updateMapleLabel();
        updateExpertLabel();
        updateHexLabel();
        updateConcentrateLabel();
        updateBoaLabel();
        updateFocusLabel();
        resetStats(false);
        resetStats(true);
        updateJobUI();
    }
    initEquipDetail();
})();
