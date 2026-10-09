import os
import re

PATTERNS = [
    re.compile(r'AIza[0-9A-Za-z-_]{35}'),
    re.compile(r'ghp_[0-9a-zA-Z]{36}'),
    re.compile(r'github_pat_[0-9a-zA-Z_]{82}'),
    re.compile(r'sk-[a-zA-Z0-9]{32,}'),
]

IGNORE_FILES = {'.env', '.env.local'}
IGNORE_DIRS = {'.git', 'node_modules', '__pycache__', 'venv', '.venv'}

matches = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
    for file in files:
        if file in IGNORE_FILES:
            continue
        filepath = os.path.join(root, file)
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    for pat in PATTERNS:
                        if pat.search(line):
                            # Do not print line or secret value!
                            matches.append((filepath, idx))
        except Exception:
            pass

if matches:
    print(f"FAILED: Found {len(matches)} secret match(es) in:")
    for fp, idx in matches:
        print(f"  {fp}:{idx}")
    exit(1)
else:
    print("SUCCESS: 0 secrets found in repository files.")
