"""Stat 顯示與命中公式 regression tests (Bug A + B 修正)."""

import pytest

from helpers import _select_job, _set_input


# === v2.19.5: 楓葉祝福 derived 到 extra-* 內 ===


def test_maple_blessing_lv10_derived_into_extra_str(fresh_page):
    """v2.19.5 設定楓葉祝福 lv10 後，extra-str 自動加上 mapleAdd=floor(72*5/100)=3，total=72+(49+3)=124。"""
    _select_job(fresh_page, "弓箭手 (箭神)")
    _set_input(fresh_page, "#str", 72)
    _set_input(fresh_page, "#extra-str", 49)
    _set_input(fresh_page, "#maple-blessing", 10)
    fresh_page.wait_for_timeout(200)
    assert fresh_page.input_value("#extra-str") == "52"
    assert fresh_page.text_content("#total-str") == "124"


def test_maple_blessing_lv10_derived_into_extra_dex(fresh_page):
    """同上 dex。mapleAdd=floor(715*5/100)=35，extra-dex=116+35=151，total=866。"""
    _select_job(fresh_page, "弓箭手 (箭神)")
    _set_input(fresh_page, "#dex", 715)
    _set_input(fresh_page, "#extra-dex", 116)
    _set_input(fresh_page, "#maple-blessing", 10)
    fresh_page.wait_for_timeout(200)
    assert fresh_page.input_value("#extra-dex") == "151"
    assert fresh_page.text_content("#total-dex") == "866"


def test_maple_blessing_lv0_keeps_stat_unchanged(fresh_page):
    """楓葉祝福 lv=0 時 mapleAdd=0，total = base + extra。"""
    _select_job(fresh_page, "弓箭手 (箭神)")
    _set_input(fresh_page, "#dex", 715)
    _set_input(fresh_page, "#extra-dex", 116)
    _set_input(fresh_page, "#maple-blessing", 0)
    fresh_page.wait_for_timeout(200)
    assert fresh_page.text_content("#total-dex") == "831"


def test_maple_blessing_toggle_off_restores_equip_extras(fresh_page):
    """maple lv10 → 0 時，腳本扣回 mapleAdd，extra-str 回到使用者設定的裝備值。"""
    _select_job(fresh_page, "弓箭手 (箭神)")
    _set_input(fresh_page, "#str", 72)
    _set_input(fresh_page, "#extra-str", 49)
    _set_input(fresh_page, "#maple-blessing", 10)
    fresh_page.wait_for_timeout(100)
    _set_input(fresh_page, "#maple-blessing", 0)
    fresh_page.wait_for_timeout(100)
    assert fresh_page.input_value("#extra-str") == "49"
    assert fresh_page.text_content("#total-str") == "121"


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
    # v2.19.5: maple 先設,後續 attrs blur 會把 mapleAdd 推進 extra-*,使用者輸入 extra=49/116/22 會被拆成裝備值
    _set_input(fresh_page, "#maple-blessing", 10)
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
