// ────────────────────────────────
//  角色資訊
// ────────────────────────────────

let prevLevel = getVal('level', 1);
let charMode = 'summary';

function getJob()  { return dom.job.value; }
function isMage()  { return getJob().includes('法師'); }

function updateAttack() {
    const job    = getJob();
    const weapon = clamp(parseInt(dom.weaponAtk.value), 1, MAX_ATK);
    const armor  = clamp(parseInt(dom.armorAtk.value),  0, MAX_ATK);
    const elixir = clamp(parseInt(dom.elixirAtk.value), 0, MAX_ATK);

    const projectile = dom.projectileWrap.style.display !== 'none'
        ? clamp(parseInt(dom.projectileAtk.value), 0, MAX_ATK)
        : 0;

    dom.attackField.style.display = 'flex';

    // 法師
    if (isMage()) {
        dom.weaponLabel.textContent = '武器魔攻';
        dom.armorLabel.textContent  = '防具魔攻';
        dom.elixirLabel.textContent = '藥水魔攻';
        const ed1 = $('elixir-label-detail');
        if (ed1) ed1.textContent = '藥水魔攻';
        dom.attackLabel.textContent = '魔法攻擊力';

        const matk = getStat('int') + weapon + armor + elixir;
        dom.attackDisplay.textContent = matk;
        dom.accuracyField.style.display = 'none';
        document.querySelectorAll('.atk-spacer').forEach(el => el.style.display = '');
        saveState();
        return;
    }

    // 物理
    dom.weaponLabel.textContent = '武器攻擊';
    dom.armorLabel.textContent  = '防具攻擊';
    dom.elixirLabel.textContent = '藥水攻擊';
    const ed2 = $('elixir-label-detail');
    if (ed2) ed2.textContent = '藥水攻擊';
    dom.attackLabel.textContent = '攻擊力';

    const config = JOB_CONFIG[job];
    if (!config) return;

    const mainAttr = getStat(config.main);
    const subAttr  = config.sub === 'str+dex'
        ? getStat('str') + getStat('dex')
        : getStat(config.sub);

    const [coeffMin, coeffMax] = config.coeff
        || WEAPON_COEFF[dom.weaponType.value]
        || [0, 0];

    const enhSkill = config.expert || config.beholder;
    const enhMax   = config.expertMax || config.beholderMax;
    const expertLv = enhSkill ? clamp(parseInt(dom.expert.value), 0, enhMax || 30) : 0;
    const expertPct = enhMax ? Math.ceil(expertLv / 3) * 5 : getMasteryBonus(expertLv);
    const expertAtk = enhMax ? 0 : getMasteryAtk(expertLv);
    const guardLv   = config.hexOfTheBeholder ? clamp(parseInt(dom.hexLevel.value), 0, config.hexOfTheBeholderMax || 25) : 0;
    const guardAtk  = guardLv <= 15 ? 0 : Math.min(guardLv - 15, 5);
    const concentrateLv  = config.concentrate ? clamp(parseInt(dom.concentrateLevel.value), 0, 30) : 0;
    const concentrateAtk = concentrateLv > 0 ? 10 + Math.ceil(concentrateLv / 2) : 0;
    const energyLv  = config.energyCharge ? clamp(parseInt(dom.energyLevel.value), 0, config.energyChargeMax || 40) : 0;
    const energyAtk = energyLv > 0 ? 10 + Math.ceil(energyLv / 4) : 0;
    const totalAtk  = weapon + armor + projectile + elixir + expertAtk + guardAtk + concentrateAtk + energyAtk;
    const prof      = (Math.ceil(getVal('mastery') / 2) * 5 + 10 + expertPct) / 100;

    const max = Math.floor((mainAttr * coeffMax + subAttr) * totalAtk / 100) || 1;
    const min = Math.floor((mainAttr * coeffMin * 0.9 * prof + subAttr) * totalAtk / 100) || 1;

    dom.attackDisplay.textContent = `${min}\u2007~\u2007${max}`;

    // 命中計算
    const accCoeff = config.accCoeff || [0.8, 0.5];
    const accBase  = Math.floor(getStat('dex') * accCoeff[0] + getStat('luk') * accCoeff[1]);
    const equipAcc = clamp(parseInt(dom.equipAcc.value), 0, MAX_EXTRA);
    const blessAcc = dom.angelBlessing.checked ? 20 : 0;
    const elixirAcc = dom.angelBlessing.checked ? 0 : clamp(parseInt(dom.elixirAcc.value), 0, MAX_EXTRA);
    const profLv   = clamp(parseInt(dom.mastery.value), 0, 20);
    const profAcc  = profLv <= 6 || profLv >= 19 ? profLv : Math.floor(profLv / 2) * 2;
    const boaLv   = config.blessingOfAmazon ? clamp(parseInt(dom.boaLevel.value), 0, 16) : 0;
    const focusLv = config.focus ? clamp(parseInt(dom.focusLevel.value), 0, 20) : 0;
    const bulletTimeLv  = config.bulletTime ? clamp(parseInt(dom.bulletTimeLevel.value), 0, 20) : 0;
    const energyAcc = energyLv > 0 ? Math.ceil(energyLv / 2) : 0;
    const totalAcc = accBase + profAcc + equipAcc + elixirAcc + blessAcc + boaLv + focusLv + bulletTimeLv + energyAcc;
    dom.accuracyField.style.display = 'contents';
    document.querySelectorAll('.atk-spacer').forEach(el => el.style.display = 'none');
    dom.accuracyDisplay.textContent = totalAcc;

    saveState();
}

