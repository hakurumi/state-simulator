"""Settings dialog tests."""


def test_dialog_opens(app_page):
    app_page.click("#btn-settings")
    assert app_page.locator("#settings-dialog").get_attribute("open") is not None


def test_dialog_closes_on_x(app_page):
    app_page.click("#btn-settings")
    app_page.click("#btn-settings-close")
    app_page.wait_for_timeout(300)
    assert app_page.locator("#settings-dialog").get_attribute("open") is None


def test_dialog_closes_on_backdrop(app_page):
    app_page.click("#btn-settings")
    dialog = app_page.locator("#settings-dialog")
    box = dialog.bounding_box()
    # click outside the article (top-left corner of dialog backdrop)
    app_page.mouse.click(box["x"] + 5, box["y"] + 5)
    app_page.wait_for_timeout(300)
    assert dialog.get_attribute("open") is None
