import re

from channels import Channel, Group
from channels.sessions import channel_session, enforce_ordering
from channels.auth import http_session_user, channel_session_user, channel_session_user_from_http

# Connected to websocket.connect
from .models import GROUP_ANDROID, GROUP_BROWSER, ANDROID_CONSTANT


@enforce_ordering(slight=True)
@channel_session_user_from_http
def ws_add(message):
    # Add them to the right group
    group = message.user.groups.all()
    if group is not None:
        group = group[0].name
        username = message.user.username
        if group == GROUP_ANDROID:
            username = re.match( r'(.*?)%s'% ANDROID_CONSTANT, username).group(1)
        Group("%s-%s" % (group, username)).add(message.reply_channel)

# Connected to websocket.disconnect
@enforce_ordering(slight=True)
@channel_session_user
def ws_message(message):
    group = message.user.groups.all()
    if group is not None:
        group = group[0].name
        username = message.user.username
        if group == GROUP_ANDROID:
            username = re.match( r'(.*?)%s'% ANDROID_CONSTANT, username).group(1)

        if group == GROUP_ANDROID:
            group = GROUP_BROWSER
        else:
            group = GROUP_ANDROID

        Group("%s-%s" % (group, username)).send({
        "text": message['text'],
        })

# Connected to websocket.disconnect
@enforce_ordering(slight=True)
@channel_session_user
def ws_disconnect(message):
    # remove them to the right group
    group = message.user.groups.all()
    if group is not None:
        group = group[0].name
        username = message.user.username
        if group == GROUP_ANDROID:
            Group("%s-%s" % (GROUP_BROWSER, username)).send({
                "text": "disconnected",
            })
            username = re.match( r'(.*?)%s'% ANDROID_CONSTANT, username).group(1)

        Group("%s-%s" % (group, username)).discard(message.reply_channel)