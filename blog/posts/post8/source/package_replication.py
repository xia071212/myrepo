"""Update this website's README and download from the separate replication repository."""
from pathlib import Path
import argparse
import shutil
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('replication_dir', type=Path)
replication = parser.parse_args().replication_dir.resolve()
post = Path(__file__).resolve().parents[1]
shutil.copy2(replication / 'README.md', post / 'README.md')
with zipfile.ZipFile(post / 'replication.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(replication.rglob('*')):
        relative = path.relative_to(replication)
        if any(part in {'.git', '__pycache__', 'node_modules'} for part in relative.parts):
            continue
        if path.is_file() and path.name != '.DS_Store':
            archive.write(path, relative)
print('Updated README and replication.zip in', post)
