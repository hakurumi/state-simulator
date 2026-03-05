// ────────────────────────────────
//  裝備技能
// ────────────────────────────────

function getMaplePct() {
    const lv = clamp(parseInt(dom.mapleBlessing.value), 0, 30);
    return lv <= 0 ? 0 : Math.floor((lv + 1) / 2);
}

function updateMapleLabel() {
    const pct = getMaplePct();
    dom.maplePct.textContent = pct > 0 ? `+${pct}%` : '';
}

function updateMasteryLabel() {
    const lv = clamp(parseInt(dom.mastery.value), 0, 20);
    const pct = Math.ceil(lv / 2) * 5 + 10;
    dom.masteryPct.textContent = `${pct}%`;
}

function bindAtkInput(id, min) {
    $(id).addEventListener('blur', () => {
        $(id).value = clamp(parseInt($(id).value), min, MAX_ATK);
        updateAttack();
    });
}

function initEquipment() {
    bindAtkInput('weapon-atk', 1);
    bindAtkInput('armor-atk', 0);
    bindAtkInput('projectile-atk', 0);
    bindAtkInput('elixir-atk', 0);

    // 命中欄位
    $('equip-acc').addEventListener('blur', () => {
        $('equip-acc').value = clamp(parseInt($('equip-acc').value), 0, MAX_EXTRA);
        updateAttack();
    });
    $('equip-acc').addEventListener('input', updateAttack);
    $('elixir-acc').addEventListener('blur', () => {
        $('elixir-acc').value = clamp(parseInt($('elixir-acc').value), 0, MAX_EXTRA);
        updateAttack();
    });
    $('elixir-acc').addEventListener('input', updateAttack);

    dom.mastery.addEventListener('blur', () => {
        dom.mastery.value = clamp(parseInt(dom.mastery.value), 0, 20);
        updateMasteryLabel();
        updateExpertLabel();
        updateAttack();
    });

    dom.mapleBlessing.addEventListener('blur', () => {
        dom.mapleBlessing.value = clamp(parseInt(dom.mapleBlessing.value), 0, 30);
        updateMapleLabel();
        updateTotals();
        updateAttack();
    });

    dom.expert.addEventListener('blur', () => {
        const cfg = JOB_CONFIG[getJob()];
        const max = cfg?.expertMax || cfg?.beholderMax || 30;
        dom.expert.value = clamp(parseInt(dom.expert.value), 0, max);
        updateExpertLabel();
        updateAttack();
    });

    dom.hexLevel.addEventListener('blur', () => {
        const max = JOB_CONFIG[getJob()]?.hexOfTheBeholderMax || 25;
        dom.hexLevel.value = clamp(parseInt(dom.hexLevel.value), 0, max);
        updateHexLabel();
        updateAttack();
    });

    // 弓箭手技能
    dom.boaLevel.addEventListener('blur', () => {
        dom.boaLevel.value = clamp(parseInt(dom.boaLevel.value), 0, 16);
        updateAttack();
    });
    dom.focusLevel.addEventListener('blur', () => {
        dom.focusLevel.value = clamp(parseInt(dom.focusLevel.value), 0, 20);
        updateAttack();
    });
    dom.concentrateLevel.addEventListener('blur', () => {
        dom.concentrateLevel.value = clamp(parseInt(dom.concentrateLevel.value), 0, 30);
        updateConcentrateLabel();
        updateAttack();
    });

    $('btn-reset-equip').addEventListener('click', resetEquipment);
}

function resetEquipment() {
    if (equipMode === 'detail') {
        resetEquipDetail();
    }
    dom.weaponAtk.value = 1;
    dom.armorAtk.value = 0;
    dom.elixirAtk.value = 0;
    dom.equipAcc.value = 0;
    dom.elixirAcc.value = 0;
    dom.projectileAtk.value = 0;
    dom.mastery.value = 0;
    dom.mapleBlessing.value = 0;
    dom.expert.value = 0;
    dom.hexLevel.value = 0;
    dom.boaLevel.value = 0;
    dom.focusLevel.value = 0;
    dom.concentrateLevel.value = 0;
    updateMasteryLabel();
    updateMapleLabel();
    updateExpertLabel();
    updateHexLabel();
    updateConcentrateLabel();
    updateTotals();
    updateAttack();
}
