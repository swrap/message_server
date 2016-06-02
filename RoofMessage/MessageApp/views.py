from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.http import BadHeaderError
from django.shortcuts import render, redirect
from django.utils import timezone

from .models import UserProfile
from .forms import UserForm, PasswordForm, NewPasswordForm

# CONSTANT FOR KEY
KEY_NOT_USABLE = "N0neU5eAb1eS0rrY"


def index(request):
    # redirects user back to message page
    if request.user.is_active:
        return redirect('MessageApp:message')
    return render(request, 'MessageApp/index.html', {})


@login_required()
def user_logout(request):
    # Since user is logged in, we can just log them out.
    if request != None and request.user.is_active:
        logout(request)
        # Takes the user back to the index page.
        return redirect('MessageApp:index')


def user_login(request):
    # redirects user back to homepage
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
                return render(request, 'MessageApp/index.html',
                              {"login": "Please Verify your account with the email we sent you"})
        else:
            return render(request, 'MessageApp/index.html', {"login": "Incorrect Login Username or password"})
    else:
        return render(request, 'MessageApp/index.html', {})


@login_required()
def message(request):
    return render(request, 'MessageApp/message.html', {})


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
                user.delete()
                return render(request, 'MessageApp/delete_account.html', locals())
        else:
            error = "Must enter password in order to delete account."

    pass_form = PasswordForm()

    return render(request, 'MessageApp/settings.html', locals())


@login_required()
def settings(request):
    pass_form = PasswordForm()
    return render(request, 'MessageApp/settings.html', locals())


@login_required()
def message(request):
    return render(request, 'MessageApp/message.html', locals())


def register(request):
    if request.POST:
        user_form = UserForm(data=request.POST)

        if user_form.is_valid():
            user = user_form.save(commit=False)

            user.set_password(user.password)
            # user must first use activate before becoming active
            user.is_active = False
            user.save()

            user_profile = UserProfile.objects.create(user=user)
            user_profile.new_activate_key();

            subject = "Activate Account (AUTOMATED EMAIL, DO NOT RESPOND)"
            from RoofMessage import settings
            link = settings.DOMAIN_HOST + "/activate/" + user_profile.activate_key
            message = "Welcome to Roof's Messaging App!\nPlease click on this link:" + link
            send_email(subject, message, user.email)
            # logger.info("User \"" + user.username + "\" has been registered")

            return redirect('MessageApp:index')
        else:
            print(user_form.errors)
    else:
        user_form = UserForm()

    context = {"user_form": user_form}
    return render(request, 'MessageApp/register.html', context)

    # used for reseting from settings


@login_required()
def new_password(request):
    if request.POST:
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

                update_session_auth_hash(request, user)

                # send mail about changed password
                subject = "Password Change (AUTOMATED EMAIL, DO NOT RESPOND)"
                message = "Greetings from Roof Messages!\n Your password has been changed."
                send_email(subject, message, user.email)
                pass_change_success = True
            else:
                pass_form.add_error("old_password", "Password is incorrect")
        else:
            print(pass_form.errors)
    else:
        pass_form = PasswordForm()

    return render(request, 'MessageApp/settings.html', locals())

    # change password through link


def new_password_send(request):
    blank = "a"
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
                message = "Greetings from Roof Messages!\n " \
                          "Click the this link:" + link + "\n" \
                                                          "And enter this key: " + key
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

            if user_profile is not None and user_profile.reset_key != KEY_NOT_USABLE:
                user_profile.user.set_password(new_pass_form.cleaned_data['new_password'])
                user_profile.user.save()

                user_profile.reset_key = KEY_NOT_USABLE
                user_profile.save()
            else:
                show_error = True

    if request.method == "GET":
        show_input = True

    new_pass_form = NewPasswordForm()

    return render(request, 'MessageApp/new_password_link.html', locals())


def activate(request, key):
    import datetime
    dt = datetime.datetime

    new_link_option = False
    try:
        user_profile = UserProfile.objects.get(activate_key=key)
    except UserProfile.DoesNotExist:
        user_profile = None

    if user_profile.user.is_active == False:
        dt = user_profile.user.date_joined + datetime.timedelta(days=7)
        if timezone.now() > dt:
            # error
            new_link_option = True
            return render(request, 'MessageApp/activate.html', locals())
        else:
            user_profile.user.is_active = True
            user_profile.user.save()
        return render(request, 'MessageApp/activate.html', locals())
    return redirect('MessageApp:index')

def send_email(subject, message, email):
    try:
        from RoofMessage import settings
        send_mail(subject=subject, message=message, from_email=settings.EMAIL_HOST_USER,
                  recipient_list=(email,), fail_silently=True)
    except BadHeaderError:
        ############need to add error page with optional message and optional countdown
        #### also add log for error
        return
