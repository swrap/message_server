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