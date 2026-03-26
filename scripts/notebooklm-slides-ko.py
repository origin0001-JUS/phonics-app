"""
NotebookLM - Generate Korean slide deck from teacher guide
"""
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
        # Set language to Korean
        print("[1] Setting language to Korean...")
        try:
            await client.language.set(NB_ID, "ko")
            print("   Language set to Korean")
        except Exception as e:
            print(f"   Language set error: {e}")
            # Try alternative method
            try:
                await client.language.set("ko")
                print("   Language set (global)")
            except Exception as e2:
                print(f"   Global language error: {e2}")

        # Delete old artifacts
        print("[2] Cleaning old artifacts...")
        try:
            artifacts = await client.artifacts.list(NB_ID)
            for a in artifacts:
                try:
                    await client.artifacts.delete(NB_ID, a.id)
                    print(f"   Deleted: {a.title}")
                except:
                    pass
        except Exception as e:
            print(f"   Clean error: {e}")

        # Generate new slide deck
        print("[3] Generating Korean slide deck...")
        try:
            status = await client.artifacts.generate_slide_deck(NB_ID)
            print(f"   Status: {status.status}, task_id: '{status.task_id}'")
        except Exception as e:
            print(f"   Generate error: {e}")
            return

        if not status.task_id:
            print("   No task_id returned")
            return

        # Poll for completion
        print("[4] Waiting for completion...")
        for i in range(60):
            await asyncio.sleep(15)
            artifacts = await client.artifacts.list(NB_ID)
            for a in artifacts:
                if a.status == 3:
                    print(f"   [{i}] Completed: {a.title}")
                    # Download
                    out_path = str(output_dir / "teacher_guide_slides_ko.pdf")
                    await client.artifacts.download_slide_deck(NB_ID, out_path)
                    size = Path(out_path).stat().st_size
                    print(f"   Saved: {out_path} ({size} bytes)")
                    return
                elif a.status == 5:
                    print(f"   [{i}] Failed: {a.title}")
                    return
                else:
                    if i % 4 == 0:
                        print(f"   [{i}] status={a.status} (waiting...)")

        print("   Timed out")

    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(main())
