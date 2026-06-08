"""裝備詳細模式欄位組成測試。"""
from helpers import _switch_detail

EXPECTED_SLOTS = [
    "武器", "帽子", "上衣", "下褲", "套服", "手套", "鞋子", "披風", "盾牌",
    "耳環", "臉飾", "眼飾", "墜飾", "腰帶", "肩章",
    "戒指1", "戒指2", "戒指3", "戒指4", "勳章",
]


def test_detail_mode_slot_composition(fresh_page):
    """詳細模式應有 20 個欄位，含腰帶/肩章/戒指1~4，順序固定。"""
    _switch_detail(fresh_page)
    labels = fresh_page.locator(".equip-grid-label").all_text_contents()
    assert labels == EXPECTED_SLOTS


def test_new_slots_sync_to_stats(fresh_page):
    """戒指能力值併入合計與 extra；腰帶攻擊併入摘要防具攻擊。"""
    _switch_detail(fresh_page)

    fresh_page.locator("#equip-ring1-str").fill("7")
    fresh_page.locator("#equip-ring1-str").blur()
    fresh_page.locator("#equip-belt-atk").fill("11")
    fresh_page.locator("#equip-belt-atk").blur()
    fresh_page.wait_for_timeout(200)

    assert fresh_page.text_content("#equip-total-str") == "7"
    assert fresh_page.input_value("#extra-str") == "7"

    # 腰帶攻擊應併入摘要模式的「防具攻擊」
    fresh_page.click("#mode-summary")
    fresh_page.wait_for_timeout(200)
    assert fresh_page.input_value("#armor-atk") == "11"
