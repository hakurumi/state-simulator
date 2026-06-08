"""共用 E2E 測試輔助函式。"""


def _select_job(page, job):
    page.select_option("#job", job)
    page.wait_for_timeout(200)


def _set_input(page, sel, val):
    page.fill(sel, str(val))
    page.locator(sel).blur()


def _switch_detail(page):
    page.click("#mode-detail")
    page.wait_for_timeout(300)


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


def _export_config(page):
    """開設定面板並觸發匯出，回傳 Download 物件。"""
    with page.expect_download() as dl_info:
        page.click("#btn-settings")
        page.wait_for_timeout(200)
        page.click("#btn-export")
    return dl_info.value


def _import_file(page, path):
    """開設定面板並匯入指定路徑的設定檔。"""
    page.click("#btn-settings")
    page.wait_for_timeout(200)
    page.locator("#file-import").set_input_files(path)
    page.wait_for_timeout(500)
