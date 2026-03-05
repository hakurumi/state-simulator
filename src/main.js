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

    masteryWrap:      $('mastery-wrap'),
    expertName:       $('expert-name'),
    expertWrap:       $('expert-wrap'),
    expert:           $('expert'),
    expertInfo:       $('expert-info'),

    boaLevel:           $('boa-level'),
    focusLevel:         $('focus-level'),
    concentrateLevel:   $('concentrate-level'),
    concentrateInfo:    $('concentrate-info'),

    hexLevel:         $('hex-level'),
    hexInfo:          $('hex-info'),

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
        ['weapon-atk', 'armor-atk', 'elixir-atk', 'projectile-atk', 'equip-acc', 'elixir-acc', 'mastery', 'maple-blessing', 'expert', 'hex-level', 'boa-level', 'focus-level', 'concentrate-level'].forEach(id => {
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
        updateMasteryLabel();
        updateMapleLabel();
        updateExpertLabel();
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
    updateMasteryLabel();
    updateMapleLabel();
    updateExpertLabel();
    resetStats(false);
    resetStats(true);
    updateJobUI();
}
initEquipDetail();
