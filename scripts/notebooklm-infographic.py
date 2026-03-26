"""
NotebookLM - Generate infographic poster from Unit 1 curriculum
"""
import asyncio
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

NOTEBOOK_ID = "523b317d-6f94-4688-b431-b7428ea94e5d"

async def main():
    from notebooklm import NotebookLMClient

    output_dir = Path("scripts/notebooklm-output")
    output_dir.mkdir(exist_ok=True)

    async with await NotebookLMClient.from_storage() as client:
        # Generate infographic
        print("[1/3] Generating infographic poster...")
        try:
            status = await client.artifacts.generate_infographic(NOTEBOOK_ID)
            print(f"   Task ID: {status.task_id}")
        except Exception as e:
            print(f"   FAIL - Generate error: {e}")
            return

        # Wait for completion
        print("[2/3] Waiting for completion...")
        try:
            await client.artifacts.wait_for_completion(
                NOTEBOOK_ID, status.task_id, timeout=600
            )
            print("   Completed!")
        except Exception as e:
            print(f"   FAIL - Wait error: {e}")
            return

        # Download
        print("[3/3] Downloading infographic...")
        try:
            out_path = str(output_dir / "unit1_infographic.png")
            await client.artifacts.download_infographic(NOTEBOOK_ID, out_path)
            print(f"   Saved: {out_path}")
            print(f"   Size: {Path(out_path).stat().st_size} bytes")
        except Exception as e:
            print(f"   FAIL - Download error: {e}")
            return

    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(main())
