import copy
import json
from datetime import timedelta

from django.contrib.sessions.models import Session
from django.forms import forms
from django.template import Context
from django.template.loader import get_template
from django.utils.datetime_safe import date
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User, Group
from django.core.mail import send_mail
from django.http import BadHeaderError
from django.shortcuts import render, redirect
from django.views.decorators.cache import cache_control
from django.http import HttpResponse

from .views_android import *
from .models import UserProfile, AndroidModel, GROUP_ANDROID, GROUP_BROWSER, Key
from .forms import UserForm, PasswordForm, NewPasswordForm

# CONSTANT FOR KEY
RESET_KEY_NOT_USABLE = "N0neU5eAb1eS0rrY"
ACTIVATE_KEY_NOT_USABLE = "W00BabYib0YoooBroo"
LINK_EXPIRATION = 2 #days for new pass link to expire

#Email file Constants
from django.conf import settings
EMAIL_DELETE_ACCOUNT = settings.STATIC_ROOT + "email/deleted_account.html"
EMAIL_NEW_PASSWORD_LINK = settings.STATIC_ROOT + "email/new_password_link.html"
EMAIL_PASSWORD_CHANGE_NOTIFICATION = settings.STATIC_ROOT + "email/pass_change_email.html"
EMAIL_VERIFY_ACCOUNT= settings.STATIC_ROOT + "email/verify_account_email.html"
EMAIL_ALPHA_KEY = settings.STATIC_ROOT + "email/new_alpha_key.html"

#used as decorator!
#checks both if user exists and if exists
#if their account is still active (bans turns off is_active)
#also user must be authenticated
def user_allowed(user):
    try:
        user = User.objects.get(id=user.id)
    except User.DoesNotExist:
        return False
    if user.is_active and user.is_authenticated():
        return True
    return False

def index(request):
    # redirects user back to message page
    group = Group.objects.all()
    if len(group.filter(name=GROUP_ANDROID)) == 0:
        Group.objects.create(name=GROUP_ANDROID).save()
    if len(group.filter(name=GROUP_BROWSER)) == 0:
        Group.objects.create(name=GROUP_BROWSER).save()

    user_form = UserForm()
    context = {"user_form": user_form}
    print("YES")
    return render(request, 'MessageApp/index.html', context)


@cache_control(no_cache=True, must_revalidate=True, no_store=True)
@user_passes_test(user_allowed,login_url='/')
@login_required()
def user_logout(request):
    # Since user is logged in, we can just log them out.
    if request is not None and request.user.is_active:
        logout(request)
        # Takes the user back to the index page.
        return redirect('MessageApp:index')

