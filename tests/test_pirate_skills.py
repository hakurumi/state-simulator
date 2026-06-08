"""Pirate skill tests (Bullet Time + Energy Charge)."""
from playwright.sync_api import expect

from helpers import (
    _select_job, _get_share_url, _open_share_url, _export_config, _import_file,
)


def test_bullet_time_visible_for_gunslinger(fresh_page):
    """槍神：顯示極限迴避，不顯示蓄能激發。"""
    _select_job(fresh_page, "海盜 (槍神)")
    assert fresh_page.locator("#pirate-acc-row").is_visible()
    assert fresh_page.locator("#bullet-time-name").is_visible()
    assert not fresh_page.locator("#energy-name").is_visible()
    assert not fresh_page.locator("#energy-wrap").is_visible()


def test_bullet_time_and_energy_visible_for_brawler(fresh_page):
    """拳霸：顯示極限迴避 + 蓄能激發。"""
    _select_job(fresh_page, "海盜 (拳霸)")
    assert fresh_page.locator("#pirate-acc-row").is_visible()
    assert fresh_page.locator("#bullet-time-name").is_visible()
    assert fresh_page.locator("#energy-name").is_visible()
    assert fresh_page.locator("#energy-wrap").is_visible()


def test_pirate_row_hidden_for_non_pirate(fresh_page):
    """非海盜職業：pirate-acc-row 隱藏。"""
    for job in ["劍士 (英雄)", "弓箭手 (箭神)", "盜賊 (夜使者)"]:
        _select_job(fresh_page, job)
        assert not fresh_page.locator("#pirate-acc-row").is_visible()


def test_bullet_time_accuracy(fresh_page):
    """極限迴避加命中：lv=15 → +15 命中。"""
    _select_job(fresh_page, "海盜 (槍神)")
    acc_before = int(fresh_page.text_content("#accuracy-display"))
    fresh_page.fill("#bullet-time-level", "15")
    fresh_page.locator("#bullet-time-level").blur()
    fresh_page.wait_for_timeout(200)
    acc_after = int(fresh_page.text_content("#accuracy-display"))
    assert acc_after - acc_before == 15


def test_bullet_time_label(fresh_page):
    """極限迴避 label 顯示 +lv命。"""
    _select_job(fresh_page, "海盜 (槍神)")
    fresh_page.fill("#bullet-time-level", "10")
    fresh_page.locator("#bullet-time-level").blur()
    expect(fresh_page.locator("#bullet-time-info")).to_have_text("+10命")

    fresh_page.fill("#bullet-time-level", "0")
    fresh_page.locator("#bullet-time-level").blur()
    expect(fresh_page.locator("#bullet-time-info")).to_have_text("")


def test_energy_charge_attack_and_accuracy(fresh_page):
    """蓄能激發 lv=20 → +15攻 +10命。"""
    _select_job(fresh_page, "海盜 (拳霸)")
    acc_before = int(fresh_page.text_content("#accuracy-display"))
    atk_text_before = fresh_page.text_content("#attack-display")

    fresh_page.fill("#energy-level", "20")
    fresh_page.locator("#energy-level").blur()
    fresh_page.wait_for_timeout(200)

    acc_after = int(fresh_page.text_content("#accuracy-display"))
    # ceil(20/2) = 10
    assert acc_after - acc_before == 10

    # label: +15攻 +10命  (10 + ceil(20/4) = 15)
    label = fresh_page.text_content("#energy-info")
    assert "+15攻" in label
    assert "+10命" in label


def test_energy_charge_label_zero(fresh_page):
    """蓄能激發 lv=0 → label 為空。"""
    _select_job(fresh_page, "海盜 (拳霸)")
    fresh_page.fill("#energy-level", "0")
    fresh_page.locator("#energy-level").blur()
    expect(fresh_page.locator("#energy-info")).to_have_text("")


def test_energy_charge_max_clamped(fresh_page):
    """蓄能激發最大等級 40，超過會被 clamp。"""
    _select_job(fresh_page, "海盜 (拳霸)")
    fresh_page.fill("#energy-level", "99")
    fresh_page.locator("#energy-level").blur()
    expect(fresh_page.locator("#energy-level")).to_have_value("40")


def test_reset_clears_pirate_skills(fresh_page):
    """重置後海盜技能欄位歸零。"""
    _select_job(fresh_page, "海盜 (拳霸)")
    fresh_page.fill("#bullet-time-level", "15")
    fresh_page.locator("#bullet-time-level").blur()
    fresh_page.fill("#energy-level", "30")
    fresh_page.locator("#energy-level").blur()
    fresh_page.wait_for_timeout(200)

    fresh_page.click("#btn-reset-equip")
    fresh_page.wait_for_timeout(300)

    assert fresh_page.input_value("#bullet-time-level") == "0"
    assert fresh_page.input_value("#energy-level") == "0"
    assert fresh_page.text_content("#bullet-time-info") == ""
    assert fresh_page.text_content("#energy-info") == ""


def test_share_restores_pirate_skills(fresh_page, context):
    """分享連結還原海盜技能等級。"""
    _select_job(fresh_page, "海盜 (拳霸)")
    fresh_page.fill("#bullet-time-level", "18")
    fresh_page.locator("#bullet-time-level").blur()
    fresh_page.fill("#energy-level", "35")
    fresh_page.locator("#energy-level").blur()
    fresh_page.wait_for_timeout(200)

    expected_acc = fresh_page.text_content("#accuracy-display")

    url = _get_share_url(fresh_page, context)
    page2 = _open_share_url(context, url)

    assert page2.input_value("#job") == "海盜 (拳霸)"
    assert page2.input_value("#bullet-time-level") == "18"
    assert page2.input_value("#energy-level") == "35"
    assert page2.text_content("#accuracy-display") == expected_acc
    page2.close()


def test_import_restores_pirate_skills(fresh_page):
    """匯出再匯入還原海盜技能等級。"""
    _select_job(fresh_page, "海盜 (拳霸)")
    fresh_page.fill("#bullet-time-level", "12")
    fresh_page.locator("#bullet-time-level").blur()
    fresh_page.fill("#energy-level", "25")
    fresh_page.locator("#energy-level").blur()
    fresh_page.wait_for_timeout(200)

    expected_bt = fresh_page.input_value("#bullet-time-level")
    expected_ec = fresh_page.input_value("#energy-level")

    # export
    dl_path = _export_config(fresh_page).path()

    # change values
    _select_job(fresh_page, "劍士 (英雄)")
    fresh_page.wait_for_timeout(200)

    # import
    _import_file(fresh_page, dl_path)

    assert fresh_page.input_value("#job") == "海盜 (拳霸)"
    assert fresh_page.input_value("#bullet-time-level") == expected_bt
    assert fresh_page.input_value("#energy-level") == expected_ec
