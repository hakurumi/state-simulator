// ────────────────────────────────
//  裝備技能
// ────────────────────────────────

function getMaplePct() {
    const lv = clamp(parseInt(dom.mapleBlessing.value), 0, 30);
    return lv <= 0 ? 0 : Math.floor((lv + 1) / 2);
}

function updateMapleLabel() {
    const pct = getMaplePct();
    if (pct > 0) {
        dom.maplePct.textContent = `+${pct}%`;
        dom.maplePct.setAttribute('data-tooltip', `全屬性+${pct}%`);
    } else {
        dom.maplePct.textContent = '';
        dom.maplePct.removeAttribute('data-tooltip');
    }
}

function updateMasteryLabel() {
    const lv = clamp(parseInt(dom.mastery.value), 0, 20);
    const basePct = Math.ceil(lv / 2) * 5 + 10;
    const config = JOB_CONFIG[getJob()];
    const enhSkill = config?.expert || config?.beholder;
    const enhMax = config?.expertMax || config?.beholderMax;
    let expertPct = 0;
    if (enhSkill) {
        const expertLv = clamp(parseInt(dom.expert.value), 0, enhMax || 30);
        expertPct = enhMax ? Math.ceil(expertLv / 3) * 5 : getMasteryBonus(expertLv);
    }
    const profAcc = lv <= 6 || lv >= 19 ? lv : Math.floor(lv / 2) * 2;
    const pct = basePct + expertPct;
    if (profAcc > 0) {
        dom.masteryPct.innerHTML = `<span class="coeff-frac"><span>${pct}%</span><span class="mastery-acc">+${profAcc}命</span></span>`;
        dom.masteryPct.setAttribute('data-tooltip', `熟練度${pct}%、命中+${profAcc}`);
    } else {
        dom.masteryPct.innerHTML = `${pct}%`;
        dom.masteryPct.setAttribute('data-tooltip', `熟練度${pct}%`);
    }
}

function getPotionList() {
    return isMage() ? MAGE_POTION_OPTIONS : POTION_OPTIONS;
}

function buildPotionOptions() {
    const prev = dom.potionSelect.value;
    dom.potionSelect.innerHTML = '';
    getPotionList().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.value;
        opt.textContent = `${p.label} (+${p.atk})`;
        dom.potionSelect.appendChild(opt);
    });
    // restore previous selection if it exists in the new list
    if ([...dom.potionSelect.options].some(o => o.value === prev)) {
        dom.potionSelect.value = prev;
    }
    resizePotionSelect();
}

function resizeInlineSelect(sel) {
    const text = sel.options[sel.selectedIndex]?.text || '';
    const cs = getComputedStyle(sel);
    const span = document.createElement('span');
    span.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;';
    span.style.font = cs.font;
    span.style.letterSpacing = cs.letterSpacing;
    document.body.appendChild(span);
    span.textContent = text;
    sel.style.setProperty('width', (span.offsetWidth + 20) + 'px', 'important');
    span.remove();
}

function resizePotionSelect() {
    const sel = dom.potionSelect;
    const cs = getComputedStyle(sel);
    const span = document.createElement('span');
    span.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;';
    span.style.font = cs.font;
    span.style.letterSpacing = cs.letterSpacing;
    document.body.appendChild(span);
    // 固定寬度：取最大選項文字寬度
    let maxW = 0;
    for (const opt of sel.options) {
        span.textContent = opt.text;
        if (span.offsetWidth > maxW) maxW = span.offsetWidth;
    }
    sel.style.setProperty('width', (maxW + 20) + 'px', 'important');
    // 箭頭跟隨當前文字
    const cur = sel.options[sel.selectedIndex]?.text || '';
    span.textContent = cur;
    const curW = span.offsetWidth;
    span.remove();
    sel.style.setProperty('background-position', (curW + 6) + 'px center', 'important');
}

function applyPotionBuff() {
    const on = dom.potionBuff.checked;
    dom.potionSelect.disabled = !on;
    if (on) {
        const chosen = getPotionList().find(p => p.value === dom.potionSelect.value);
        const atk = chosen ? chosen.atk : 0;
        dom.elixirAtk.value = atk;
        $('elixir-atk-detail').value = atk;
    }
    dom.elixirAtk.disabled = on;
    dom.elixirAtk.style.opacity = on ? '0.6' : '';
    $('elixir-atk-detail').disabled = on;
    $('elixir-atk-detail').style.opacity = on ? '0.6' : '';
    resizePotionSelect();
    updateAttack();
}

function getProjectileList() {
    const config = JOB_CONFIG[getJob()];
    if (!config?.projectile) return [];
    if (config.projectile === '飛鏢攻擊') return STAR_OPTIONS;
    if (config.projectile === '子彈攻擊') return BULLET_OPTIONS;
    if (config.weapon === '弓') return BOW_ARROW_OPTIONS;
    if (config.weapon === '弩') return XBOW_ARROW_OPTIONS;
    return [];
}