function updateWeaponCoeff() {
    const config = JOB_CONFIG[getJob()];
    const el = $('weapon-coeff');
    const coeff = config?.coeff || WEAPON_COEFF[dom.weaponType.value];
    if (coeff) {
        const [lo, hi] = coeff;
        if (lo === hi) {
            el.innerHTML = lo;
            el.setAttribute('data-tooltip', `武器係數 ${lo}（表攻公式乘數）`);
        } else {
            el.innerHTML = `<span class="coeff-frac"><span>${lo}</span><span>${hi}</span></span>`;
            el.setAttribute('data-tooltip', `武器係數 最小${lo} 最大${hi}（表攻公式乘數）`);
        }
    } else {
        el.innerHTML = '';
        el.removeAttribute('data-tooltip');
    }
}

function updateMasteryName() {
    const job    = getJob();
    const config = JOB_CONFIG[job];

    if (!config) {
        dom.masteryName.textContent = '';
        return;
    }

    let name = '';

    if (config.mastery) {
        name = config.mastery;
    } else if (config.weapons) {
        const wt  = dom.weaponType.value;
        const key = Object.keys(SWORD_PROFICIENCY).find(k => wt.includes(k));
        name = key ? SWORD_PROFICIENCY[key] : '';
    }

    dom.masteryName.textContent = name || '';
}

