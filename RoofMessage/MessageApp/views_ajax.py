import json
from datetime import timedelta

from django.template import Context
from django.template.loader import get_template
from django.utils.datetime_safe import date
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.http import BadHeaderError
from django.shortcuts import render, redirect
from django.views.decorators.cache import cache_control

from .models import UserProfile, Conversation, Message
from django.conf import settings
from .forms import UserForm, PasswordForm, NewPasswordForm
from django.http import HttpResponse
from django.core import serializers

def get_all_contacts(request):
    if request.POST and request.is_ajax():
        users = User.objects.all().exclude(id=request.user.id)
        data = json.dumps( [{'username': o.username} for o in users] )
        return HttpResponse(data, content_type='application/json')

def get_user_contacts(request):
    if request.POST and request.is_ajax():
        user_profile = UserProfile.objects.filter(user=request.user)
        user_profile = user_profile[0]
        if user_profile is not None:
            #to get the backwards reference and only allow those that arent blocked
            contacts = user_profile.contact_set.all().filter(is_blocked=False)
            data = json.dumps([{'username': o.user.username} for o in contacts])
            return HttpResponse(data, content_type='application/json')

def create_conversation(request):
    if request.POST and request.is_ajax():
        user_ids = request.POST.getlist("user_ids")
        title = request.POST["title"]

        if user_ids is not None:
            # removes any duplicates
            user_ids = list(set(user_ids))
            # try to create chat and you are not part of
            if any(str(request.user.pk) in s for s in user_ids):
                users = User.objects.filter(pk__in=user_ids)
                if users.count() > 0:
                    # only give convo that relate to user
                    convo = Conversation.objects.filter(users=request.user)

                    for user in users:
                        convo = convo.filter(users=user)
                    if convo.count() is 0:
                        #good there is not
                        if len(str(title)) > 0:
                            convo = Conversation.objects.create(title=title)
                        else:
                            convo = Conversation.objects.create(title="Convo")
                        for user in users:
                            convo.users.add(user)
                        convo.save()
                        if convo is not None:
                            data = serializers.serialize('json', [convo, ])
                            # data = json.dumps(dict)
                            return HttpResponse(data, content_type='application/json')
    #what to do with response if convo could not be created
    context = {
        'status': '403', 'reason': 'Unable to create new conversation.'
    }
    response = HttpResponse(json.dumps(context), content_type='application/json')
    response.status_code = 403
    return response;

def get_conversations(request):
    if request.POST and request.is_ajax():
        conversation_id = request.POST.getlist("conversation_id")

        try:
            user = User.objects.get(pk=request.user.pk)
        except User.DoesNotExist:
            user = None
        if user is not None:
            #gets all user conversations
            conversations = user.conversation_set.all()
            #returns convo with specific id if sent with one
            if len(conversation_id) > 0:
                conversations = conversations.filter(pk=conversation_id[0])
            convo_list = serializers.serialize('json', conversations)
            return HttpResponse(convo_list, content_type='application/json')
    context = {
        'status': '403', 'reason': 'Unable to locate user conversation(s).'
    }
    response = HttpResponse(json.dumps(context), content_type='application/json')
    response.status_code = 403
    return response;

def create_message(request):
    if request.POST and request.is_ajax():
        conversation_id = request.POST["conversation_id"]
        text = request.POST["text"]
        try:
            user = User.objects.get(pk=request.user.pk)
        except User.DoesNotExist:
            user = None
        try:
            conversation = Conversation.objects.get(pk=conversation_id)
        except Conversation.DoesNotExist:
            conversation = None
        # if found both user and the conversation than we can add message
        if user is not None and conversation is not None:
            message = Message.objects.create(user_poster=user,
                                             text=text,
                                             conversation=conversation)
            data = serializers.serialize('json', [message, ])
            # data = json.dumps(dict)
            return HttpResponse(data, content_type='application/json')
    #what to do with response if message could not be created
    context = {
        'status': '403', 'reason': 'Unable to create new conversation.'
    }
    response = HttpResponse(json.dumps(context), content_type='application/json')
    response.status_code = 403
    return response;

def get_messages(request):
    if request.POST and request.is_ajax():
        conversation_id = request.POST["conversation_id"]
        offset = request.POST["offset"]
        try:
            offset = int(offset)
        except ValueError:
            offset = 0

        try:
            user = User.objects.get(pk=request.user.pk)
        except User.DoesNotExist:
            user = None
        try:
            conversation = Conversation.objects.get(pk=conversation_id)
        except Conversation.DoesNotExist:
            conversation = None
        # if found both user and the conversation than we can add message
        if user is not None and conversation is not None:
            #gets all user conversations
            messages = conversation.message_set.all().order_by('pk')[offset:settings.MESSAGE_LOAD]
            #returns convo with specific id if sent with one
            message_list = serializers.serialize('json', messages)
            return HttpResponse(message_list, content_type='application/json')
    context = {
        'status': '403', 'reason': 'Unable to get message(s).'
    }
    response = HttpResponse(json.dumps(context), content_type='application/json')
    response.status_code = 403
    return response;