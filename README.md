# Artale 表攻計算模擬器

[![E2E Tests](https://github.com/hakurumi/state-simulator/actions/workflows/test.yml/badge.svg)](https://github.com/hakurumi/state-simulator/actions/workflows/test.yml)

楓之谷 Artale 的「表攻 / 命中」計算模擬器 —— 依職業、能力值、裝備與技能即時算出攻擊力區間與命中值。

**線上使用**：<https://hakurumi.github.io/state-simulator/artale/>

純前端單頁應用（vanilla HTML / CSS / JS，無打包步驟），測試以 Python Playwright E2E 撰寫，透過 GitHub Actions 在每次 push 自動驗證，並由 GitHub Pages 部署。

---

## 功能特色

- **12 個職業、5 大職系**
  - 劍士（英雄 / 聖騎士 / 黑騎士）
  - 弓箭手（箭神 / 神射手）
  - 盜賊（夜使者 / 暗影神偷）
  - 法師（火毒大魔導士 / 冰雷大魔導士 / 主教）
  - 海盜（槍神 / 拳霸）
- **即時計算**：攻擊力區間（最小～最大）與命中值，依職業主/副屬性、武器係數、熟練度等公式換算（法師顯示魔法攻擊力、隱藏命中）。
- **能力值配點**：依等級計算可分配點數，自動鉗制上限。
- **裝備兩種模式**
  - 摘要模式：直接填武器 / 防具 / 藥水攻擊與命中。
  - 詳細模式：20 個裝備欄位（武器、帽子、上衣 / 下褲 / 套服、手套、鞋子、披風、盾牌、耳環、臉飾、眼飾、墜飾、腰帶、肩章、戒指 1~4、勳章）× 7 種能力值（力 / 敏 / 智 / 幸 / 攻 / 魔 / 命），自動加總並同步回摘要。
- **技能加成**：熟練度、精通 / 眼魔強化、黑暗守護、念力集中、精準強化、集中術、極限迴避、蓄能激發、楓葉祝福、天使祝福。
- **藥水 / 投射物**：藥水攻擊 buff、投射物種類（飛鏢 / 子彈 / 弓箭 / 弩箭）自動帶入攻擊值。
- **狀態保存與分享**
  - localStorage 自動保存（回訪自動還原）。
  - 分享連結：壓縮後放進 URL hash（`CompressionStream` deflate-raw），等於預設值的欄位會省略以縮短連結。
  - 匯出 / 匯入 JSON 設定檔（完整欄位）。
- **深色 / 淺色主題切換**。

## 專案結構

```
.
├── index.html              # 根頁，轉址到 artale/
├── artale/
│   ├── index.html          # 應用主頁（畫面、樣式、版號 .version-label）
│   └── src/
│       ├── config.js       # 常數、JOB_CONFIG、EQUIPMENT_SLOTS、純計算 helper
│       ├── character.js    # 職業切換、攻擊力 / 命中計算
│       ├── equipment.js    # 摘要模式裝備技能欄位、藥水 / 投射物 / 楓葉祝福
│       ├── equipment-detail.js # 詳細模式裝備表格、加總、與摘要同步
│       ├── attributes.js   # 能力值配點、getStat
│       └── main.js         # DOM 快取、localStorage 存取、分享 / 匯入匯出、初始化入口
├── tests/                  # Python Playwright E2E 測試
└── .github/workflows/test.yml  # CI：push 到 master 跑 pytest
```

JS 以多個 `<script src>` 依序載入（`config.js` 最先），無模組打包、無相依套件。

## 架構重點

- `$()` = `document.getElementById()`。
- **計算入口** `updateAttack()`（character.js）依當前職業 `JOB_CONFIG` 取主 / 副屬性係數，結合能力值、武器 / 防具 / 投射物 / 藥水攻擊與各技能加成算出攻擊區間與命中。
- **能力值總值** `getStat(attr) = base(輸入值) + extra(extra-* 欄位顯示值)`。
- **楓葉祝福**：使用者輸入的 `str/dex/...` 是 base，楓葉 % 加成 derive 到 `extra-*` 欄位「顯示值」上；`extra-*` 同時兼任「裝備加值輸入」與「含楓葉的顯示值」，內部以 `equipExtras` 保存純裝備值。
- **裝備模式**透過 `setEquipMode('summary' | 'detail')` 切換；詳細模式表格由 `EQUIPMENT_SLOTS` 自動建列。
- **狀態還原契約**：分享連結 / 匯出檔以 `STATE_FIELDS` 為準；`applyFullState` 載入時會先以 `STATE_DEFAULTS` 補齊缺漏欄位（`{ ...STATE_DEFAULTS, ...state }`），確保 compact 分享連結 / 舊版設定檔不會殘留當前 session 的值造成污染。

## 本機開發

無需安裝任何依賴；用靜態伺服器開啟即可（建議用 server 而非 `file://`，確保分享壓縮等 API 正常）：

```bash
python3 -m http.server 8765
# 開啟 http://localhost:8765/artale/
```

直接編輯 `artale/index.html` 與 `artale/src/*.js`，重新整理即生效。

## 測試

E2E 測試使用 [Playwright (Python)](https://playwright.dev/python/) + pytest，位於 `tests/`。`conftest.py` 會自動在 8765 埠啟動靜態伺服器，測試結束自動關閉。

```bash
pip install playwright pytest pytest-playwright
playwright install chromium
pytest tests/
```

測試涵蓋：能力值 / 命中公式、各職業技能（海盜、投射物）、裝備欄位組成與同步、設定面板、重置、分享連結與匯出匯入 round-trip（含跨職業、楓葉祝福與 compact 分享連結的還原一致性）。

CI（`.github/workflows/test.yml`）在每次 push 到 `master` 時自動安裝 Chromium 並執行整套測試。

## 部署

GitHub Pages 由 `master` 分支根目錄提供服務。根 `index.html` 自動轉址到 `artale/`。push 到 `master` 後 Pages 會自動重新部署。

## 版號規則

格式 `vX.Y.Z`（顯示於 `artale/index.html` 的 `.version-label`，每次 commit 同步更新）：

- **X** 主版號：架構重構、重要內容方向調整
- **Y** 次版號：功能開發、功能優化
- **Z** 修訂號：bug 修復、非功能性調整

一次 commit 含多種異動時，取影響最大的版位遞增。
