// ────────────────────────────────
//  能力值
// ────────────────────────────────

let lastEditedAttr = null;

function getStat(attr) {
    const base  = getVal(attr, BASE_STAT);
    const extra = getVal(`extra-${attr}`, 0);
    const maple = Math.floor(base * getMaplePct() / 100);
    return base + maple + extra;
}

function getLevelPoints() {
    const level = clamp(parseInt(dom.level.value), 1, MAX_LEVEL);
    dom.level.value = level;
    return (level - 1) * 5 + 9;
}

function getUsedPoints() {
    return ATTRS.reduce((sum, a) => sum + (getVal(a, BASE_STAT) - BASE_STAT), 0);
}

function updateAttributes() {
    const levelPoints = getLevelPoints();
    const totalCap    = levelPoints + BASE_STAT * ATTRS.length;
    const used        = {};
    let usedTotal     = 0;

    ATTRS.forEach(a => {
        const val  = Math.max(BASE_STAT, getVal(a, BASE_STAT));
        used[a]    = val;
        usedTotal += val - BASE_STAT;
    });

    if (usedTotal > totalCap && lastEditedAttr) {
        const othersUsed = Object.entries(used)
            .filter(([k]) => k !== lastEditedAttr)
            .reduce((sum, [, v]) => sum + (v - BASE_STAT), 0);

        used[lastEditedAttr] = BASE_STAT + Math.max(0, levelPoints - othersUsed);
        $(lastEditedAttr).value = used[lastEditedAttr];
    }

    ATTRS.forEach(a => { $(a).value = used[a]; });

    dom.points.textContent    = levelPoints;
    dom.remaining.textContent = levelPoints - getUsedPoints();
}

function updateTotals() {
    ATTRS.forEach(a => {
        $(`total-${a}`).textContent = getStat(a);
    });
}

function resetStats(extra = false) {
    ATTRS.forEach(a => {
        $(extra ? `extra-${a}` : a).value = extra ? 0 : BASE_STAT;
    });
    updateAttributes();
    updateTotals();
    updateAttack();
}

function updateAttrTags() {
    const job    = getJob();
    const config = JOB_CONFIG[job];
    const mage   = isMage();

    const tags = { str: '', dex: '', int: '', luk: '' };

    if (mage) {
        tags.int = '主屬性';
    } else if (config) {
        tags[config.main] = '主屬性';
        if (config.sub === 'str+dex') {
            tags.str = '副屬性';
            tags.dex = '副屬性';
        } else {
            tags[config.sub] = '副屬性';
        }
    }

    ATTRS.forEach(a => {
        const el = $(`tag-${a}`);
        el.textContent = tags[a];
        el.classList.toggle('active', !!tags[a]);
    });
}

function initAttributes() {
    ATTRS.forEach(a => {
        $(a).addEventListener('blur', () => {
            lastEditedAttr = a;
            updateAttributes();
            updateTotals();
            updateAttack();
        });
        $(a).addEventListener('input', updateTotals);
    });

    ATTRS.forEach(a => {
        const id = `extra-${a}`;
        $(id).addEventListener('blur', () => {
            $(id).value = clamp(parseInt($(id).value), 0, MAX_EXTRA);
            updateTotals();
            updateAttack();
        });
        $(id).addEventListener('input', updateTotals);
    });

    $('btn-reset-attr').addEventListener('click',  () => resetStats(false));
    $('btn-reset-extra').addEventListener('click', () => resetStats(true));
}