function updateJobUI() {
    const job    = getJob();
    const config = JOB_CONFIG[job];
    const mage   = isMage();

    // 屬性標籤
    updateAttrTags();

    // 精準技能
    dom.masteryGroup.style.display = mage ? 'none' : 'flex';

    // 武器類型
    const weaponWrap = $('weapon-type-wrap');
    const weaponText = $('weapon-type-text');
    if (config?.weapons) {
        dom.weaponType.innerHTML = config.weapons
            .map(w => `<option value="${w}">${w}</option>`)
            .join('');
        dom.weaponType.style.display = '';
        weaponText.style.display = 'none';
        weaponWrap.style.display = '';
    } else if (config?.weapon) {
        dom.weaponType.style.display = 'none';
        weaponText.textContent = config.weapon;
        weaponText.style.display = '';
        weaponWrap.style.display = '';
    } else {
        weaponWrap.style.display = 'none';
        dom.weaponType.innerHTML = '';
    }

    // 投射物
    if (config?.projectile) {
        dom.weaponAtkWrap.classList.add('field-value-mid');
        dom.projectileLabel.style.display = 'flex';
        dom.projectileLabel.textContent   = config.projectile;
        $('projectile-label-detail').textContent = config.projectile;
        dom.projectileWrap.style.display  = 'flex';
        if (equipMode === 'detail') $('row-projectile-detail').style.display = 'flex';
    } else {
        dom.weaponAtkWrap.classList.remove('field-value-mid');
        dom.projectileLabel.style.display = 'none';
        dom.projectileWrap.style.display  = 'none';
        $('row-projectile-detail').style.display = 'none';
    }

    // 精通技能（Expert / Beholder）
    const enhSkillUI = config?.expert || config?.beholder;
    const enhMaxUI   = config?.expertMax || config?.beholderMax;
    if (enhSkillUI) {
        dom.expertName.textContent = enhSkillUI;
        dom.expert.max = enhMaxUI || 30;
        dom.expert.value = clamp(parseInt(dom.expert.value), 0, enhMaxUI || 30);
        $('expert-row').style.display = 'flex';
    } else {
        $('expert-row').style.display = 'none';
    }

    // expert-row 右側（念力集中、黑暗守護各自獨立）
    const hasConcentrate = !!config?.concentrate;
    const hasHex = !!config?.hexOfTheBeholder;
    $('concentrate-name').style.display = hasConcentrate ? '' : 'none';
    $('concentrate-wrap').style.display = hasConcentrate ? '' : 'none';
    $('hex-name').style.display = hasHex ? '' : 'none';
    $('hex-wrap').style.display = hasHex ? '' : 'none';
    const showExpertSpacer = enhSkillUI && !hasConcentrate && !hasHex;
    const ev = $('expert-value');
    ev.classList.toggle('field-value-mid', hasConcentrate || hasHex || showExpertSpacer);
    ev.style.borderColor = showExpertSpacer ? 'transparent' : '';
    ev.style.flex = (hasConcentrate || hasHex || showExpertSpacer) ? '1' : '';
    document.querySelectorAll('.expert-spacer').forEach(el => el.style.display = showExpertSpacer ? '' : 'none');

    // 弓箭手技能（精準強化 + 集中術）
    $('archer-acc-row').style.display = config?.blessingOfAmazon ? 'flex' : 'none';

    // 海盜技能（極限迴避 + 蓄能激發）
    const hasBulletTime = !!config?.bulletTime;
    const hasEnergy = !!config?.energyCharge;
    $('pirate-acc-row').style.display = hasBulletTime ? 'flex' : 'none';
    $('energy-name').style.display = hasEnergy ? '' : 'none';
    $('energy-wrap').style.display = hasEnergy ? '' : 'none';
    $('bullet-time-wrap').classList.toggle('field-value-mid', hasEnergy);

    // 命中欄位（法師隱藏半邊）
    const showAcc = !mage;
    $('equip-acc-label').style.display = showAcc ? '' : 'none';
    $('equip-acc-wrap').style.display  = showAcc ? '' : 'none';
    $('elixir-acc-label').style.display = showAcc ? '' : 'none';
    $('elixir-acc-wrap').style.display  = showAcc ? '' : 'none';
    $('armor-atk-cell').classList.toggle('field-value-mid', showAcc);
    $('elixir-atk-cell').classList.toggle('field-value-mid', showAcc);
    $('elixir-acc-detail-label').style.display = showAcc ? '' : 'none';
    $('elixir-acc-detail-wrap').style.display  = showAcc ? '' : 'none';
    $('elixir-atk-detail-cell').classList.toggle('field-value-mid', showAcc);
    $('angel-blessing-label').style.display = showAcc ? 'flex' : 'none';
    $('potion-divider').style.display = showAcc ? '' : 'none';
    buildPotionOptions();
    if (dom.potionBuff.checked) applyPotionBuff();

    // 投射物種類選擇
    const hasProjectile = !!config?.projectile;
    $('projectile-divider').style.display = hasProjectile ? '' : 'none';
    $('projectile-buff-label').style.display = hasProjectile ? 'flex' : 'none';
    if (hasProjectile) {
        buildProjectileOptions();
        if (dom.projectileBuff.checked) applyProjectileBuff();
    }

    dom.accuracyField.style.display = mage ? 'none' : 'contents';
    document.querySelectorAll('.atk-spacer').forEach(el => el.style.display = mage ? '' : 'none');

    updateWeaponCoeff();
    updateMasteryName();
    updateMasteryLabel();
    updateExpertLabel();
    updateHexLabel();
    updateConcentrateLabel();
    updateBoaLabel();
    updateFocusLabel();
    updateBulletTimeLabel();
    updateEnergyLabel();

    if (typeof equipMode !== 'undefined' && equipMode === 'detail') {
        syncEquipToAttack();
    }

    fitJobSelect();
    updateAttack();
}

function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function setTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    dom.themeToggle.innerHTML = dark ? SUN_SVG : MOON_SVG;
}

function setCharMode(mode) {
    charMode = mode;
    const s = $('char-mode-summary');
    const d = $('char-mode-detail');
    if (mode === 'detail') {
        s.classList.remove('active');
        d.classList.add('active');
        $('char-mode').checked = true;
    } else {
        s.classList.add('active');
        d.classList.remove('active');
        $('char-mode').checked = false;
    }
    updateJobOptions();
    saveState();
}

function updateJobOptions() {
    for (const opt of dom.job.options) {
        opt.textContent = charMode === 'detail'
            ? (JOB_DETAIL_LABELS[opt.value] || opt.value)
            : opt.value;
    }
    fitJobSelect();
}

function fitJobSelect() {
    const sel = dom.job;
    const opt = sel.options[sel.selectedIndex];
    if (!opt) return;
    const cs = getComputedStyle(sel);
    const span = document.createElement('span');
    span.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;';
    span.style.font = cs.font;
    span.style.letterSpacing = cs.letterSpacing;
    document.body.appendChild(span);
    span.textContent = opt.textContent;
    sel.style.setProperty('width', (span.offsetWidth + 28) + 'px', 'important');
    span.remove();
}

