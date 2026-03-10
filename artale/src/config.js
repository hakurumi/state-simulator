// ────────────────────────────────
//  共用常數 & 設定
// ────────────────────────────────

const STORAGE_KEY = 'artale-sim-state';
const BASE_STAT  = 4;
const MAX_LEVEL  = 200;
const MAX_ATK    = 999;
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
        bulletTime: '極限迴避',       // 1轉, +lv acc, max 20
    },
    '海盜 (拳霸)': {
        main: 'str', sub: 'dex',
        coeff: [4.8, 4.8],
        weapon: '指虎',
        mastery: '精通指虎',
        accCoeff: [0.6, 0.3],
        bulletTime: '極限迴避',       // 1轉, +lv acc, max 20
        energyCharge: '蓄能激發',     // 3轉, max 40, +10+ceil(lv/4) atk, +ceil(lv/2) acc
        energyChargeMax: 40,
    },
};

const JOB_DETAIL_LABELS = {
    '劍士 (英雄)':       '劍士-狂戰士-十字軍-英雄',
    '劍士 (聖騎士)':     '劍士-見習騎士-騎士-聖騎士',
    '劍士 (黑騎士)':     '劍士-槍騎兵-龍騎士-黑騎士',
    '盜賊 (暗影神偷)':   '盜賊-俠盜-神偷-暗影神偷',
    '盜賊 (夜使者)':     '盜賊-刺客-暗殺者-夜使者',
    '弓箭手 (箭神)':     '弓箭手-獵人-遊俠-箭神',
    '弓箭手 (神射手)':   '弓箭手-弩弓手-狙擊手-神射手',
    '法師 (火毒大魔導士)': '法師-巫師(火毒)-魔導士(火毒)-大魔導士(火毒)',
    '法師 (冰雷大魔導士)': '法師-巫師(冰雷)-魔導士(冰雷)-大魔導士(冰雷)',
    '法師 (主教)':       '法師-僧侶-祭司-主教',
    '海盜 (槍神)':       '海盜-槍手-神槍手-槍神',
    '海盜 (拳霸)':       '海盜-打手-格鬥家-拳霸',
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

const POTION_OPTIONS = [
    { value: 'snowflake',  label: '雪花',     atk: 20 },
    { value: 'atk-pill',   label: '攻擊藥丸', atk: 5 },
    { value: 'takoyaki',   label: '章魚燒',   atk: 8 },
    { value: 'dragon',     label: '龍血',     atk: 8 },
    { value: 'encourage',  label: '激勵',     atk: 10 },
];

const MAGE_POTION_OPTIONS = [
    { value: 'yakisoba',       label: '日式炒麵', atk: 10 },
    { value: 'ancient-sap',    label: '枯木樹液', atk: 10 },
    { value: 'magic-pill',     label: '魔力藥丸', atk: 5 },
    { value: 'magic-potion',   label: '魔力藥水', atk: 5 },
];

const STAR_OPTIONS = [
    { value: 'hwabi',   label: '月牙鏢',   atk: 28 },
    { value: 'ilbi',    label: '日之鏢',   atk: 27 },
    { value: 'steely',  label: '雷之鏢',   atk: 25 },
    { value: 'orange',  label: '橘子',     atk: 24 },
    { value: 'tobi',    label: '梅之鏢',   atk: 23 },
    { value: 'kumbi',   label: '雪花鏢',   atk: 21 },
    { value: 'mokbi',   label: '黑色利刃', atk: 19 },
    { value: 'wtop',    label: '木陀螺',   atk: 19 },
    { value: 'wolbi',   label: '迴旋鏢',   atk: 17 },
    { value: 'snow',    label: '雪球',     atk: 17 },
    { value: 'subi',    label: '海星鏢',   atk: 15 },
];

const BULLET_OPTIONS = [
    { value: 'shiny',   label: '閃耀子彈',   atk: 18 },
    { value: 'vital',   label: '活力子彈',   atk: 16 },
    { value: 'blaze',   label: '烈焰膠囊',   atk: 16 },
    { value: 'mighty',  label: '強力子彈',   atk: 14 },
];

const BOW_ARROW_OPTIONS = [
    { value: 'steel-bow',  label: '弓專用鋼鐵箭矢', atk: 2 },
    { value: 'bronze-bow', label: '弓專用青銅箭矢', atk: 1 },
    { value: 'arrow-bow',  label: '弓專用箭矢',     atk: 0 },
];

const XBOW_ARROW_OPTIONS = [
    { value: 'steel-xbow',  label: '弩專用鋼鐵箭矢', atk: 2 },
    { value: 'bronze-xbow', label: '弩專用青銅箭矢', atk: 1 },
    { value: 'arrow-xbow',  label: '弩專用箭矢',     atk: 0 },
];