def user_login(request):
    # redirects user back to homepage
    if request.user.is_authenticated():
        return redirect('MessageApp:message')

    # If the request is a HTTP POST, try to pull out the relevant information.
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)

        try:
            user_unauthenticated = User.objects.get(username=username)
        except User.DoesNotExist:
            user_unauthenticated = None
        if user_unauthenticated:
            try:
                user_profile = UserProfile.objects.get(user=user_unauthenticated)
                user_profile.attempts += 1
                user_profile.save()
            except UserProfile.DoesNotExist:
                user_profile = None
            if user_profile and not user_profile.check_attempts():
                return render(request, 'MessageApp/index.html', {"login": "Account has too many attempts. "
                            "Please ", "reset": True},
                            status=400)
        if user:
            if user.is_active:
                login(request, user)
                user_profile.attempts = 0
                user_profile.save()
                return redirect('MessageApp:message')
            else:
                return render(request, 'MessageApp/index.html',
                              {"login": "Account is disabled."})
        else:
            return render(request, 'MessageApp/index.html', {"login": "Incorrect Login Username or password"}, status=400)
    else:
        return render(request, 'MessageApp/index.html', {})

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
@user_passes_test(user_allowed,login_url='/')
@login_required()
def delete_account(request):
    if request.POST:
        password = request.POST['password']
        if request.user.check_password(password):
            try:
                user = User.objects.get(id=request.user.id)
            except User.DoesNotExist:
                user = None
            try:
                android_user = User.objects.get(username=str(user.username + ANDROID_CONSTANT))
            except User.DoesNotExist:
                android_user = None
            if user is not None and android_user is not None:
                user.is_active = False
                user.save()
                android_user.is_active = False
                android_user.save()

                logout(request)
                
		# send mail about account delete
                subject = "Deleted Account (AUTOMATED EMAIL, DO NOT RESPOND)"
                from RoofMessage import settings
                email_template = get_template(EMAIL_DELETE_ACCOUNT)
                message = email_template.render()
                send_email(subject, message, user.email, True)
                user.delete()
                android_user.delete()
                return render(request, 'MessageApp/delete_account.html', locals())
        else:
            error = "Must enter correct password in order to delete account."

    try:
        user_profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        user_profile = None
    pass_form = PasswordForm()

    return render(request, 'MessageApp/settings.html', locals())

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
@user_passes_test(user_allowed,login_url='/')
@login_required()
def settings_page(request):
    try:
        user_profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        user_profile = None
    if user_profile is not None and not user_profile.activated_account:
        activate_account = False

    if request.POST and user_profile is not None:

        if "change_password" in request.POST:
            pass_form = PasswordForm(data=request.POST)
            if pass_form.is_valid():
                old_password = pass_form.cleaned_data['old_password']
                try:
                    user = User.objects.get(id=request.user.id)
                except User.DoesNotExist:
                    user = None

                try:
                    android_username = str(request.user.username + ANDROID_CONSTANT)
                    android_user = User.objects.get(username=android_username)
                except User.DoesNotExist:
                    android_user = None
                if user is not None and user.check_password(old_password) and \
                                android_user is not None and android_user.check_password(old_password):
                    user.set_password(pass_form.cleaned_data['new_password1']);
                    user.save()

                    android_user.set_password(pass_form.cleaned_data['new_password1'])
                    android_user.save()

                    #signs user back in after updating password
                    update_session_auth_hash(request, user)

                    # send mail about changed password
                    subject = "Password Change (AUTOMATED EMAIL, DO NOT RESPOND)"
                    email_template = get_template(EMAIL_PASSWORD_CHANGE_NOTIFICATION)
                    message = email_template.render()
                    send_email(subject, message, user.email, True)
                    pass_change_success = True
                else:
                    pass_form.add_error("old_password", "Password is incorrect")
            else:
                print(pass_form.errors)
            #renders page
            return render(request, 'MessageApp/settings.html', locals())

        #send activate link has been pressed and user account is not active yet
        #other posted form
        elif "activate" in request.POST and not user_profile.activated_account:
            subject = "New Activate Account Link (AUTOMATED EMAIL, DO NOT RESPOND)"
            from RoofMessage import settings
            link = settings.DOMAIN_HOST + "/activate/" + user_profile.activate_key
            email_template = get_template(EMAIL_VERIFY_ACCOUNT)
            message = email_template.render(Context({"activation_key" : link}))
            send_email(subject, message, request.user.email, True)
            email_sent = True

    pass_form = PasswordForm()
    return render(request, 'MessageApp/settings.html', locals())

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
@user_passes_test(user_allowed,login_url='/')
@login_required()
def message(request):
    print("hi")
    return render(request, 'MessageApp/message.html', {"debug":settings.DEBUG})


def register(request):
    if request.POST:
        user_form = UserForm(data=request.POST)

        if user_form.is_valid():
            user = user_form.save(commit=False)
            user.set_password(user.password)
            user.save()
            group = Group.objects.get(name=GROUP_BROWSER)
            group.user_set.add(user)

            user_profile = UserProfile.objects.create(user=user)
            user_profile.new_activate_key()
            user_profile.new_reset_confirm_key()
            user_profile.reset_key = RESET_KEY_NOT_USABLE
            user_profile.save()

            android_user = User.objects.create(username=str(user.username + ANDROID_CONSTANT))
            android_user.first_name = user.first_name
            android_user.last_name = user.last_name
            android_user.set_password(user_form.cleaned_data['password'])
            android_user.save()
            group = Group.objects.get(name=GROUP_ANDROID)
            group.user_set.add(android_user)

            android = AndroidModel.objects.create(user=android_user)
            android.save()

            subject = "Activate Account (AUTOMATED EMAIL, DO NOT RESPOND)"
            from RoofMessage import settings
            link = settings.DOMAIN_HOST + "/activate/" + user_profile.activate_key
            email_template = get_template(EMAIL_VERIFY_ACCOUNT)
            message = email_template.render(Context({"activation_key" : link}))
            send_email(subject, message, user.email, False)
            # logger.info("User \"" + user.username + "\" has been registered")
            response = HttpResponse()
            response.status = 200
            return response
        else:
            print(user_form.errors)
            response = HttpResponse(json.dumps(user_form.errors), content_type='application/json', status=400)
            return response
    else:
        return HttpResponse(status=403)

