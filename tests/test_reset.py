"""Reset all tests."""


def test_reset_all(fresh_page):
    # modify state
    fresh_page.select_option("#job", "弓箭手 (箭神)")
    fresh_page.fill("#str", "100")
    fresh_page.locator("#str").blur()
    fresh_page.fill("#weapon-atk", "200")
    fresh_page.locator("#weapon-atk").blur()
    fresh_page.wait_for_timeout(200)

    # reset
    fresh_page.on("dialog", lambda d: d.accept())
    fresh_page.click("#btn-settings")
    fresh_page.wait_for_timeout(200)
    fresh_page.click("#btn-reset-all")
    fresh_page.wait_for_timeout(500)

    assert fresh_page.input_value("#str") == "4"
    assert fresh_page.input_value("#weapon-atk") == "1"
    assert fresh_page.input_value("#level") == "200"


def test_reset_cancelled(fresh_page):
    fresh_page.fill("#str", "100")
    fresh_page.locator("#str").blur()
    fresh_page.wait_for_timeout(200)

    # cancel reset
    fresh_page.on("dialog", lambda d: d.dismiss())
    fresh_page.click("#btn-settings")
    fresh_page.wait_for_timeout(200)
    fresh_page.click("#btn-reset-all")
    fresh_page.wait_for_timeout(300)

    assert fresh_page.input_value("#str") == "100"
