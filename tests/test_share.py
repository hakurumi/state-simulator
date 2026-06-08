"""Share URL tests."""
from playwright.sync_api import expect

from helpers import _get_share_url, _open_share_url, _switch_detail


def _set_fields(page, **fields):
    for sel, val in fields.items():
        if sel == "job":
            page.select_option("#job", val)
            page.wait_for_timeout(100)
        else:
            page.fill(f"#{sel}", str(val))
            page.locator(f"#{sel}").blur()
    page.wait_for_timeout(200)


def test_share_url_generated(fresh_page, context):
    _set_fields(fresh_page, **{"str": 100, "weapon-atk": 200})
    url = _get_share_url(fresh_page, context)
    assert url and "#" in url


def test_share_restores_basic_fields(fresh_page, context):
    _set_fields(fresh_page, job="弓箭手 (箭神)", **{
        "str": 100, "weapon-atk": 200, "mastery": 10,
    })
    expected = {
        "job": fresh_page.input_value("#job"),
        "str": fresh_page.input_value("#str"),
        "weapon-atk": fresh_page.input_value("#weapon-atk"),
        "mastery": fresh_page.input_value("#mastery"),
        "attack": fresh_page.text_content("#attack-display"),
    }

    url = _get_share_url(fresh_page, context)
    page2 = _open_share_url(context, url)

    assert page2.input_value("#job") == expected["job"]
    assert page2.input_value("#str") == expected["str"]
    assert page2.input_value("#weapon-atk") == expected["weapon-atk"]
    assert page2.input_value("#mastery") == expected["mastery"]
    assert page2.text_content("#attack-display") == expected["attack"]
    page2.close()


def test_hash_cleared_after_load(fresh_page, context):
    _set_fields(fresh_page, **{"str": 50})
    url = _get_share_url(fresh_page, context)
    page2 = _open_share_url(context, url)
    assert "#" not in page2.url
    page2.close()


def test_share_default_state(fresh_page, context):
    url = _get_share_url(fresh_page, context)
    page2 = _open_share_url(context, url)
    assert page2.input_value("#str") == "4"
    assert page2.input_value("#weapon-atk") == "1"
    assert page2.input_value("#level") == "200"
    page2.close()


def test_share_detail_mode(fresh_page, context):
    fresh_page.select_option("#job", "劍士 (英雄)")
    fresh_page.wait_for_timeout(100)
    _switch_detail(fresh_page)

    fresh_page.locator("#equip-weapon-atk").fill("100")
    fresh_page.locator("#equip-weapon-atk").blur()
    fresh_page.wait_for_timeout(100)

    fresh_page.locator("#equip-hat-str").fill("5")
    fresh_page.locator("#equip-hat-str").blur()
    fresh_page.wait_for_timeout(100)

    # switch to overall armor
    fresh_page.locator("#equip-label-overall").click()
    fresh_page.wait_for_timeout(200)

    expected = {
        "weapon-atk": fresh_page.input_value("#equip-weapon-atk"),
        "hat-str": fresh_page.input_value("#equip-hat-str"),
        "extra-str": fresh_page.input_value("#extra-str"),
        "attack": fresh_page.text_content("#attack-display"),
    }

    url = _get_share_url(fresh_page, context)
    page2 = _open_share_url(context, url)

    assert page2.input_value("#equip-weapon-atk") == expected["weapon-atk"]
    assert page2.input_value("#equip-hat-str") == expected["hat-str"]
    assert page2.input_value("#extra-str") == expected["extra-str"]
    assert page2.text_content("#attack-display") == expected["attack"]
    # verify overall armor mode
    assert "disabled" in page2.locator("#equip-label-top").get_attribute("class")
    page2.close()


def test_hashchange_live_update(fresh_page, context):
    """Pasting a share URL in an already-open page should apply without reload."""
    _set_fields(fresh_page, job="弓箭手 (箭神)", **{"str": 77, "weapon-atk": 150})
    url = _get_share_url(fresh_page, context)

    # open a separate page, then navigate to the share URL via hash
    page2 = context.new_page()
    page2.goto(fresh_page.url.split("#")[0])
    page2.wait_for_load_state("networkidle")
    page2.evaluate("localStorage.clear()")
    page2.reload()
    page2.wait_for_load_state("networkidle")

    # extract hash and apply
    hash_part = url.split("#", 1)[1]
    page2.evaluate(f"location.hash = '{hash_part}'")
    page2.wait_for_timeout(800)

    assert page2.input_value("#job") == "弓箭手 (箭神)"
    assert page2.input_value("#str") == "77"
    assert page2.input_value("#weapon-atk") == "150"
    page2.close()


