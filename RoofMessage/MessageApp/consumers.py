from channels import Channel, Group
from channels.sessions import channel_session, enforce_ordering
from channels.auth import http_session_user, channel_session_user, channel_session_user_from_http

# Connected to websocket.connect
@enforce_ordering(slight=True)
@channel_session_user_from_http
def ws_add(message):
    # Add them to the right group
    Group("connection-%s" % message.user.username[0]).add(message.reply_channel)

# Connected to websocket.disconnect
@enforce_ordering(slight=True)
@channel_session_user
def ws_message(message):
    Group("connection-%s" % message.user.username[0]).send({
        "text": message.user.username + ": " + message['text'],
    })

# Connected to websocket.disconnect
@enforce_ordering(slight=True)
@channel_session_user
def ws_disconnect(message):
    Group("connection-%s" % message.user.username[0]).discard(message.reply_channel)