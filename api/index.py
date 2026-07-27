import sys
import os

# Include backend directory in Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from main import app
