import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from backend.main import app
except Exception:
    root_dir = os.path.abspath(os.path.join(current_dir, '..'))
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
    from main import app