def test_maple_blessing_survives_reload_and_share(fresh_page, context):
    """楓葉祝福啟用時，localStorage 重載與分享連結都應與手動輸入結果一致。

    回歸：extra-* 存的是「顯示值」，還原走 applyFullState/loadState + reconstructEquipExtras，
    必須保住 total/攻擊/命中，不可因匯入/還原路徑而與手動輸入分歧。
    """
    _set_fields(
        fresh_page,
        job="弓箭手 (箭神)",
        **{"maple-blessing": 10, "dex": 715, "extra-dex": 116,
           "str": 72, "extra-str": 49, "weapon-atk": 113},
    )
    # maple 必須真的啟用，否則本測試沒鎖到東西
    assert fresh_page.input_value("#maple-blessing") == "10"
    expected = {
        "extra-dex": fresh_page.input_value("#extra-dex"),
        "total-dex": fresh_page.text_content("#total-dex"),
        "attack": fresh_page.text_content("#attack-display"),
        "accuracy": fresh_page.text_content("#accuracy-display"),
    }

    def _assert_matches(pg):
        # 命中為純數字，當作 recompute 已完成的等待點，其餘再逐一比對
        expect(pg.locator("#accuracy-display")).to_have_text(expected["accuracy"])
        assert pg.input_value("#maple-blessing") == "10"
        assert pg.input_value("#extra-dex") == expected["extra-dex"]
        assert pg.text_content("#total-dex") == expected["total-dex"]
        assert pg.text_content("#attack-display") == expected["attack"]

    # 1) localStorage 重載（回訪 / cache 還原路徑）
    fresh_page.reload()
    fresh_page.wait_for_load_state("networkidle")
    _assert_matches(fresh_page)

    # 2) 分享連結 round-trip
    url = _get_share_url(fresh_page, context)
    page2 = _open_share_url(context, url)
    _assert_matches(page2)
    page2.close()


def test_compact_share_resets_omitted_fields(fresh_page, context):
    """compact 分享連結會省略「等於預設值」的欄位；載入到「已有殘留狀態」的分頁時，
    這些被省略的欄位必須歸預設，不可殘留當前 session 的舊值。

    回歸：applyFullState 需以 STATE_DEFAULTS 補齊缺漏欄位，否則貼分享連結會把
    自己 session 的 maple 等欄位混進別人的 build。
    """
    # 1) 建立 B build：maple=0（compact 會省略 maple-blessing）
    _set_fields(
        fresh_page,
        job="弓箭手 (箭神)",
        **{"dex": 500, "extra-dex": 50, "weapon-atk": 100},
    )
    expected = {
        "extra-dex": fresh_page.input_value("#extra-dex"),
        "total-dex": fresh_page.text_content("#total-dex"),
        "attack": fresh_page.text_content("#attack-display"),
        "accuracy": fresh_page.text_content("#accuracy-display"),
    }
    assert fresh_page.input_value("#maple-blessing") == "0"
    hash_part = _get_share_url(fresh_page, context).split("#", 1)[1]

    # 2) 污染同一個 session：把 maple 設成 10（此欄位 B 的 compact 連結省略了）
    fresh_page.fill("#maple-blessing", "10")
    fresh_page.locator("#maple-blessing").blur()
    expect(fresh_page.locator("#maple-blessing")).to_have_value("10")

    # 3) 在同一分頁載入 B 的 compact 分享連結（hashchange 路徑）
    fresh_page.evaluate(f"location.hash = '{hash_part}'")

    # 4) 被省略的 maple 必須歸 0，整個 build 與 B 一致（無殘留污染）
    expect(fresh_page.locator("#accuracy-display")).to_have_text(expected["accuracy"])
    assert fresh_page.input_value("#maple-blessing") == "0"
    assert fresh_page.input_value("#extra-dex") == expected["extra-dex"]
    assert fresh_page.text_content("#total-dex") == expected["total-dex"]
    assert fresh_page.text_content("#attack-display") == expected["attack"]
