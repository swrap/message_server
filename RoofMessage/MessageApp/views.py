from django.shortcuts import render

# Create your views here.

def user_logout(request):
    """
    The user is logged out of his account an returned to the homepage.
    :param request: Accepts a request object.
    :return: A user is logged out, and returned to the homepage.
    """
    # Since user is logged in, we can just log them out.
    if request.user.is_authenticated():
        logout(request)
    # Takes the user back to the index page.
    return HttpResponseRedirect("/healthnet/")

def user_login(request):
    """
    Allows a user to attempt to login with the right credentials
    :param request: Accepts a request object.
    :return: A user is logged out, and returned to the homepage.
    """
    #redirects user back to homepage
    if request.user.is_active:
        return HttpResponseRedirect("/healthnet/")

    # If the request is a HTTP POST, try to pull out the relevant information.
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user:
            if user.is_active:
                login(request, user)
                user = request.user
                user_group = user.groups.all()[0].name
                if user_group == "Administrator":
                    user_group = "admin"
                return HttpResponseRedirect("/healthnet/" + user_group.lower() + "/")
            else:
                return render(request, 'healthnet/index.html', {"login" : "Incorrect Login Username or password"})
        else:
            return render(request, 'healthnet/index.html', {"login" : "Incorrect Login Username or password"})
    else:
        return render(request, 'healthnet/index.html', {})