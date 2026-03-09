// ────────────────────────────────
//  裝備詳細模式
// ────────────────────────────────

let equipMode  = 'summary';   // 'summary' | 'detail'
let armorMode  = 'top-bottom'; // 'top-bottom' | 'overall'
let equipData  = {};
let equipDetailReady = false;

function makeEmptySlot() {
    return { str: 0, dex: 0, int: 0, luk: 0, atk: 0, matk: 0, acc: 0 };
}

function initEquipData() {
    EQUIPMENT_SLOTS.forEach(s => {
        if (!equipData[s.id]) equipData[s.id] = makeEmptySlot();
    });
}

// ── 表格建構 ──

function buildEquipGrid() {
    const grid = $('equip-grid');
    grid.innerHTML = '';

    const table = document.createElement('div');
    table.className = 'equip-grid-table';

    // header row
    const corner = document.createElement('div');
    corner.className = 'equip-grid-header';
    corner.textContent = '';
    table.appendChild(corner);

    EQUIP_STATS.forEach(stat => {
        const h = document.createElement('div');
        h.className = 'equip-grid-header has-tooltip';
        h.textContent = EQUIP_STAT_LABELS[stat];
        h.setAttribute('data-tooltip', EQUIP_STAT_TITLES[stat]);
        table.appendChild(h);
    });

    // slot rows
    EQUIPMENT_SLOTS.forEach(slot => {
        const label = document.createElement('div');
        label.className = 'equip-grid-label';
        label.id = `equip-label-${slot.id}`;
        label.textContent = slot.label;

        if (['top', 'bottom', 'overall'].includes(slot.id)) {
            label.classList.add('clickable', 'has-tooltip');

            let pressTimer;
            let skipClick = false;

            label.addEventListener('click', () => {
                if (skipClick) { skipClick = false; return; }
                armorMode = slot.id === 'overall' ? 'overall' : 'top-bottom';
                updateArmorMode();
            });

            label.addEventListener('touchstart', () => {
                skipClick = false;
                pressTimer = setTimeout(() => {
                    skipClick = true;
                    label.classList.add('show-tooltip');
                }, 400);
            }, { passive: true });

            label.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
                if (skipClick) {
                    setTimeout(() => label.classList.remove('show-tooltip'), 1500);
                }
            });

            label.addEventListener('touchmove', () => {
                clearTimeout(pressTimer);
                label.classList.remove('show-tooltip');
                skipClick = false;
            }, { passive: true });
        }

        table.appendChild(label);

        EQUIP_STATS.forEach(stat => {
            const cell = document.createElement('div');
            cell.className = 'equip-grid-cell';
            cell.id = `equip-cell-${slot.id}-${stat}`;

            const input = document.createElement('input');
            input.type = 'number';
            input.id = `equip-${slot.id}-${stat}`;
            input.value = equipData[slot.id][stat] || 0;
            input.min = 0;
            input.max = stat === 'atk' || stat === 'matk' ? MAX_ATK : MAX_EXTRA;

            input.addEventListener('blur', () => {
                const max = stat === 'atk' || stat === 'matk' ? MAX_ATK : MAX_EXTRA;
                input.value = clamp(parseInt(input.value), 0, max);
                equipData[slot.id][stat] = parseInt(input.value) || 0;
                onEquipDataChange();
            });

            input.addEventListener('input', () => {
                equipData[slot.id][stat] = parseInt(input.value) || 0;
                onEquipDataChange();
            });

            cell.appendChild(input);
            table.appendChild(cell);
        });
    });

    // total row
    const totalLabel = document.createElement('div');
    totalLabel.className = 'equip-grid-total-label';
    totalLabel.textContent = '合計';
    table.appendChild(totalLabel);

    EQUIP_STATS.forEach(stat => {
        const cell = document.createElement('div');
        cell.className = 'equip-grid-total';
        cell.id = `equip-total-${stat}`;
        cell.textContent = '0';
        table.appendChild(cell);
    });

    grid.appendChild(table);
    updateArmorMode();
}

// ── 互斥：上衣+下褲 vs 套服 ──

function updateArmorMode() {
    const isOverall = armorMode === 'overall';
    const disableSlots  = isOverall ? ['top', 'bottom'] : ['overall'];
    const enableSlots   = isOverall ? ['overall'] : ['top', 'bottom'];

    disableSlots.forEach(id => {
        const label = $(`equip-label-${id}`);
        if (label) {
            label.classList.add('disabled');
            label.classList.remove('armor-active');
            label.setAttribute('data-tooltip',
                id === 'overall' ? '切換至套服' : '切換至上衣+下褲');
        }
        EQUIP_STATS.forEach(stat => {
            const cell = $(`equip-cell-${id}-${stat}`);
            if (cell) cell.classList.add('disabled');
            const input = $(`equip-${id}-${stat}`);
            if (input) {
                input.value = 0;
                equipData[id][stat] = 0;
            }
        });
    });

    enableSlots.forEach(id => {
        const label = $(`equip-label-${id}`);
        if (label) {
            label.classList.remove('disabled');
            label.classList.add('armor-active');
            label.removeAttribute('data-tooltip');
        }
        EQUIP_STATS.forEach(stat => {
            const cell = $(`equip-cell-${id}-${stat}`);
            if (cell) cell.classList.remove('disabled');
        });
    });

    onEquipDataChange();
}

