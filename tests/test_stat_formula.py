"""Stat 顯示與命中公式 regression tests (Bug A + B 修正)."""

import pytest


def _select_job(page, job):
    page.select_option("#job", job)
    page.wait_for_timeout(200)


def _set_input(page, sel, val):
    page.fill(sel, str(val))
    page.locator(sel).blur()


# === Bug A: 楓葉祝福不再 double-count ===


def test_maple_blessing_does_not_double_count_str(fresh_page):
    """設定楓葉祝福 lv10，total STR 應等於 base + extra (不再加 maple)。"""
    _select_job(fresh_page, "弓箭手 (箭神)")
    _set_input(fresh_page, "#str", 72)
    _set_input(fresh_page, "#extra-str", 49)
    _set_input(fresh_page, "#maple-blessing", 10)
    fresh_page.wait_for_timeout(200)
    assert fresh_page.text_content("#total-str") == "121"


def test_maple_blessing_does_not_double_count_dex(fresh_page):
    _select_job(fresh_page, "弓箭手 (箭神)")
    _set_input(fresh_page, "#dex", 715)
    _set_input(fresh_page, "#extra-dex", 116)
    _set_input(fresh_page, "#maple-blessing", 10)
    fresh_page.wait_for_timeout(200)
    assert fresh_page.text_content("#total-dex") == "831"


def test_maple_blessing_lv0_keeps_stat_unchanged(fresh_page):
    """楓葉祝福 lv=0 時也應 = base + extra，與 lv>0 行為一致。"""
    _select_job(fresh_page, "弓箭手 (箭神)")
    _set_input(fresh_page, "#dex", 715)
    _set_input(fresh_page, "#extra-dex", 116)
    _set_input(fresh_page, "#maple-blessing", 0)
    fresh_page.wait_for_timeout(200)
    assert fresh_page.text_content("#total-dex") == "831"


# === Bug B: 弓箭手/盜賊 4 職業命中公式 ===


ARCHER_THIEF_JOBS = [
    "弓箭手 (箭神)",
    "弓箭手 (神射手)",
    "盜賊 (暗影神偷)",
    "盜賊 (夜使者)",
]


@pytest.mark.parametrize("job", ARCHER_THIEF_JOBS)
def test_archer_thief_acc_coefficient(fresh_page, job):
    """4 個職業命中公式應為 DEX × 0.6 + LUK × 0.3。"""
    _select_job(fresh_page, job)
    # 隔離 accCoeff：清掉所有技能/裝備加成
    _set_input(fresh_page, "#dex", 715)
    _set_input(fresh_page, "#extra-dex", 116)
    _set_input(fresh_page, "#luk", 4)
    _set_input(fresh_page, "#extra-luk", 22)
    for sel in [
        "#mastery",
        "#boa-level",
        "#focus-level",
        "#equip-acc",
        "#elixir-acc",
        "#expert",
        "#bullet-time-level",
        "#energy-level",
        "#concentrate-level",
    ]:
        loc = fresh_page.locator(sel)
        if loc.count() and loc.is_visible():
            _set_input(fresh_page, sel, 0)
    fresh_page.wait_for_timeout(200)
    # floor(831 × 0.6 + 26 × 0.3) = 506
    assert int(fresh_page.text_content("#accuracy-display")) == 506


# === 完整 end-to-end 案例 (對齊圖二) ===


def test_bowmaster_full_example_matches_game(fresh_page):
    """箭神 Lv155 完整案例：攻擊力 3277~4007，命中 596。"""
    _select_job(fresh_page, "弓箭手 (箭神)")
    _set_input(fresh_page, "#level", 155)
    _set_input(fresh_page, "#str", 72)
    _set_input(fresh_page, "#extra-str", 49)
    _set_input(fresh_page, "#dex", 715)
    _set_input(fresh_page, "#extra-dex", 116)
    _set_input(fresh_page, "#luk", 4)
    _set_input(fresh_page, "#extra-luk", 22)
    _set_input(fresh_page, "#weapon-atk", 113)
    _set_input(fresh_page, "#armor-atk", 12)
    _set_input(fresh_page, "#projectile-atk", 1)
    _set_input(fresh_page, "#mastery", 20)
    _set_input(fresh_page, "#expert", 30)
    _set_input(fresh_page, "#boa-level", 16)
    _set_input(fresh_page, "#focus-level", 20)
    _set_input(fresh_page, "#equip-acc", 34)
    _set_input(fresh_page, "#maple-blessing", 10)
    fresh_page.wait_for_timeout(300)

    assert fresh_page.text_content("#attack-display") == "3277 ~ 4007"
    assert int(fresh_page.text_content("#accuracy-display")) == 596


# === Bug C: 匯入時自動切換 equipMode ===


def test_import_summary_json_sets_summary_mode(fresh_page):
    """匯入精簡 JSON 後 equipMode 自動切到 'summary'，extra-* 維持正確。"""
    # 先切到 detail 製造「不對的初始狀態」
    fresh_page.click("#mode-detail")
    fresh_page.wait_for_timeout(200)
    assert fresh_page.evaluate("equipMode") == "detail"

    import_json = """{
      "job": "弓箭手 (箭神)", "level": "155",
      "weapon-atk": "113", "armor-atk": "12", "projectile-atk": "1",
      "equip-acc": "34", "mastery": "20", "expert": "30",
      "boa-level": "16", "focus-level": "20", "maple-blessing": "10",
      "str": "72", "dex": "715", "int": "4", "luk": "4",
      "extra-str": "49", "extra-dex": "116", "extra-int": "24", "extra-luk": "22"
    }"""
    fresh_page.evaluate(f"applyFullState({import_json})")
    fresh_page.wait_for_timeout(300)

    assert fresh_page.evaluate("equipMode") == "summary"
    assert int(fresh_page.text_content("#accuracy-display")) == 596
    assert fresh_page.input_value("#extra-dex") == "116"


def test_import_detail_json_sets_detail_mode(fresh_page):
    """匯入帶 equipData 的 JSON 自動切到 'detail'，skipSync 保留 extra-*。"""
    import_json = """{
      "job": "弓箭手 (箭神)",
      "equipData": {"weapon": {"atk": 113}, "hat": {"dex": 10}},
      "str": "72", "extra-str": "49", "extra-dex": "10"
    }"""
    fresh_page.evaluate(f"applyFullState({import_json})")
    fresh_page.wait_for_timeout(300)
    assert fresh_page.evaluate("equipMode") == "detail"
    assert fresh_page.input_value("#extra-dex") == "10"
