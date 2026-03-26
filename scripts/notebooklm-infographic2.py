"""
NotebookLM - Generate infographic poster (debug version)
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
        # First, list existing artifacts to see what's there
        print("[0] Listing existing artifacts...")
        try:
            artifacts = await client.artifacts.list(NOTEBOOK_ID)
            for a in artifacts:
                print(f"   - {a}")
        except Exception as e:
            print(f"   List error: {e}")

        # Try generating infographic with verbose output
        print("\n[1] Generating infographic...")
        try:
            status = await client.artifacts.generate_infographic(NOTEBOOK_ID)
            print(f"   Status object: {status}")
            print(f"   Status type: {type(status)}")
            print(f"   Status dir: {[x for x in dir(status) if not x.startswith('_')]}")

            if hasattr(status, 'task_id') and status.task_id:
                print(f"   Task ID: {status.task_id}")
                print("\n[2] Waiting...")
                await client.artifacts.wait_for_completion(NOTEBOOK_ID, status.task_id, timeout=300)
            else:
                print("   No task_id - might be already complete")
                # Wait a bit then try to download directly
                await asyncio.sleep(10)
        except Exception as e:
            print(f"   Error: {e}")

        # List artifacts again
        print("\n[3] Listing artifacts after generate...")
        try:
            artifacts = await client.artifacts.list(NOTEBOOK_ID)
            for a in artifacts:
                print(f"   - {a}")
        except Exception as e:
            print(f"   List error: {e}")

        # Try to download
        print("\n[4] Attempting download...")
        try:
            out_path = str(output_dir / "unit1_infographic.png")
            await client.artifacts.download_infographic(NOTEBOOK_ID, out_path)
            size = Path(out_path).stat().st_size
            print(f"   Saved: {out_path} ({size} bytes)")
        except Exception as e:
            print(f"   Download error: {e}")

    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(main())
