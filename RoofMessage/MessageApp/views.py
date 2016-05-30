from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect
from django.shortcuts import render
from .forms import *

def index(request):
    #redirects user back to message page
    if request.user.is_active:
        return HttpResponseRedirect("/message/")
    return render(request, 'MessageApp/index.html', {})

def user_logout(request):
    # Since user is logged in, we can just log them out.
    if request != None and request.user.is_active:
        logout(request)
    # Takes the user back to the index page.
    return HttpResponseRedirect("/")

def user_login(request):
    #redirects user back to homepage
    if request.user.is_active:
        return HttpResponseRedirect("/message/")

    # If the request is a HTTP POST, try to pull out the relevant information.
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user:
            if user.is_active:
                login(request, user)
                user = request.user
                return HttpResponseRedirect("/")
            else:
                return render(request, 'MessageApp/index.html', {"login" : "Incorrect Login Username or password"})
        else:
            return render(request, 'MessageApp/index.html', {"login" : "Incorrect Login Username or password"})
    else:
        return render(request, 'MessageApp/index.html', {})

def register(request):

    if request.method == 'POST':
        user_form = UserForm(data=request.POST)

        if user_form.is_valid():
            user = user_form.save()
            print(user.password)
            user.set_password(user.password)
            user.save()

            # logger.info("User \"" + user.username + "\" has been registered")
            return HttpResponseRedirect("/")
        else:
            print(user_form.errors)
    else:
        user_form = UserForm()

    context = {"user_form" : user_form}
    return render(request, 'MessageApp/register.html', context)

@login_required
def message(request):
    return render(request, 'MessageApp/message.html', {})