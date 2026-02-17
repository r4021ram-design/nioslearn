import asyncio
import os
import sys
import argparse
from notebooklm import NotebookLMClient
from dotenv import load_dotenv

# Load .env.local from the root directory
load_dotenv(".env.local")

async def generate_podcast(pdf_path, output_path):
    # Retrieve cookies from environment
    # Note: notebooklm-py expects credentials to be stored in its local storage
    # for 'from_storage()' to work. We'll use the CLI login once manually if needed,
    # or we can try to find a way to pass them.
    # Looking at the codebase, NotebookLMClient.from_storage() is the standard way.
    
    try:
        async with await NotebookLMClient.from_storage() as client:
            # 1. Create a temporary notebook
            notebook_name = f"Temp Podcast: {os.path.basename(pdf_path)}"
            nb = await client.notebooks.create(notebook_name)
            print(f"Created notebook: {nb.id}")
            
            # 2. Add the source
            print(f"Uploading source: {pdf_path}")
            await client.sources.add_file(nb.id, pdf_path, wait=True)
            
            # 3. Generate Audio Overview
            print("Generating Audio Overview (this may take a few minutes)...")
            # Using default settings for now
            status = await client.artifacts.generate_audio(nb.id)
            
            # 4. Wait for completion
            await client.artifacts.wait_for_completion(nb.id, status.task_id)
            
            # 5. Download
            print(f"Downloading to: {output_path}")
            await client.artifacts.download_audio(nb.id, output_path)
            
            # 6. Optional: Cleanup
            print(f"Cleaning up notebook: {nb.id}")
            await client.notebooks.delete(nb.id)
            
            print("Done!")
            return True
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a NotebookLM Podcast from a PDF.")
    parser.add_argument("pdf", help="Path to the source PDF file")
    parser.add_argument("output", help="Path where the output MP3 should be saved")
    
    args = parser.parse_args()
    
    # Ensure PDF exists
    if not os.path.exists(args.pdf):
        print(f"Error: PDF file not found: {args.pdf}", file=sys.stderr)
        sys.exit(1)
        
    # Ensure output directory exists
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    
    success = asyncio.run(generate_podcast(args.pdf, args.output))
    if not success:
        sys.exit(1)
