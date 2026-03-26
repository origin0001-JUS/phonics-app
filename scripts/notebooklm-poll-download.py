"""Poll and download slide deck from NotebookLM"""
import asyncio
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

NB_ID = "3c7acde7-384a-47c0-a171-1b7292de535b"

async def main():
    from notebooklm import NotebookLMClient
    output_dir = Path("scripts/notebooklm-output")

    async with await NotebookLMClient.from_storage() as client:
        # List all artifacts
        print("Checking artifacts...")
        artifacts = await client.artifacts.list(NB_ID)
        for a in artifacts:
            attrs = [x for x in dir(a) if not x.startswith('_')]
            print(f"  id={a.id} title='{a.title}' status={a.status}")

        # Poll for completion
        for i in range(60):
            artifacts = await client.artifacts.list(NB_ID)
            all_done = True
            for a in artifacts:
                if a.status not in (3, 5):
                    all_done = False
                    print(f"  [{i}] '{a.title}' status={a.status} (waiting...)")
            if all_done and artifacts:
                print("  All artifacts complete!")
                break
            await asyncio.sleep(15)

        # Try downloading slide deck
        print("\nDownloading slide deck...")
        try:
            out = str(output_dir / "teacher_guide_slides.pptx")
            await client.artifacts.download_slide_deck(NB_ID, out)
            print(f"  Saved: {out} ({Path(out).stat().st_size} bytes)")
        except Exception as e:
            print(f"  Slide download error: {e}")

        # Also try report
        print("\nTrying report download...")
        try:
            out = str(output_dir / "teacher_guide_report.pdf")
            await client.artifacts.download_report(NB_ID, out)
            print(f"  Saved: {out} ({Path(out).stat().st_size} bytes)")
        except Exception as e:
            print(f"  Report error: {e}")

    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(main())
