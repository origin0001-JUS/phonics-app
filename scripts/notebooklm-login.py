"""
NotebookLM login helper - handles the redirect issue on Windows.
Opens browser to NotebookLM directly (skipping accounts.google.com redirect).
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

STORAGE_DIR = Path.home() / ".notebooklm"
STORAGE_FILE = STORAGE_DIR / "storage_state.json"
PROFILE_DIR = STORAGE_DIR / "browser_profile"

def main():
    STORAGE_DIR.mkdir(exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=False,
            channel="chrome",  # Use installed Chrome instead of Playwright Chromium
        )

        page = browser.pages[0] if browser.pages else browser.new_page()

        # Go directly to NotebookLM (will redirect to Google login if needed)
        print("Opening NotebookLM...")
        print("If not logged in, complete Google login in the browser.")
        print("Wait until you see the NotebookLM homepage.")

        try:
            page.goto("https://notebooklm.google.com/", wait_until="networkidle", timeout=120000)
        except Exception as e:
            print(f"Navigation note: {e}")
            print("This may be OK if the page loaded. Continuing...")

        input("\n>>> NotebookLM homepage loaded? Press ENTER to save cookies and close: ")

        # Save storage state
        storage = browser.storage_state()
        with open(STORAGE_FILE, "w") as f:
            json.dump(storage, f, indent=2)

        browser.close()

    print(f"\n✅ Cookies saved to {STORAGE_FILE}")
    print(f"   File size: {STORAGE_FILE.stat().st_size} bytes")

if __name__ == "__main__":
    main()
