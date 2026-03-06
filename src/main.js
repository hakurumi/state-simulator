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

        // 5. 天使祝福
        dom.angelBlessing.checked = !!state['angel-blessing'];
        applyAngelBlessing();

        // 5.5 藥水 Buff
        if (state['potion-select'] != null) dom.potionSelect.value = state['potion-select'];
        dom.potionBuff.checked = !!state['potion-buff'];
        applyPotionBuff();

        // 6. 設定 level & prevLevel
        if (state['level'] != null) dom.level.value = state['level'];
        prevLevel = getVal('level', 1);

        // 7. 更新所有 UI
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
//  綁定事件 & 初始化
// ────────────────────────────────

initCharacter();
initEquipment();
initAttributes();

setTheme(localStorage.getItem('theme') !== 'light');
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
