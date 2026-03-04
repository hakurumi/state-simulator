// ────────────────────────────────
//  入口：DOM 快取、初始化
// ────────────────────────────────

const STATE_FIELDS = [
    'job', 'level', 'weapon-atk', 'armor-atk', 'elixir-atk', 'projectile-atk',
    'proficiency', 'weapon-type', 'maple-blessing', 'mastery',
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
    armorLabel:       $('armor-label'),
    projectileItem:   $('projectile-item'),
    projectileLabel:  $('projectile-label'),
    elixirLabel:      $('elixir-label'),

    proficiencyGroup: $('proficiency-group'),
    proficiencyName:  $('proficiency-name'),
    proficiency:      $('proficiency'),
    weaponType:       $('weapon-type'),

    profPct:          $('prof-pct'),
    mapleBlessing:    $('maple-blessing'),
    maplePct:         $('maple-pct'),

    proficiencyWrap:  $('proficiency-wrap'),
    masteryName:      $('mastery-name'),
    masteryWrap:      $('mastery-wrap'),
    mastery:          $('mastery'),
    masteryInfo:      $('mastery-info'),

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    try {
        const state = JSON.parse(raw);

        // 1. 設定 job → 產生 weapon-type 選項
        if (state['job'] != null) dom.job.value = state['job'];
        updateJobUI();

        // 2. 設定 weapon-type（選項已由 updateJobUI 產生）
        if (state['weapon-type'] != null) dom.weaponType.value = state['weapon-type'];

        // 3. 設定 equipment 欄位
        ['weapon-atk', 'armor-atk', 'elixir-atk', 'projectile-atk', 'proficiency', 'maple-blessing', 'mastery'].forEach(id => {
            if (state[id] != null) $(id).value = state[id];
        });

        // 4. 設定 attribute 欄位
        ['str', 'dex', 'int', 'luk', 'extra-str', 'extra-dex', 'extra-int', 'extra-luk'].forEach(id => {
            if (state[id] != null) $(id).value = state[id];
        });

        // 5. 設定 level & prevLevel
        if (state['level'] != null) dom.level.value = state['level'];
        prevLevel = getVal('level', 1);

        // 6. 更新所有 UI
        updateProfLabel();
        updateMapleLabel();
        updateMasteryLabel();
        updateAttributes();
        updateTotals();
        updateAttack();

        return true;
    } catch {
        return false;
    }
}

// ────────────────────────────────
//  綁定事件 & 初始化
// ────────────────────────────────

initCharacter();
initEquipment();
initAttributes();

setTheme(localStorage.getItem('theme') !== 'light');
if (!loadState()) {
    updateProfLabel();
    updateMapleLabel();
    updateMasteryLabel();
    resetStats(false);
    resetStats(true);
    updateJobUI();
}
