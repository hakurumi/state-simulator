"""Export / Import tests."""
from helpers import _select_job, _set_input, _export_config, _import_file


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
