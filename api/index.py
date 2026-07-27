import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')
root_dir = os.path.abspath(os.path.join(current_dir, '..'))

for p in [backend_dir, current_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.main import app
except Exception as e:
    print("Fallback import triggered:", e)
    from main import app
