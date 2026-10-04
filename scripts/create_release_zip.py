import os
import zipfile
import time

SRC_DIR = "/root/projects/ideavo"
OUT_ZIP = "/storage/emulated/0/phryvos/phryvos v1.0.0.2.zip"

EXCLUDE_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".cache",
    ".turbo",
    ".pnpm-store"
}

EXCLUDE_EXTS = {
    ".zip",
    ".tar.gz",
    ".log",
    ".tmp"
}

EXCLUDE_FILES = {
    "phryvos_android_package.zip",
    "npm-debug.log",
    "yarn-error.log",
    "pnpm-debug.log"
}

print(f"Starting zip creation: {OUT_ZIP}")
start_time = time.time()
os.makedirs(os.path.dirname(OUT_ZIP), exist_ok=True)

count = 0
total_uncompressed_bytes = 0

with zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for root, dirs, files in os.walk(SRC_DIR):
        # Prune excluded directories in-place so os.walk never enters them
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in EXCLUDE_EXTS or file in EXCLUDE_FILES:
                continue
                
            full_path = os.path.join(root, file)
            # Relative path inside the zip archive
            rel_path = os.path.relpath(full_path, SRC_DIR)
            
            try:
                stat = os.stat(full_path)
                total_uncompressed_bytes += stat.st_size
                zf.write(full_path, rel_path)
                count += 1
            except Exception as e:
                print(f"Skipping {rel_path}: {e}")

zip_size = os.path.getsize(OUT_ZIP)
duration = time.time() - start_time
print(f"✅ Created {OUT_ZIP}")
print(f"Files archived: {count}")
print(f"Uncompressed: {total_uncompressed_bytes / (1024*1024):.2f} MB")
print(f"Zip size: {zip_size / (1024*1024):.2f} MB")
print(f"Time taken: {duration:.2f} seconds")
