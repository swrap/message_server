from django.conf.urls import url

# Url patterns that django follows and directs to the specified views.

urlpatterns = [
    url(r'^$', 'MessageApp.views.index', name='index'),
    url(r'^login/', 'MessageApp.views.user_login', name='login'),
    url(r'^logout/', 'MessageApp.views.user_logout', name='logout'),
    url(r'^register/', 'MessageApp.views.register', name='register'),
    url(r'^message/', 'MessageApp.views.message', name='message'),
    url(r'activate/(?P<key>.+)$', 'MessageApp.views.activate', name='activate'),
    url(r'^new_link/(?P<key>.+)$', 'MessageApp.views.new_link', name='new_link'),
    url(r'^delete_account/$', 'MessageApp.views.delete_account', name='delete_account'),
]