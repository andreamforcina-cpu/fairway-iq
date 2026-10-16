"""Prevent storage of account and private round responses, including handled errors."""
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send


class AuthResponseHeadersMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        path = scope.get('path', '')
        private = path.startswith('/auth/') or path == '/rounds' or path.startswith('/rounds/')
        if scope['type'] != 'http' or not private:
            await self.app(scope, receive, send)
            return

        async def no_store(message: Message) -> None:
            if message['type'] == 'http.response.start':
                headers = MutableHeaders(scope=message)
                headers['Cache-Control'] = 'no-store'
                headers['Pragma'] = 'no-cache'
            await send(message)

        await self.app(scope, receive, no_store)
