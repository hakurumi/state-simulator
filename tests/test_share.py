"""Share URL tests."""
import re


def _set_fields(page, **fields):
    for sel, val in fields.items():
        if sel == "job":
            page.select_option("#job", val)
            page.wait_for_timeout(100)
        else:
            page.fill(f"#{sel}", str(val))
            page.locator(f"#{sel}").blur()
    page.wait_for_timeout(200)


def _get_share_url(page, context):
    context.grant_permissions(["clipboard-read", "clipboard-write"])
    page.click("#btn-settings")
    page.wait_for_timeout(200)
    page.click("#btn-share")
    page.wait_for_timeout(500)
    return page.evaluate("navigator.clipboard.readText()")


def _open_share_url(context, url):
    page = context.new_page()
    page.goto(url)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)
    return page


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
    fresh_page.click("#mode-detail")
    fresh_page.wait_for_timeout(300)

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
