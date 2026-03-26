"""NotebookLM - Regenerate slide deck after Korean language setting"""
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
        # Clean old artifacts
        try:
            artifacts = await client.artifacts.list(NB_ID)
            for a in artifacts:
                try:
                    await client.artifacts.delete(NB_ID, a.id)
                except:
                    pass
        except:
            pass

        # Generate slide deck (language already set to ko via CLI)
        print("[1] Generating slide deck (language=ko)...")
        status = await client.artifacts.generate_slide_deck(NB_ID)
        print(f"   task_id: {status.task_id}")

        if not status.task_id:
            print("   No task_id")
            return

        # Poll
        print("[2] Waiting...")
        for i in range(60):
            await asyncio.sleep(15)
            artifacts = await client.artifacts.list(NB_ID)
            for a in artifacts:
                if a.status == 3:
                    out_path = str(output_dir / "teacher_guide_slides_ko2.pdf")
                    await client.artifacts.download_slide_deck(NB_ID, out_path)
                    size = Path(out_path).stat().st_size
                    print(f"   Done! Saved: {out_path} ({size} bytes)")
                    return
                elif a.status == 5:
                    print("   Failed")
                    return
            if i % 4 == 0:
                print(f"   [{i}] waiting...")

        print("   Timed out")

if __name__ == "__main__":
    asyncio.run(main())
