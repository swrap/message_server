import json
import re

from channels import Channel, Group
from channels.sessions import channel_session, enforce_ordering
from channels.auth import http_session_user, channel_session_user, channel_session_user_from_http

# Connected to websocket.connect
from .models import GROUP_ANDROID, GROUP_BROWSER, ANDROID_CONSTANT

import logging
log = logging.getLogger("RoofMessage")

@channel_session_user_from_http
def ws_add(message):
    # Add them to the right group
    group = message.user.groups.all()
    if len(group) == 1 and (group[0].name == GROUP_ANDROID or group[0].name == GROUP_BROWSER):
        log.debug("Login [" + message.user.username + "] [" + group[0].name + "]")
        group = group[0].name
        username = message.user.username
        if group == GROUP_ANDROID:
            username = re.match( r'(.*?)%s'% ANDROID_CONSTANT, username).group(1)
        Group("%s-%s" % (group, username)).add(message.reply_channel)
        message.reply_channel.send({"accept": True})
    else:
        log.debug("WS ADD Failed")
        message.reply_channel.send({"accept": False})

# Connected to websocket.disconnect
@channel_session_user
def ws_message(message):
    group = message.user.groups.all()
    log.debug("Message [" +  str(len(group)) + "]")
    if len(group) == 1 and (group[0].name == GROUP_ANDROID or group[0].name == GROUP_BROWSER):
        log.debug("Message [" +  group[0].name + "]")
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
    else:
        log.debug("WS MESSAGE Failed")
        print("HERE")
        message.reply_channel.send({"close": True})

# Connected to websocket.disconnect
@channel_session_user
def ws_disconnect(message):
    # remove them to the right group
    group = message.user.groups.all()
    if len(group) == 1 and (group[0].name == GROUP_ANDROID or group[0].name == GROUP_BROWSER):
        log.debug("Logout [" + message.user.username + "] [" + group[0].name + "]")
        group = group[0].name
        username = message.user.username
        if group == GROUP_ANDROID:
            Group("%s-%s" % (GROUP_BROWSER, username[0:username.index(ANDROID_CONSTANT)])).send({
                "text": json.dumps({'action' : 'disconnected'}),
            })
            username = re.match( r'(.*?)%s'% ANDROID_CONSTANT, username).group(1)

        Group("%s-%s" % (group, username)).discard(message.reply_channel)

#discards all channels but this one
#removes them from Group_Browser
#if kill_current = false then will remove from group kill all and add back in
def ws_disconnect_all(request=None,user=None,kill_current=True):
        if request is not None:
            username = request.user.username
        else:
            username = user.username
        if not kill_current:
            #removes user from group
            Group("%s-%s" % (GROUP_BROWSER, username)).discard(request.reply_channel)

        Group("%s-%s" % (GROUP_BROWSER, username)).send({"close": True})
        Group("%s-%s" % (GROUP_ANDROID, username)).send({"close": True})

        if not kill_current:
            #adds user to group
            Group("%s-%s" % (GROUP_BROWSER, username)).add(request.reply_channel)