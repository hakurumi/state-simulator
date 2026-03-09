import pytest
import subprocess
import time
import socket

PORT = 8765
BASE_URL = f"http://localhost:{PORT}/artale/"


def _port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


@pytest.fixture(scope="session")
def _server():
    if _port_in_use(PORT):
        yield
        return
    proc = subprocess.Popen(
        ["python3", "-m", "http.server", str(PORT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(20):
        if _port_in_use(PORT):
            break
        time.sleep(0.2)
    yield
    proc.terminate()
    proc.wait()


@pytest.fixture()
def app_page(page, _server):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    return page


@pytest.fixture()
def fresh_page(page, _server):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_load_state("networkidle")
    return page
