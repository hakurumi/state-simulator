"""Export / Import tests."""
import pytest

from helpers import _select_job, _set_input, _export_config, _import_file

# 涵蓋各大職系（戰士/弓手/盜賊/法師/海盜），確保匯出匯入對職業特定欄位都成立
ROUNDTRIP_JOBS = [
    "劍士 (英雄)",
    "弓箭手 (箭神)",
    "盜賊 (夜使者)",
    "法師 (主教)",
    "海盜 (拳霸)",
]


def test_export_downloads_json(fresh_page):
    download = _export_config(fresh_page)
    assert download.suggested_filename == "artale-config.json"


def test_import_restores_state(fresh_page):
    # set some values
    _select_job(fresh_page, "弓箭手 (箭神)")
    _set_input(fresh_page, "#str", 88)
    _set_input(fresh_page, "#weapon-atk", 250)
    fresh_page.wait_for_timeout(200)

    expected_job = fresh_page.input_value("#job")
    expected_str = fresh_page.input_value("#str")
    expected_watk = fresh_page.input_value("#weapon-atk")

    # export
    dl_path = _export_config(fresh_page).path()

    # change values
    _select_job(fresh_page, "劍士 (英雄)")
    _set_input(fresh_page, "#str", 4)
    fresh_page.wait_for_timeout(200)

    # import
    _import_file(fresh_page, dl_path)

    assert fresh_page.input_value("#job") == expected_job
    assert fresh_page.input_value("#str") == expected_str
    assert fresh_page.input_value("#weapon-atk") == expected_watk


@pytest.mark.parametrize("job", ROUNDTRIP_JOBS)
def test_export_reset_import_roundtrip(fresh_page, job):
    """匯出 → 全部重置（清除） → 匯入：完整 build 應原樣還原（跨職業）。

    對應使用者操作：截圖 → 匯出設定 → 清除 → 重新匯入。
    """
    _select_job(fresh_page, job)
    # maple 先設，再設屬性 / 裝備（涵蓋楓葉祝福 derive 到 extra-* 的互動）
    _set_input(fresh_page, "#maple-blessing", 8)
    _set_input(fresh_page, "#weapon-atk", 120)
    _set_input(fresh_page, "#armor-atk", 30)
    _set_input(fresh_page, "#str", 200)
    _set_input(fresh_page, "#extra-str", 40)
    fresh_page.wait_for_timeout(200)

    expected = {
        "weapon-atk": fresh_page.input_value("#weapon-atk"),
        "armor-atk": fresh_page.input_value("#armor-atk"),
        "extra-str": fresh_page.input_value("#extra-str"),
        "maple": fresh_page.input_value("#maple-blessing"),
        "attack": fresh_page.text_content("#attack-display"),
    }

    # 1) 匯出（真實下載檔）
    dl_path = _export_config(fresh_page).path()

    # 2) 全部重置（清除）
    fresh_page.on("dialog", lambda d: d.accept())
    fresh_page.click("#btn-settings")
    fresh_page.wait_for_timeout(200)
    fresh_page.click("#btn-reset-all")
    fresh_page.wait_for_timeout(300)
    assert fresh_page.input_value("#weapon-atk") == "1"  # 確認真的清除了

    # 3) 匯入剛剛匯出的檔
    _import_file(fresh_page, dl_path)

    # 4) 完整還原
    assert fresh_page.input_value("#job") == job
    assert fresh_page.input_value("#weapon-atk") == expected["weapon-atk"]
    assert fresh_page.input_value("#armor-atk") == expected["armor-atk"]
    assert fresh_page.input_value("#extra-str") == expected["extra-str"]
    assert fresh_page.input_value("#maple-blessing") == expected["maple"]
    assert fresh_page.text_content("#attack-display") == expected["attack"]