function buildProjectileOptions() {
    const prev = dom.projectileSelect.value;
    dom.projectileSelect.innerHTML = '';
    getProjectileList().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.value;
        opt.textContent = `${p.label} (+${p.atk})`;
        dom.projectileSelect.appendChild(opt);
    });
    if ([...dom.projectileSelect.options].some(o => o.value === prev)) {
        dom.projectileSelect.value = prev;
    }
    resizeProjectileSelect();
}

function resizeProjectileSelect() { resizeInlineSelect(dom.projectileSelect);
}

function applyProjectileBuff() {
    const on = dom.projectileBuff.checked;
    dom.projectileSelect.disabled = !on;
    if (on) {
        const chosen = getProjectileList().find(p => p.value === dom.projectileSelect.value);
        const atk = chosen ? chosen.atk : 0;
        dom.projectileAtk.value = atk;
        $('projectile-atk-detail').value = atk;
    }
    dom.projectileAtk.disabled = on;
    dom.projectileAtk.style.opacity = on ? '0.6' : '';
    $('projectile-atk-detail').disabled = on;
    $('projectile-atk-detail').style.opacity = on ? '0.6' : '';
    resizeProjectileSelect();
    updateAttack();
}

function applyAngelBlessing() {
    const on = dom.angelBlessing.checked;
    dom.elixirAcc.disabled = on;
    dom.elixirAcc.style.opacity = on ? '0.6' : '';
    $('elixir-acc-detail').disabled = on;
    $('elixir-acc-detail').style.opacity = on ? '0.6' : '';
    updateAttack();
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

    // long-press tooltip
    [dom.masteryPct, $('energy-info'), $('bullet-time-info')].forEach(el => {
        let timer, skip = false;
        el.addEventListener('touchstart', () => {
            skip = false;
            timer = setTimeout(() => { skip = true; el.classList.add('show-tooltip'); }, 400);
        }, { passive: true });
        el.addEventListener('touchend', () => {
            clearTimeout(timer);
            if (skip) setTimeout(() => el.classList.remove('show-tooltip'), 1500);
        });
        el.addEventListener('touchmove', () => {
            clearTimeout(timer); el.classList.remove('show-tooltip'); skip = false;
        }, { passive: true });
    });

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
        updateMasteryLabel();
        updateExpertLabel();
        updateAttack();
    });

    dom.hexLevel.addEventListener('blur', () => {
        const max = JOB_CONFIG[getJob()]?.hexOfTheBeholderMax || 25;
        dom.hexLevel.value = clamp(parseInt(dom.hexLevel.value), 0, max);
        updateHexLabel();
        updateAttack();
    });

    // 海盜技能
    dom.bulletTimeLevel.addEventListener('blur', () => {
        dom.bulletTimeLevel.value = clamp(parseInt(dom.bulletTimeLevel.value), 0, 20);
        updateBulletTimeLabel();
        updateAttack();
    });
    dom.energyLevel.addEventListener('blur', () => {
        const max = JOB_CONFIG[getJob()]?.energyChargeMax || 40;
        dom.energyLevel.value = clamp(parseInt(dom.energyLevel.value), 0, max);
        updateEnergyLabel();
        updateAttack();
    });

    // 弓箭手技能
    dom.boaLevel.addEventListener('blur', () => {
        dom.boaLevel.value = clamp(parseInt(dom.boaLevel.value), 0, 16);
        updateBoaLabel();
        updateAttack();
    });
    dom.focusLevel.addEventListener('blur', () => {
        dom.focusLevel.value = clamp(parseInt(dom.focusLevel.value), 0, 20);
        updateFocusLabel();
        updateAttack();
    });
    dom.concentrateLevel.addEventListener('blur', () => {
        dom.concentrateLevel.value = clamp(parseInt(dom.concentrateLevel.value), 0, 30);
        updateConcentrateLabel();
        updateAttack();
    });

    dom.angelBlessing.addEventListener('change', () => { applyAngelBlessing(); saveState(); });

    buildPotionOptions();
    dom.potionBuff.addEventListener('change', () => { applyPotionBuff(); saveState(); });
    dom.potionSelect.addEventListener('change', () => {
        resizePotionSelect();
        if (dom.potionBuff.checked) { applyPotionBuff(); saveState(); }
    });

    dom.projectileBuff.addEventListener('change', () => { applyProjectileBuff(); saveState(); });
    dom.projectileSelect.addEventListener('change', () => {
        resizeProjectileSelect();
        if (dom.projectileBuff.checked) { applyProjectileBuff(); saveState(); }
    });

    $('btn-reset-equip').addEventListener('click', resetEquipment);
}

function resetEquipment() {
    if (equipMode === 'detail') {
        resetEquipDetail();
    }
    dom.angelBlessing.checked = false;
    applyAngelBlessing();
    dom.potionBuff.checked = false;
    applyPotionBuff();
    dom.projectileBuff.checked = false;
    applyProjectileBuff();
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
    dom.bulletTimeLevel.value = 0;
    dom.energyLevel.value = 0;
    updateMasteryLabel();
    updateMapleLabel();
    updateExpertLabel();
    updateHexLabel();
    updateConcentrateLabel();
    updateBoaLabel();
    updateFocusLabel();
    updateBulletTimeLabel();
    updateEnergyLabel();
    updateTotals();
    updateAttack();
    saveState();
}
