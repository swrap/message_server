import hashlib
import random

import django
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.http import BadHeaderError
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone

from .models import UserProfile
from .forms import UserForm
from RoofMessage import settings

def index(request):
    #redirects user back to message page
    if request.user.is_active:
        return redirect('MessageApp:message')
    return render(request, 'MessageApp/index.html', {})

def user_logout(request):
    # Since user is logged in, we can just log them out.
    if request != None and request.user.is_active:
        logout(request)
    # Takes the user back to the index page.
        return redirect('MessageApp:index')

def user_login(request):
    #redirects user back to homepage
    if request.user.is_active:
        return redirect('MessageApp:message')

    # If the request is a HTTP POST, try to pull out the relevant information.
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user:
            if user.is_active:
                login(request, user)
                user = request.user
                return redirect('MessageApp:index')
            else:
                return render(request, 'MessageApp/index.html', {"login" : "Please Verify your account with the email we sent you"})
        else:
            return render(request, 'MessageApp/index.html', {"login" : "Incorrect Login Username or password"})
    else:
        return render(request, 'MessageApp/index.html', {})

@login_required
def message(request):
    return render(request, 'MessageApp/message.html', {})

def delete_account(request,key):
    # Takes the user back to the index page.
    user_profile = get_object_or_404()
    return render(request, 'MessageApp/delete_account.html', {})

def register(request):

    if request.method == 'POST':
        user_form = UserForm(data=request.POST)

        if user_form.is_valid():
            user = user_form.save(commit=False)
            print(user.password)
            user.set_password(user.password)
            #user must first use activate before becoming active
            user.is_active=False
            user.save()

            usernamesalt = user.username.encode('utf8')
            salt = hashlib.sha256(str(random.random()).encode('utf-8')).hexdigest()
            salt = salt.encode('utf-8')
            key =  hashlib.sha256(salt+usernamesalt).hexdigest()
            user_profile = UserProfile.objects.create(user = user, activate_key = key)

            subject = "Activate Account (AUTOMATED EMAIL, DO NOT RESPOND)"
            link = settings.DOMAIN_HOST + "/activate/" + user_profile.activate_key
            message = "Welcome to Roof's Messaging App!\nPlease click on this link:" + link
            send_email(subject, message, user)
            # logger.info("User \"" + user.username + "\" has been registered")

            return redirect('MessageApp:index')
        else:
            print(user_form.errors)
    else:
        user_form = UserForm()

    context = {"user_form" : user_form}
    return render(request, 'MessageApp/register.html', context)

def activate(request, key):

    import datetime
    dt = datetime.datetime

    new_link_option = False
    user_profile = get_object_or_404(UserProfile, activate_key=key)
    if user_profile.user.is_active == False:
        dt = user_profile.user.date_joined + datetime.timedelta(days=7)
        if timezone.now() > dt:
            #error
            new_link_option = True
            return render(request, 'MessageApp/activate.html', locals())
        else:
            user_profile.user.is_active = True
            user_profile.user.save()
        return render(request, 'MessageApp/activate.html', locals())
    return redirect('MessageApp:index')

def new_link(request, key):

    user_profile = get_object_or_404(UserProfile, activate_key=key)
    usernamesalt = user_profile.user.username.encode('utf8')
    salt = hashlib.sha256(str(random.random()).encode('utf-8')).hexdigest()
    salt = salt.encode('utf-8')
    user_profile.activate_key = hashlib.sha256(salt + usernamesalt).hexdigest()
    user_profile.save()

    subject = "Activate Account (AUTOMATED EMAIL, DO NOT RESPOND)"
    link = settings.DOMAIN_HOST + "/activate/" + user_profile.activate_key
    message = "Welcome to Roof's Messaging App!\nPlease click on this link:" + link
    send_email(subject, message, user_profile.user)

    return redirect('MessageApp:index')

def send_email(subject, message, user):
    try:
        send_mail(subject=subject, message=message, from_email=settings.EMAIL_HOST_USER,
                  recipient_list=(user.email,), fail_silently=True)
    except BadHeaderError:
        ############need to add error page with optional message and optional countdown
        #### also add log for error
        return