// ── 模式切換 ──

function setEquipMode(mode) {
    equipMode = mode;
    const isDetail = mode === 'detail';

    // toggle labels
    $('mode-summary').classList.toggle('active', !isDetail);
    $('mode-detail').classList.toggle('active', isDetail);
    $('equip-mode').checked = isDetail;

    // show/hide rows
    $('row-weapon').style.display        = isDetail ? 'none' : 'flex';
    $('row-armor').style.display         = isDetail ? 'none' : 'flex';
    $('row-elixir').style.display        = isDetail ? 'none' : 'flex';
    $('row-elixir-detail').style.display = isDetail ? 'flex' : 'none';

    // projectile row in detail mode
    const hasProjectile = dom.projectileWrap.style.display !== 'none';
    $('row-projectile-detail').style.display = isDetail && hasProjectile ? 'flex' : 'none';
    if (isDetail && hasProjectile) {
        $('projectile-label-detail').textContent = dom.projectileLabel.textContent;
    }

    // equip detail section
    $('equip-detail-section').style.display = isDetail ? '' : 'none';

    // sync elixir & projectile values
    if (isDetail) {
        $('elixir-atk-detail').value = $('elixir-atk').value;
        $('elixir-acc-detail').value = $('elixir-acc').value;
        if (hasProjectile) $('projectile-atk-detail').value = dom.projectileAtk.value;
    } else {
        $('elixir-atk').value = $('elixir-atk-detail').value;
        $('elixir-acc').value = $('elixir-acc-detail').value;
        if (hasProjectile) dom.projectileAtk.value = $('projectile-atk-detail').value;
    }

    // potion buff: re-apply disabled state & value after elixir sync
    if (dom.potionBuff.checked) {
        const chosen = getPotionList().find(p => p.value === dom.potionSelect.value);
        const atk = chosen ? chosen.atk : 0;
        dom.elixirAtk.value = atk;
        $('elixir-atk-detail').value = atk;
        dom.elixirAtk.disabled = true;
        $('elixir-atk-detail').disabled = true;
        dom.elixirAtk.style.opacity = '0.6';
        $('elixir-atk-detail').style.opacity = '0.6';
    }

    // extra fields readonly
    ATTRS.forEach(a => {
        const el = $(`extra-${a}`);
        el.readOnly = isDetail;
        el.style.opacity = isDetail ? '0.6' : '';
    });

    if (isDetail) {
        importSummaryToDetail();
        syncEquipToExtra();
        syncEquipToAttack();
    }

    updateAttack();
    saveEquipDetail();
}

// ── 資料同步 ──

function getActiveSlots() {
    const disabled = armorMode === 'overall' ? ['top', 'bottom'] : ['overall'];
    return EQUIPMENT_SLOTS.filter(s => !disabled.includes(s.id));
}

function importSummaryToDetail() {
    const atkKey = isMage() ? 'matk' : 'atk';

    // weapon atk: always sync from summary
    const weaponVal = parseInt(dom.weaponAtk.value) || 0;
    equipData.weapon[atkKey] = weaponVal;
    const weaponInput = $(`equip-weapon-${atkKey}`);
    if (weaponInput) weaponInput.value = weaponVal;

    // elixir already handled in setEquipMode

    updateEquipTotals();
}

function syncEquipToExtra() {
    ATTRS.forEach(attr => {
        const sum = getActiveSlots().reduce((s, slot) => s + (equipData[slot.id][attr] || 0), 0);
        $(`extra-${attr}`).value = sum;
    });
    updateTotals();
}

function syncEquipToAttack() {
    const mage = isMage();
    const atkKey = mage ? 'matk' : 'atk';

    // weapon atk
    const weaponVal = Math.max(1, equipData.weapon[atkKey] || 0);
    dom.weaponAtk.value = weaponVal;

    // armor atk (all non-weapon active slots)
    const armorSum = getActiveSlots()
        .filter(s => s.id !== 'weapon')
        .reduce((sum, s) => sum + (equipData[s.id][atkKey] || 0), 0);
    dom.armorAtk.value = armorSum;

    // projectile: sync from detail input
    const projDetail = $('projectile-atk-detail');
    dom.projectileAtk.value = projDetail ? parseInt(projDetail.value) || 0 : 0;

    // equip acc
    const accSum = getActiveSlots().reduce((sum, s) => sum + (equipData[s.id].acc || 0), 0);
    dom.equipAcc.value = accSum;
}