def new_password_send(request):
    change_screen = False

    if request.POST:
        email = request.POST['email'].strip()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            user = None
        if user is not None:
            try:
                user_profile = UserProfile.objects.get(user=user)
            except UserProfile.DoesNotExist:
                user_profile = None
            if user_profile is not None:
                # send mail about changed password
                subject = "New Password Link (AUTOMATED EMAIL, DO NOT RESPOND)"
                key = user_profile.new_reset_key()
                from RoofMessage import settings
                link = settings.DOMAIN_HOST + "/new_password_link/" + user_profile.new_reset_confirm_key()
                email_template = get_template(EMAIL_NEW_PASSWORD_LINK)
                message = email_template.render(Context({"activation_key": link, "reset_key": key}))
                send_email(subject, message, user.email, True)
                change_screen = True
                return render(request, 'MessageApp/new_password.html', locals())

    return render(request, 'MessageApp/new_password.html', locals())


def new_password_link(request, key):
    if request.POST:
        new_pass_form = NewPasswordForm(request.POST)
        if new_pass_form.is_valid():
            reset_key = new_pass_form.cleaned_data['reset_key']
            try:
                user_profile = UserProfile.objects.get(reset_key=reset_key, reset_confirm_key=key)
            except UserProfile.DoesNotExist:
                user_profile = None

            android_user = None
            if user_profile is not None:
                try:
                    android_username = str(user_profile.user.username + ANDROID_CONSTANT)
                    android_user = User.objects.get(username=android_username)
                except User.DoesNotExist:
                    android_user = None

            if user_profile is not None and android_user is not None\
                    and user_profile.reset_key != RESET_KEY_NOT_USABLE and user_profile.activated_account != RESET_KEY_NOT_USABLE:
                days = date.today()-user_profile.new_pass_created
                time_delta = timedelta(days=LINK_EXPIRATION)
                if days < time_delta:
                    #delete all all unexpired sessions from user with new password
                    all_unexpired_sessions_for_user(user_profile.user).delete()
                    all_unexpired_sessions_for_user(android_user).delete()
                    user_profile.attempts = 0
                    try:
                        android_model = AndroidModel.objects.get(user=android_user)
                        android_model.attempts = 0
                        android_model.save()
                    except UserProfile.DoesNotExist:
                        android_model = None

                    user_profile.user.set_password(new_pass_form.cleaned_data['new_password'])
                    user_profile.user.save()
                    user_profile.reset_key = RESET_KEY_NOT_USABLE
                    user_profile.reset_confirm_key = RESET_KEY_NOT_USABLE
                    user_profile.save()

                    android_user.set_password(new_pass_form.cleaned_data['new_password'])
                    android_user.save()

                    return render(request, 'MessageApp/new_password_link.html', locals())

            show_error = True

    if request.method == "GET":
        show_input = True

    new_pass_form = NewPasswordForm()

    return render(request, 'MessageApp/new_password_link.html', locals())


def activate(request, key):

    #some how it returns a the unusable key immediately forward back to index
    if key == ACTIVATE_KEY_NOT_USABLE:
        return redirect('MessageApp:index')

    new_link_option = False
    try:
        user_profile = UserProfile.objects.get(activate_key=key)
    except UserProfile.DoesNotExist:
        user_profile = None

    if user_profile is not None:
        #checks if user account is not active should NEVER HAPPEN *********** add log
        if not user_profile.activated_account:
            user_profile.activate_key = ACTIVATE_KEY_NOT_USABLE
            user_profile.activated_account = True
            user_profile.save()
            return render(request, 'MessageApp/activate.html', locals())

    expired_or_not_right = True
    return render(request, 'MessageApp/activate.html', locals())

def send_alpha_key(alpha_key, alpha_url, alpha_key_pass, email):
    subject = "Alpha Key"
    from RoofMessage import settings
    email_template = get_template(EMAIL_ALPHA_KEY)
    message = email_template.render(Context({"alpha_key": alpha_key,
                                            "alpha_key_pass":alpha_key_pass,
                                            "alpha_url":alpha_url}))
    send_email(subject, message, email, True)

def send_email(subject, message, email, forward):
    try:
        from RoofMessage import settings
        send_mail(subject=subject, message=message,html_message=message, from_email=settings.EMAIL_HOST_USER,
                  recipient_list=(email,), fail_silently=True)
    except BadHeaderError:
        ############need to add error page with optional message and optional countdown
        #### also add log for error
        if forward:
            return redirect('MessageApp:index')

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
@user_passes_test(user_allowed,login_url='/')
@login_required()
def message(request):
    return render(request, 'MessageApp/message.html', {"debug":settings.DEBUG})

def all_unexpired_sessions_for_user(user):
    user_sessions = []
    from django.utils.datetime_safe import datetime
    all_sessions  = Session.objects.filter(expire_date__gte=datetime.now())
    for session in all_sessions:
        session_data = session.get_decoded()
        if user.pk == session_data.get('_auth_user_id'):
            user_sessions.append(session.pk)
    return Session.objects.filter(pk__in=user_sessions)

