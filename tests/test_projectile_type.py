"""Projectile type selector tests."""


def _select_job(page, job):
    page.select_option("#job", job)
    page.wait_for_timeout(200)


def test_projectile_selector_visible_for_thief(fresh_page):
    """夜使者：顯示投射物選擇器。"""
    _select_job(fresh_page, "盜賊 (夜使者)")
    assert fresh_page.locator("#projectile-buff-label").is_visible()
    assert fresh_page.locator("#projectile-divider").is_visible()


def test_projectile_selector_hidden_for_non_projectile(fresh_page):
    """無投射物的職業：選擇器隱藏。"""
    for job in ["劍士 (英雄)", "法師 (主教)"]:
        _select_job(fresh_page, job)
        assert not fresh_page.locator("#projectile-buff-label").is_visible()


def test_check_fills_projectile_atk(fresh_page):
    """勾選後自動填入 ATK 值，鎖定手動輸入。"""
    _select_job(fresh_page, "盜賊 (夜使者)")
    fresh_page.check("#projectile-buff")
    fresh_page.wait_for_timeout(200)
    # 預設選第一個（月牙鏢 +28）
    assert fresh_page.input_value("#projectile-atk") == "28"
    assert fresh_page.locator("#projectile-atk").is_disabled()


def test_uncheck_unlocks_projectile_atk(fresh_page):
    """取消勾選後可手動編輯。"""
    _select_job(fresh_page, "盜賊 (夜使者)")
    fresh_page.check("#projectile-buff")
    fresh_page.wait_for_timeout(100)
    fresh_page.uncheck("#projectile-buff")
    fresh_page.wait_for_timeout(100)
    assert not fresh_page.locator("#projectile-atk").is_disabled()


def test_change_option_updates_atk(fresh_page):
    """切換選項更新 ATK。"""
    _select_job(fresh_page, "盜賊 (夜使者)")
    fresh_page.check("#projectile-buff")
    fresh_page.wait_for_timeout(100)
    fresh_page.select_option("#projectile-select", "subi")
    fresh_page.wait_for_timeout(200)
    assert fresh_page.input_value("#projectile-atk") == "15"


def test_job_switch_updates_list(fresh_page):
    """切換職業更新投射物列表。"""
    _select_job(fresh_page, "盜賊 (夜使者)")
    opts_star = fresh_page.locator("#projectile-select option").count()
    _select_job(fresh_page, "海盜 (槍神)")
    opts_bullet = fresh_page.locator("#projectile-select option").count()
    assert opts_star == 11   # 飛鏢 11 種
    assert opts_bullet == 6  # 子彈 6 種


def test_bullet_list_for_gunslinger(fresh_page):
    """槍神顯示子彈列表，勾選後 ATK=20（恆久子彈為預設）。"""
    _select_job(fresh_page, "海盜 (槍神)")
    fresh_page.check("#projectile-buff")
    fresh_page.wait_for_timeout(200)
    assert fresh_page.input_value("#projectile-atk") == "20"


def test_bow_arrow_list_for_bowmaster(fresh_page):
    """箭神顯示弓箭矢列表，勾選後 ATK=2。"""
    _select_job(fresh_page, "弓箭手 (箭神)")
    fresh_page.check("#projectile-buff")
    fresh_page.wait_for_timeout(200)
    assert fresh_page.input_value("#projectile-atk") == "2"


def test_xbow_arrow_list_for_marksman(fresh_page):
    """神射手顯示弩箭列表，勾選後 ATK=2。"""
    _select_job(fresh_page, "弓箭手 (神射手)")
    fresh_page.check("#projectile-buff")
    fresh_page.wait_for_timeout(200)
    assert fresh_page.input_value("#projectile-atk") == "2"


def test_reset_clears_projectile_buff(fresh_page):
    """重置後投射物選擇器取消勾選。"""
    _select_job(fresh_page, "盜賊 (夜使者)")
    fresh_page.check("#projectile-buff")
    fresh_page.wait_for_timeout(200)
    fresh_page.click("#btn-reset-equip")
    fresh_page.wait_for_timeout(300)
    assert not fresh_page.is_checked("#projectile-buff")
    assert not fresh_page.locator("#projectile-atk").is_disabled()


def test_share_restores_projectile_buff(fresh_page, context):
    """分享連結還原投射物選擇器設定。"""
    _select_job(fresh_page, "盜賊 (夜使者)")
    fresh_page.check("#projectile-buff")
    fresh_page.select_option("#projectile-select", "steely")
    fresh_page.wait_for_timeout(300)

    context.grant_permissions(["clipboard-read", "clipboard-write"])
    fresh_page.click("#btn-settings")
    fresh_page.wait_for_timeout(200)
    fresh_page.click("#btn-share")
    fresh_page.wait_for_timeout(500)
    url = fresh_page.evaluate("navigator.clipboard.readText()")

    page2 = context.new_page()
    page2.goto(url)
    page2.wait_for_load_state("networkidle")
    page2.wait_for_timeout(500)

    assert page2.is_checked("#projectile-buff")
    assert page2.input_value("#projectile-select") == "steely"
    assert page2.input_value("#projectile-atk") == "25"
    page2.close()


def test_import_restores_projectile_buff(fresh_page):
    """匯出匯入還原投射物選擇器設定。"""
    _select_job(fresh_page, "海盜 (槍神)")
    fresh_page.check("#projectile-buff")
    fresh_page.select_option("#projectile-select", "mighty")
    fresh_page.wait_for_timeout(300)

    with fresh_page.expect_download() as dl_info:
        fresh_page.click("#btn-settings")
        fresh_page.wait_for_timeout(200)
        fresh_page.click("#btn-export")
    dl_path = dl_info.value.path()

    _select_job(fresh_page, "劍士 (英雄)")
    fresh_page.wait_for_timeout(200)

    fresh_page.click("#btn-settings")
    fresh_page.wait_for_timeout(200)
    fresh_page.locator("#file-import").set_input_files(dl_path)
    fresh_page.wait_for_timeout(500)

    assert fresh_page.input_value("#job") == "海盜 (槍神)"
    assert fresh_page.is_checked("#projectile-buff")
    assert fresh_page.input_value("#projectile-select") == "mighty"
    assert fresh_page.input_value("#projectile-atk") == "14"