function initCharacter() {
    $('char-mode').addEventListener('change', function () {
        setCharMode(this.checked ? 'detail' : 'summary');
    });

    dom.job.addEventListener('change', updateJobUI);

    dom.level.addEventListener('blur', () => {
        dom.level.value = clamp(parseInt(dom.level.value), 1, MAX_LEVEL);
        const cur = parseInt(dom.level.value);
        if (cur < prevLevel) resetStats();
        prevLevel = cur;
        updateAttributes();
        updateTotals();
        updateAttack();
    });

    dom.level.addEventListener('input', updateTotals);

    dom.weaponType.addEventListener('change', () => {
        updateWeaponCoeff();
        updateMasteryName();
        updateAttack();
    });

    dom.themeToggle.addEventListener('click', () => setTheme(!isDark()));

    $('btn-reset-char').addEventListener('click', resetCharacter);
}

function updateExpertLabel() {
    const config = JOB_CONFIG[getJob()];
    const enhSkill = config?.expert || config?.beholder;
    if (!enhSkill) {
        dom.expertInfo.textContent = '';
        return;
    }
    const enhMax   = config?.expertMax || config?.beholderMax;
    const expertLv = clamp(parseInt(dom.expert.value), 0, enhMax || 30);
    const atk      = enhMax ? 0 : getMasteryAtk(expertLv);
    dom.expertInfo.textContent = atk > 0 ? `+${atk}攻` : '';
}

function updateConcentrateLabel() {
    const config = JOB_CONFIG[getJob()];
    if (!config?.concentrate) {
        dom.concentrateInfo.textContent = '';
        return;
    }
    const lv  = clamp(parseInt(dom.concentrateLevel.value), 0, 30);
    const atk = lv > 0 ? 10 + Math.ceil(lv / 2) : 0;
    dom.concentrateInfo.textContent = atk > 0 ? `+${atk}攻` : '';
}

function updateHexLabel() {
    const config = JOB_CONFIG[getJob()];
    if (!config?.hexOfTheBeholder) {
        dom.hexInfo.textContent = '';
        return;
    }
    const lv  = clamp(parseInt(dom.hexLevel.value), 0, config.hexOfTheBeholderMax || 25);
    const atk = lv <= 15 ? 0 : Math.min(lv - 15, 5);
    dom.hexInfo.textContent = atk > 0 ? `+${atk}攻` : '';
}

function updateBoaLabel() {
    const lv = clamp(parseInt(dom.boaLevel.value), 0, 16);
    $('boa-info').textContent = lv > 0 ? `+${lv}命` : '';
}

function updateFocusLabel() {
    const lv = clamp(parseInt(dom.focusLevel.value), 0, 20);
    $('focus-info').textContent = lv > 0 ? `+${lv}命` : '';
}

function updateBulletTimeLabel() {
    const el = $('bullet-time-info');
    const lv = clamp(parseInt(dom.bulletTimeLevel.value), 0, 20);
    if (lv > 0) {
        el.textContent = `+${lv}命`;
        el.setAttribute('data-tooltip', `命中+${lv}`);
    } else {
        el.textContent = '';
        el.removeAttribute('data-tooltip');
    }
}

function updateEnergyLabel() {
    const el = $('energy-info');
    const config = JOB_CONFIG[getJob()];
    if (!config?.energyCharge) { el.innerHTML = ''; el.removeAttribute('data-tooltip'); return; }
    const lv  = clamp(parseInt(dom.energyLevel.value), 0, config.energyChargeMax || 40);
    const atk = lv > 0 ? 10 + Math.ceil(lv / 4) : 0;
    const acc = lv > 0 ? Math.ceil(lv / 2) : 0;
    if (atk > 0 && acc > 0) {
        el.innerHTML = `<span class="coeff-frac"><span>+${atk}攻</span><span>+${acc}命</span></span>`;
        el.setAttribute('data-tooltip', `攻擊+${atk}、命中+${acc}`);
    } else if (atk > 0) {
        el.textContent = `+${atk}攻`;
        el.setAttribute('data-tooltip', `攻擊+${atk}`);
    } else {
        el.innerHTML = '';
        el.removeAttribute('data-tooltip');
    }
}

function resetCharacter() {
    dom.level.value = 200;
    prevLevel = 200;
    updateJobUI();
    updateAttributes();
    updateTotals();
    updateAttack();
    saveState();
}
