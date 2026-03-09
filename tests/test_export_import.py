"""Export / Import tests."""


def test_export_downloads_json(fresh_page):
    with fresh_page.expect_download() as dl_info:
        fresh_page.click("#btn-settings")
        fresh_page.wait_for_timeout(200)
        fresh_page.click("#btn-export")
    download = dl_info.value
    assert download.suggested_filename == "artale-config.json"


def test_import_restores_state(fresh_page):
    # set some values
    fresh_page.select_option("#job", "弓箭手 (箭神)")
    fresh_page.fill("#str", "88")
    fresh_page.locator("#str").blur()
    fresh_page.fill("#weapon-atk", "250")
    fresh_page.locator("#weapon-atk").blur()
    fresh_page.wait_for_timeout(200)

    expected_job = fresh_page.input_value("#job")
    expected_str = fresh_page.input_value("#str")
    expected_watk = fresh_page.input_value("#weapon-atk")

    # export
    with fresh_page.expect_download() as dl_info:
        fresh_page.click("#btn-settings")
        fresh_page.wait_for_timeout(200)
        fresh_page.click("#btn-export")
    dl_path = dl_info.value.path()

    # change values
    fresh_page.select_option("#job", "劍士 (英雄)")
    fresh_page.fill("#str", "4")
    fresh_page.locator("#str").blur()
    fresh_page.wait_for_timeout(200)

    # import
    fresh_page.click("#btn-settings")
    fresh_page.wait_for_timeout(200)
    fresh_page.locator("#file-import").set_input_files(dl_path)
    fresh_page.wait_for_timeout(500)

    assert fresh_page.input_value("#job") == expected_job
    assert fresh_page.input_value("#str") == expected_str
    assert fresh_page.input_value("#weapon-atk") == expected_watk
