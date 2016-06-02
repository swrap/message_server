from django.conf.urls import url

# Url patterns that django follows and directs to the specified views.

urlpatterns = [
    url(r'^$', 'MessageApp.views.index', name='index'),
    url(r'^login/$', 'MessageApp.views.user_login', name='login'),
    url(r'^logout/$', 'MessageApp.views.user_logout', name='logout'),

    url(r'^message/$', 'MessageApp.views.message', name='message'),

    url(r'^settings/$', 'MessageApp.views.settings', name='settings'),

    url(r'^register/$', 'MessageApp.views.register', name='register'),
    url(r'activate/(?P<key>.+)$', 'MessageApp.views.activate', name='activate'),
    url(r'^new_link/(?P<key>.+)$', 'MessageApp.views.new_link', name='new_link'),

    url(r'^delete_account/(?P<user_id>\d+)/$', 'MessageApp.views.delete_account', name='delete_account'),

    url(r'^new_password/$', 'MessageApp.views.new_password', name='new_password'), #settings new password
    url(r'^new_password_send/$', 'MessageApp.views.new_password_send', name='new_password_send'), #used to send link
    url(r'^new_password_link/(?P<key>.+)$', 'MessageApp.views.new_password_link', name='new_password_link'),
]