// ────────────────────────────────
//  共用常數 & 設定
// ────────────────────────────────

const STORAGE_KEY = 'artale-sim-state';
const BASE_STAT  = 4;
const MAX_LEVEL  = 200;
const MAX_ATK    = 512;
const MAX_EXTRA  = 999;
const ATTRS      = ['str', 'dex', 'int', 'luk'];

const WEAPON_COEFF = {
    '單手劍': [4.2, 4.2],
    '雙手劍': [4.8, 4.8],
    '單手斧': [3.6, 4.8],
    '雙手斧': [4.0, 5.2],
    '單手棍': [3.6, 4.8],
    '雙手棍': [4.0, 5.2],
    '槍武器': [3.6, 5.1],
    '矛武器': [3.5, 5.2],
};

const JOB_CONFIG = {
    '劍士 (英雄)': {
        main: 'str', sub: 'dex',
        weapons: ['單手劍', '雙手劍', '單手斧', '雙手斧'],
        // TODO: 鬥氣爆發 (4轉, max 30, +10+ceil(lv/2) atk, 6分鐘冷卻 buff)
    },
    '劍士 (聖騎士)': {
        main: 'str', sub: 'dex',
        weapons: ['單手劍', '雙手劍', '單手棍', '雙手棍'],
    },
    '劍士 (黑騎士)': {
        main: 'str', sub: 'dex',
        weapons: ['槍武器', '矛武器'],
        beholder: '暗之靈魂',
        beholderMax: 10,
        hexOfTheBeholder: '黑暗守護',
        hexOfTheBeholderMax: 25,
    },
    '盜賊 (暗影神偷)': {
        main: 'luk', sub: 'str+dex',
        coeff: [3.6, 4.2],
        weapon: '短劍',
        mastery: '精準之刀',
    },
    '盜賊 (夜使者)': {
        main: 'luk', sub: 'str+dex',
        coeff: [3.6, 3.6],
        weapon: '拳套',
        mastery: '精準暗器',
        projectile: '飛鏢攻擊',
    },
    '弓箭手 (箭神)': {
        main: 'dex', sub: 'str',
        coeff: [3.4, 3.4],
        weapon: '弓',
        mastery: '精準之弓',
        projectile: '箭矢攻擊',
        expert: '弓術精通',
        concentrate: '念力集中',         // 4轉, +10+ceil(lv/2) atk, max 30
        blessingOfAmazon: '精準強化',   // 1轉, +lv acc passive, max 16
        focus: '集中術',                // 1轉, +lv acc buff, max 20
    },
    '弓箭手 (神射手)': {
        main: 'dex', sub: 'str',
        coeff: [3.6, 3.6],
        weapon: '弩',
        mastery: '精準之弩',
        projectile: '箭矢攻擊',
        expert: '弩術精通',
        blessingOfAmazon: '精準強化',   // 1轉, +lv acc passive, max 16
        focus: '集中術',                // 1轉, +lv acc buff, max 20
    },
    '海盜 (槍神)': {
        main: 'dex', sub: 'str',
        coeff: [3.6, 3.6],
        weapon: '火槍',
        mastery: '精通槍法',
        projectile: '子彈攻擊',
        accCoeff: [0.9, 0.3],
    },
    '海盜 (拳霸)': {
        main: 'str', sub: 'dex',
        coeff: [4.8, 4.8],
        weapon: '指虎',
        mastery: '精通指虎',
        accCoeff: [0.6, 0.3],
    },
    // TODO: 法師 (主教) 天使祝福 (2轉, max 20, +lv 命中/迴避/防禦)
};

const SWORD_PROFICIENCY = {
    '槍': '精準之槍',
    '矛': '精準之矛',
    '劍': '精準之劍',
    '斧': '精準之斧',
    '棍': '精準之棍',
};

const SUN_SVG  = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
const MOON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

// ────────────────────────────────
//  工具函式
// ────────────────────────────────

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, isNaN(val) ? min : val));
}

const $ = (id) => document.getElementById(id);

function getVal(id, fallback = 0) {
    return parseInt($(id).value) || fallback;
}

function getMasteryBonus(level) {
    return Math.ceil(level / 5) * 5;
}

function getMasteryAtk(level) {
    return level < 3 ? 0 : Math.floor(level / 3);
}

const EQUIP_DETAIL_KEY = 'artale-sim-equip-detail';

const EQUIPMENT_SLOTS = [
    { id: 'weapon',  label: '武器' },
    { id: 'hat',     label: '帽子' },
    { id: 'top',     label: '上衣',  mutex: 'overall' },
    { id: 'bottom',  label: '下褲',  mutex: 'overall' },
    { id: 'overall', label: '套服',  mutex: 'top-bottom' },
    { id: 'gloves',  label: '手套' },
    { id: 'shoes',   label: '鞋子' },
    { id: 'cape',    label: '披風' },
    { id: 'shield',  label: '盾牌' },
    { id: 'earring', label: '耳環' },
    { id: 'face',    label: '臉飾' },
    { id: 'eye',     label: '眼飾' },
    { id: 'pendant', label: '墜飾' },
    { id: 'medal',   label: '勳章' },
];

const EQUIP_STATS = ['str', 'dex', 'int', 'luk', 'atk', 'matk', 'acc'];
const EQUIP_STAT_LABELS = { str:'力', dex:'敏', int:'智', luk:'幸', atk:'攻', matk:'魔', acc:'命' };
const EQUIP_STAT_TITLES = { str:'力量', dex:'敏捷', int:'智慧', luk:'幸運', atk:'攻擊力', matk:'魔法攻擊力', acc:'命中' };
