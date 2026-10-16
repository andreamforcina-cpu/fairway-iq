"""Prevent storage of account responses, including validation and throttle failures."""
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send


class AuthResponseHeadersMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope['type'] != 'http' or not scope.get('path', '').startswith('/auth/'):
            await self.app(scope, receive, send)
            return

        async def no_store(message: Message) -> None:
            if message['type'] == 'http.response.start':
                headers = MutableHeaders(scope=message)
                headers['Cache-Control'] = 'no-store'
                headers['Pragma'] = 'no-cache'
            await send(message)

        await self.app(scope, receive, no_store)
