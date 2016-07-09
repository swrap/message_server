from channels.routing import route, include

from .consumers import *

message_route = [
    route("websocket.connect", ws_add),
    route("websocket.receive", ws_message),
    route("websocket.disconnect", ws_disconnect),
]

channel_routing = [
    # You can use a string import path as the first argument as well.
    include(message_route, path=r"^/message_route/$"),
]