import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from main import app

class StripApiPrefixMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket") and scope.get("path", "").startswith("/api"):
            scope["path"] = scope["path"][4:]
            if not scope["path"]:
                scope["path"] = "/"
        await self.app(scope, receive, send)

app = StripApiPrefixMiddleware(app)
