"""
NotebookLM - Upload teacher guide and generate infographic
"""
import asyncio
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

async def main():
    from notebooklm import NotebookLMClient

    output_dir = Path("scripts/notebooklm-output")
    guide_path = Path("docs/teacher-guide.md")
    guide_content = guide_path.read_text(encoding="utf-8")

    async with await NotebookLMClient.from_storage() as client:
        # Create new notebook with the full teacher guide
        print("[1] Creating notebook with teacher guide...")
        nb = await client.notebooks.create("Phonics 300 Teacher Guide")
        print(f"   ID: {nb.id}")

        print("[2] Adding teacher guide as source...")
        source = await client.sources.add_text(
            nb.id,
            title="Teacher Guide - Full",
            content=guide_content,
            wait=True
        )
        print(f"   Source added")

        # Try infographic
        print("[3] Generating infographic...")
        status = await client.artifacts.generate_infographic(nb.id)
        print(f"   Status: {status.status}, task_id: '{status.task_id}'")

        if status.is_failed:
            print(f"   Failed: {status.error}")
            print("   Trying slide-deck instead...")

            # Try slide deck as alternative
            status2 = await client.artifacts.generate_slide_deck(nb.id)
            print(f"   Slide status: {status2.status}, task_id: '{status2.task_id}'")

            if status2.task_id:
                print("[4] Waiting for slide deck...")
                await client.artifacts.wait_for_completion(nb.id, status2.task_id, timeout=300)
                out_path = str(output_dir / "teacher_guide_slides.pptx")
                await client.artifacts.download_slide_deck(nb.id, out_path)
                print(f"   Saved: {out_path} ({Path(out_path).stat().st_size} bytes)")
        else:
            # Wait and poll
            print("[4] Polling for infographic completion...")
            for i in range(30):
                await asyncio.sleep(15)
                artifacts = await client.artifacts.list(nb.id)
                for a in artifacts:
                    print(f"   [{i}] {a.title} - status={a.status}")
                    if a.status == 3:  # completed
                        print("   Completed! Downloading...")
                        out_path = str(output_dir / "teacher_guide_infographic.png")
                        try:
                            await client.artifacts.download_infographic(nb.id, out_path)
                            print(f"   Saved: {out_path}")
                        except Exception as e:
                            print(f"   Download err: {e}")
                        return
                    elif a.status == 5:  # failed
                        print("   Failed!")
                        return

        print("\nDone!")

if __name__ == "__main__":
    asyncio.run(main())
