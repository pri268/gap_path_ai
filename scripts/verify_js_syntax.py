import glob
import re

def check_file(fn):
    with open(fn, 'r', encoding='utf-8') as f:
        code = f.read()
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    in_str = None
    in_comment = False
    in_block_comment = False
    i = 0
    n = len(code)
    while i < n:
        c = code[i]
        nxt = code[i+1] if i+1 < n else ''
        if in_comment:
            if c == '\n':
                in_comment = False
        elif in_block_comment:
            if c == '*' and nxt == '/':
                in_block_comment = False
                i += 1
        elif in_str:
            if c == '\\':
                i += 1  # Skip escaped character
            elif c == in_str:
                in_str = None
        else:
            if c == '/' and nxt == '/':
                in_comment = True
                i += 1
            elif c == '/' and nxt == '*':
                in_block_comment = True
                i += 1
            elif c in ('"', "'", '`'):
                in_str = c
            elif c in ('(', '{', '['):
                stack.append((c, i))
            elif c in (')', '}', ']'):
                if not stack:
                    return f"Unmatched '{c}' at byte {i}"
                top, pos = stack.pop()
                if top != pairs[c]:
                    return f"Mismatched: opened '{top}' at {pos}, closed with '{c}' at {i}"
        i += 1

    if stack:
        top, pos = stack[-1]
        line_num = code[:pos].count('\n') + 1
        return f"Unclosed '{top}' (opened at line {line_num})"
    return "VALID"

all_valid = True
for f in sorted(glob.glob("js/*.js")):
    res = check_file(f)
    print(f"{f}: {res}")
    if res != "VALID":
        all_valid = False

assert all_valid, "Some JS files failed syntax verification!"
print("All JS files passed syntax/bracket verification!")
