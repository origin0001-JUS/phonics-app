"""
NotebookLM - Poll and download infographic
"""
import asyncio
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

NOTEBOOK_ID = "523b317d-6f94-4688-b431-b7428ea94e5d"
ARTIFACT_ID = "1738845d-11e0-423f-86ef-2664fbc0e967"

async def main():
    from notebooklm import NotebookLMClient

    output_dir = Path("scripts/notebooklm-output")

    async with await NotebookLMClient.from_storage() as client:
        # Poll until artifact completes
        for i in range(60):
            artifacts = await client.artifacts.list(NOTEBOOK_ID)
            target = None
            for a in artifacts:
                if a.id == ARTIFACT_ID:
                    target = a
                    break

            if target:
                print(f"   [{i}] Artifact status: {target.status} - {target.title}")
                if target.status == 3:  # completed
                    print("   Completed!")
                    break
                elif target.status == 5:  # failed
                    print("   Failed!")
                    return
            else:
                print(f"   [{i}] Artifact not found")

            await asyncio.sleep(10)

        # Try download
        print("\nDownloading infographic...")
        try:
            out_path = str(output_dir / "unit1_infographic.png")
            await client.artifacts.download_infographic(NOTEBOOK_ID, out_path)
            size = Path(out_path).stat().st_size
            print(f"   Saved: {out_path} ({size} bytes)")
        except Exception as e:
            print(f"   Download error: {e}")

            # Try generic export
            print("\nTrying artifact export...")
            try:
                result = await client.artifacts.export(NOTEBOOK_ID, ARTIFACT_ID)
                print(f"   Export result type: {type(result)}")
                print(f"   Export result: {str(result)[:500]}")
            except Exception as e2:
                print(f"   Export error: {e2}")

            # Try get
            print("\nTrying artifact get...")
            try:
                result = await client.artifacts.get(NOTEBOOK_ID, ARTIFACT_ID)
                print(f"   Get result: {result}")
                print(f"   Get dir: {[x for x in dir(result) if not x.startswith('_')]}")
                if hasattr(result, 'url') and result.url:
                    print(f"   URL: {result.url}")
                if hasattr(result, 'content'):
                    print(f"   Content length: {len(str(result.content))}")
            except Exception as e3:
                print(f"   Get error: {e3}")

    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(main())
