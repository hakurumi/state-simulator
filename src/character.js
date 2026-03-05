// ────────────────────────────────
//  角色資訊
// ────────────────────────────────

let prevLevel = getVal('level', 1);

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

    const masteryLv = config.mastery ? clamp(parseInt(dom.mastery.value), 0, 30) : 0;
    const totalAtk  = weapon + armor + projectile + elixir + getMasteryAtk(masteryLv);
    const prof      = (Math.ceil(getVal('proficiency') / 2) * 5 + 10 + getMasteryBonus(masteryLv)) / 100;

    const max = Math.floor((mainAttr * coeffMax + subAttr) * totalAtk / 100) || 1;
    const min = Math.floor((mainAttr * coeffMin * 0.9 * prof + subAttr) * totalAtk / 100) || 1;

    dom.attackDisplay.textContent = `${min}\u2007~\u2007${max}`;

    // 命中計算
    const accCoeff = config.accCoeff || [0.8, 0.5];
    const accBase  = Math.floor(getStat('dex') * accCoeff[0] + getStat('luk') * accCoeff[1]);
    const equipAcc = clamp(parseInt(dom.equipAcc.value), 0, MAX_EXTRA);
    const elixirAcc = clamp(parseInt(dom.elixirAcc.value), 0, MAX_EXTRA);
    const profLv   = clamp(parseInt(dom.proficiency.value), 0, 20);
    const profAcc  = profLv <= 6 || profLv >= 19 ? profLv : Math.floor(profLv / 2) * 2;
    const totalAcc = accBase + profAcc + equipAcc + elixirAcc;
    dom.accuracyField.style.display = 'contents';
    dom.accuracyDisplay.textContent = totalAcc;

    saveState();
}

function updateProficiencyName() {
    const job    = getJob();
    const config = JOB_CONFIG[job];

    if (!config) {
        dom.proficiencyName.textContent = '';
        return;
    }

    let name = '';

    if (config.proficiency) {
        name = config.proficiency;
    } else if (config.weapons) {
        const wt  = dom.weaponType.value;
        const key = Object.keys(SWORD_PROFICIENCY).find(k => wt.includes(k));
        name = key ? SWORD_PROFICIENCY[key] : '';
    }

    dom.proficiencyName.textContent = name || '';
}

function updateJobUI() {
    const job    = getJob();
    const config = JOB_CONFIG[job];
    const mage   = isMage();

    // 屬性標籤
    updateAttrTags();

    // 精準技能
    dom.proficiencyGroup.style.display = mage ? 'none' : 'flex';

    // 武器類型（劍士系）
    const wrap = $('weapon-type-wrap');
    if (config?.weapons) {
        dom.weaponType.innerHTML = config.weapons
            .map(w => `<option value="${w}">${w}</option>`)
            .join('');
        wrap.style.display = 'flex';
    } else {
        wrap.style.display = 'none';
        dom.weaponType.innerHTML = '';
    }

    // 投射物
    if (config?.projectile) {
        dom.weaponAtkWrap.classList.add('field-value-mid');
        dom.projectileLabel.style.display = 'flex';
        dom.projectileLabel.textContent   = config.projectile;
        dom.projectileWrap.style.display  = 'flex';
    } else {
        dom.weaponAtkWrap.classList.remove('field-value-mid');
        dom.projectileLabel.style.display = 'none';
        dom.projectileWrap.style.display  = 'none';
    }

    // 精通技能（弓箭手四轉）
    if (config?.mastery) {
        dom.proficiencyWrap.classList.add('field-value-mid');
        $('proficiency-group').classList.add('mastery-active');
        dom.profPct.style.display = 'none';
        dom.masteryName.textContent = config.mastery;
    } else {
        dom.proficiencyWrap.classList.remove('field-value-mid');
        $('proficiency-group').classList.remove('mastery-active');
        dom.profPct.style.display = '';
    }

    // 命中欄位（法師隱藏）
    const accDisplay = mage ? 'none' : 'flex';
    if (equipMode !== 'detail') $('row-accuracy').style.display = accDisplay;
    dom.accuracyField.style.display = mage ? 'none' : 'contents';

    updateProficiencyName();
    updateMasteryLabel();

    if (typeof equipMode !== 'undefined' && equipMode === 'detail') {
        syncEquipToAttack();
    }

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

function initCharacter() {
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
        updateProficiencyName();
        updateAttack();
    });

    dom.themeToggle.addEventListener('click', () => setTheme(!isDark()));

    $('btn-reset-char').addEventListener('click', resetCharacter);
}

function updateMasteryLabel() {
    const config = JOB_CONFIG[getJob()];
    if (!config?.mastery) {
        dom.masteryInfo.textContent = '';
        return;
    }
    const profLv    = clamp(parseInt(dom.proficiency.value), 0, 20);
    const masteryLv = clamp(parseInt(dom.mastery.value), 0, 30);
    const combined  = Math.ceil(profLv / 2) * 5 + 10 + getMasteryBonus(masteryLv);
    const atk       = getMasteryAtk(masteryLv);
    dom.masteryInfo.textContent = atk > 0 ? `${combined}%+${atk}攻` : `${combined}%`;
}

function resetCharacter() {
    dom.level.value = 200;
    prevLevel = 200;
    updateJobUI();
}
