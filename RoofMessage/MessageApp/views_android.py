from django.contrib.auth import authenticate, logout, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.shortcuts import render
from django.conf import settings
import os

from .models import AndroidModel, ANDROID_CONSTANT, MAX_ATTEMPTS, UserProfile
from .forms import UserLoginForm

def android_login(request):
    if request.POST:
        username = request.POST['username']

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
                reason = "Please reset password, account password attempted to many times."
                response = HttpResponse(request, status=460)
                response.reason_phrase = reason
                return response

        username = username + ANDROID_CONSTANT
        password = request.POST['password']

        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            user_profile.attempts = 0
            user_profile.save()
            return HttpResponse(request, status=200)
    elif request.method == "GET":
        user_form = UserLoginForm()
        context = {"user_form": user_form}
        return render(request, 'MessageApp/android_login.html', context, status=200)

    return HttpResponse(request, status=400)

@login_required
def android_logout(request):
    if request.POST:
        # Since user is logged in, we can just log them out.
        if request is not None and request.user.is_active:
            logout(request)
            # Takes the user back to the index page.
            return HttpResponse(request, status=200)
    elif request.method == "GET":
        return HttpResponse(request, status=200)
    return HttpResponse(request, status=400)

def check_user(username):
    if username is not None:
        username = str(username)
        try:
            user = User.objects.get(username=username)
            android_model = get_android_model(user)
            if android_model is not None:
                android_model.attempts = int(android_model.attempts)+1
                android_model.save()
                if android_model.attempts == MAX_ATTEMPTS:
                    user = android_model.user
                    user.is_active = False
                    user.save()
        except User.DoesNotExist:
            return False
    return False


def get_android_model(user):
    try:
        return user.androidmodel__set.get(user=user)
    except AndroidModel.DoesNotExist:
        return None

def check_version(request):
    return render(request, 'MessageApp/android_version.html', status=200)