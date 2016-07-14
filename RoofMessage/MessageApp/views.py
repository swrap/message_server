from datetime import timedelta

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

from . import views_android
from .models import UserProfile, AndroidModel, GROUP_ANDROID, GROUP_BROWSER
from .forms import UserForm, PasswordForm, NewPasswordForm

# CONSTANT FOR KEY
RESET_KEY_NOT_USABLE = "N0neU5eAb1eS0rrY"
ACTIVATE_KEY_NOT_USABLE = "W00BabYib0YoooBroo"
LINK_EXPIRATION = 2 #days for new pass link to expire

#Email file Constants
from django.conf import settings
EMAIL_DELETE_ACCOUNT = "deleted_account.html"
EMAIL_NEW_PASSWORD_LINK = "new_password_link.html"
EMAIL_PASSWORD_CHANGE_NOTIFICATION = "pass_change_email.html"
EMAIL_VERIFY_ACCOUNT= "verify_account_email.html"

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

    if request.user.is_authenticated():
        return redirect('MessageApp:message')
    return render(request, 'MessageApp/index.html', {})


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
        if user:
            if user.is_active:
                login(request, user)
                return redirect('MessageApp:message')
            else:
                return render(request, 'MessageApp/index.html',
                              {"login": "Account is disabled contact us to find out why!"})
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
            if user is not None:
                # send mail about account delete
                subject = "Deleted Account (AUTOMATED EMAIL, DO NOT RESPOND)"
                from RoofMessage import settings
                email_template = get_template(EMAIL_DELETE_ACCOUNT)
                message = email_template.render()
                send_email(subject, message, user.email)
                user.delete()
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
                if user is not None and user.check_password(old_password):
                    user.set_password(pass_form.cleaned_data['new_password1']);
                    user.save()

                    #signs user back in after updating password
                    update_session_auth_hash(request, user)

                    # send mail about changed password
                    subject = "Password Change (AUTOMATED EMAIL, DO NOT RESPOND)"
                    email_template = get_template(EMAIL_PASSWORD_CHANGE_NOTIFICATION)
                    message = email_template.render()
                    send_email(subject, message, user.email)
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
            send_email(subject, message, request.user.email)
            email_sent = True

    pass_form = PasswordForm()
    return render(request, 'MessageApp/settings.html', locals())

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
@user_passes_test(user_allowed,login_url='/')
@login_required()
def message(request):
    return render(request, 'MessageApp/message.html', locals())


def register(request):
    if request.POST:
        user_form = UserForm(data=request.POST)
        post_copy = request.POST.copy()
        post_copy['username'] = str(post_copy['username'] + views_android.ANDROID_CONSTANT)
        android_form = UserForm(data=post_copy)

        if user_form.is_valid() and android_form.is_valid():
            user = user_form.save(commit=False)
            user.set_password(user.password)
            user.save()
            group = Group.objects.get(name=GROUP_BROWSER)
            group.user_set.add(user)

            user_profile = UserProfile.objects.create(user=user)
            user_profile.new_activate_key();
            user_profile.reset_key = RESET_KEY_NOT_USABLE
            user_profile.save()

            android_user = android_form.save(commit=False)
            android_user.set_password(android_user.password)
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
            send_email(subject, message, user.email)
            # logger.info("User \"" + user.username + "\" has been registered")

            return redirect('MessageApp:index')
        else:
            print(user_form.errors)
    else:
        user_form = UserForm()
    context = {"user_form": user_form}
    return render(request, 'MessageApp/register.html', context)

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
                link = settings.DOMAIN_HOST + "/new_password_link/" + user_profile.new_activate_key()
                email_template = get_template(EMAIL_NEW_PASSWORD_LINK)
                message = email_template.render(Context({"activation_key": link, "reset_key": key}))
                send_email(subject, message, user.email)
                change_screen = True
                return render(request, 'MessageApp/new_password.html', locals())

    return render(request, 'MessageApp/new_password.html', locals())


def new_password_link(request, key):
    if request.POST:
        new_pass_form = NewPasswordForm(request.POST)
        if new_pass_form.is_valid():
            reset_key = new_pass_form.cleaned_data['reset_key']
            try:
                user_profile = UserProfile.objects.get(reset_key=reset_key, activate_key=key)
            except UserProfile.DoesNotExist:
                user_profile = None

            if user_profile is not None and user_profile.reset_key != RESET_KEY_NOT_USABLE and user_profile.activated_account != ACTIVATE_KEY_NOT_USABLE:
                days = date.today()-user_profile.new_pass_created
                time_delta =  timedelta(days=LINK_EXPIRATION)
                if days < time_delta:
                    user_profile.user.set_password(new_pass_form.cleaned_data['new_password'])
                    user_profile.reset_key = RESET_KEY_NOT_USABLE
                    user_profile.activate_key = ACTIVATE_KEY_NOT_USABLE
                    user_profile.save()
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

def send_email(subject, message, email):
    try:
        from RoofMessage import settings
        send_mail(subject=subject, message=message,html_message=message, from_email=settings.EMAIL_HOST_USER,
                  recipient_list=(email,), fail_silently=True)
    except BadHeaderError:
        ############need to add error page with optional message and optional countdown
        #### also add log for error
        return redirect('MessageApp:index')

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
@user_passes_test(user_allowed,login_url='/')
@login_required()
def message(request):
    return render(request, 'MessageApp/message.html', {})