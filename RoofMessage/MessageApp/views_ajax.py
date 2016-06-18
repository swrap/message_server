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

from .models import UserProfile, Conversation
from .forms import UserForm, PasswordForm, NewPasswordForm
from django.http import HttpResponse
from django.core import serializers

def get_all_contacts(request):
    if request.method == "GET":
        users = User.objects.all().exclude(id=request.user.id)
        data = json.dumps( [{'username': o.username} for o in users] )
        return HttpResponse(data, content_type='application/json')

def get_user_contacts(request):
    if request.method == "GET":
        user_profile = UserProfile.objects.filter(user=request.user)
        user_profile = user_profile[0]
        if user_profile is not None:
            #to get the backwards reference and only allow those that arent blocked
            contacts = user_profile.contact_set.all().filter(is_blocked=False)
            data = json.dumps([{'username': o.user.username} for o in contacts])
            return HttpResponse(data, content_type='application/json')

# Returns information relevant to conversation:
# JSON OBJECT
# convo title
# convo id (used for internal code only of webpage)
# convo number of users
# convo user names
def get_conversations(request):
    if request.method == "GET":
        user = User.objects.filter(instance=request.user)
        user = user[0]
        if user is not None:
            conversations= user.conversation_set.all()
            convo_list = []
            for c in conversations:
                convo_list.append({'title':c.title,
                                   'convo_id' : c.id,
                                   'number_of_users' : c.users.count()
                                   })
            data = json.dumps(convo_list)
            return HttpResponse(data, content_type='application/json')

# Returns information relevant to conversation:
# JSON OBJECT
# message objects are sent relating to conversation
def get_messages(request, convo_id):
    if request.method == "GET":
        user = User.objects.filter(instance=request.user)
        user = user[0]
        if user is not None:
            conversation = user.conversation_set.get(id=convo_id)
            if conversation is not None:
                data = json.dumps(conversation.message_set.all())
                return HttpResponse(data, content_type='application/json')

def start_convo(request):
    if request.POST and request.is_ajax():
        user_ids = request.POST.getlist("user_ids")
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
                        convo = Conversation.objects.create(title="Test")
                        for user in users:
                            convo.users.add(user)
                        convo.save()
                        if convo is not None:
                            data = serializers.serialize('json', [convo, ])
                            # data = json.dumps(dict)
                            return HttpResponse(data, content_type='application/json')
    #what to do with response if convo could not be created
    context = {
        'status': '401', 'reason': 'Unable to create new conversation.'
    }
    response = HttpResponse(json.dumps(context), content_type='application/json')
    response.status_code = 401
    return response;
