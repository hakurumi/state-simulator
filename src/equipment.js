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

function updateProfLabel() {
    const lv = clamp(parseInt(dom.proficiency.value), 0, 20);
    const mastery = Math.ceil(lv / 2) * 5 + 10;
    dom.profPct.textContent = `${mastery}%`;
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

    dom.proficiency.addEventListener('blur', () => {
        dom.proficiency.value = clamp(parseInt(dom.proficiency.value), 0, 20);
        updateProfLabel();
        updateMasteryLabel();
        updateAttack();
    });

    dom.mapleBlessing.addEventListener('blur', () => {
        dom.mapleBlessing.value = clamp(parseInt(dom.mapleBlessing.value), 0, 30);
        updateMapleLabel();
        updateTotals();
        updateAttack();
    });

    dom.mastery.addEventListener('blur', () => {
        dom.mastery.value = clamp(parseInt(dom.mastery.value), 0, 30);
        updateMasteryLabel();
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
    dom.projectileAtk.value = 0;
    dom.proficiency.value = 0;
    dom.mapleBlessing.value = 0;
    dom.mastery.value = 0;
    updateProfLabel();
    updateMapleLabel();
    updateMasteryLabel();
    updateTotals();
    updateAttack();
}