function updateEquipTotals() {
    const active = getActiveSlots();
    EQUIP_STATS.forEach(stat => {
        const sum = active.reduce((s, slot) => s + (equipData[slot.id][stat] || 0), 0);
        const el = $(`equip-total-${stat}`);
        if (el) el.textContent = sum;
    });
}

function onEquipDataChange() {
    updateEquipTotals();
    if (equipMode === 'detail') {
        syncEquipToExtra();
        syncEquipToAttack();
        updateAttack();
    }
    saveEquipDetail();
}

// ── 存取 ──

function saveEquipDetail() {
    if (!equipDetailReady) return;
    const data = {
        mode: equipMode,
        armorMode: armorMode,
        equip: equipData,
        elixirDetail: parseInt($('elixir-atk-detail').value) || 0,
        elixirAccDetail: parseInt($('elixir-acc-detail').value) || 0,
        projectileDetail: parseInt($('projectile-atk-detail').value) || 0,
    };
    localStorage.setItem(EQUIP_DETAIL_KEY, JSON.stringify(data));
}

function loadEquipDetail() {
    const raw = localStorage.getItem(EQUIP_DETAIL_KEY);
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        if (data.equip) {
            EQUIPMENT_SLOTS.forEach(s => {
                if (data.equip[s.id]) {
                    equipData[s.id] = { ...makeEmptySlot(), ...data.equip[s.id] };
                }
            });
        }
        if (data.armorMode) armorMode = data.armorMode;
        // restore grid values
        EQUIPMENT_SLOTS.forEach(slot => {
            EQUIP_STATS.forEach(stat => {
                const input = $(`equip-${slot.id}-${stat}`);
                if (input) input.value = equipData[slot.id][stat] || 0;
            });
        });
        updateArmorMode();
        // restore elixir detail values
        if (data.elixirDetail != null) $('elixir-atk-detail').value = data.elixirDetail;
        if (data.elixirAccDetail != null) $('elixir-acc-detail').value = data.elixirAccDetail;
        if (data.projectileDetail != null) $('projectile-atk-detail').value = data.projectileDetail;
        // restore equip mode last
        if (data.mode) setEquipMode(data.mode);
    } catch { /* ignore */ }
}

function resetEquipDetail() {
    EQUIPMENT_SLOTS.forEach(s => {
        equipData[s.id] = makeEmptySlot();
        EQUIP_STATS.forEach(stat => {
            const input = $(`equip-${s.id}-${stat}`);
            if (input) input.value = 0;
        });
    });
    $('elixir-atk-detail').value = 0;
    $('elixir-acc-detail').value = 0;
    $('projectile-atk-detail').value = 0;
    onEquipDataChange();
}

// ── 初始化 ──

function initEquipDetail() {
    initEquipData();
    buildEquipGrid();

    // mode toggle
    $('equip-mode').addEventListener('change', () => {
        setEquipMode($('equip-mode').checked ? 'detail' : 'summary');
    });

    // elixir detail sync
    $('elixir-atk-detail').addEventListener('blur', () => {
        const v = clamp(parseInt($('elixir-atk-detail').value), 0, MAX_ATK);
        $('elixir-atk-detail').value = v;
        $('elixir-atk').value = v;
        updateAttack();
    });

    $('elixir-atk-detail').addEventListener('input', () => {
        $('elixir-atk').value = parseInt($('elixir-atk-detail').value) || 0;
        updateAttack();
    });

    // projectile detail sync
    $('projectile-atk-detail').addEventListener('blur', () => {
        const v = clamp(parseInt($('projectile-atk-detail').value), 0, MAX_ATK);
        $('projectile-atk-detail').value = v;
        dom.projectileAtk.value = v;
        updateAttack();
    });

    $('projectile-atk-detail').addEventListener('input', () => {
        dom.projectileAtk.value = parseInt($('projectile-atk-detail').value) || 0;
        updateAttack();
    });

    // elixir acc detail sync
    $('elixir-acc-detail').addEventListener('blur', () => {
        const v = clamp(parseInt($('elixir-acc-detail').value), 0, MAX_EXTRA);
        $('elixir-acc-detail').value = v;
        $('elixir-acc').value = v;
        updateAttack();
    });

    $('elixir-acc-detail').addEventListener('input', () => {
        $('elixir-acc').value = parseInt($('elixir-acc-detail').value) || 0;
        updateAttack();
    });

    loadEquipDetail();
    equipDetailReady = true;
}
