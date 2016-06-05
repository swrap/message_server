from django.conf.urls import url

# Url patterns that django follows and directs to the specified views.

urlpatterns = [
    url(r'^$', 'MessageApp.views.index', name='index'),
    url(r'^login/$', 'MessageApp.views.user_login', name='login'),
    url(r'^logout/$', 'MessageApp.views.user_logout', name='logout'),

    url(r'^message/$', 'MessageApp.views.message', name='message'),

    url(r'^settings/$', 'MessageApp.views.settings_page', name='settings'),

    url(r'^register/$', 'MessageApp.views.register', name='register'),
    url(r'activate/(?P<key>.+)$', 'MessageApp.views.activate', name='activate'),

    url(r'^delete_account/$', 'MessageApp.views.delete_account', name='delete_account'),

    url(r'^new_password_send/$', 'MessageApp.views.new_password_send', name='new_password_send'), #used to send link
    url(r'^new_password_link/(?P<key>.+)$', 'MessageApp.views.new_password_link', name='new_password_link'),

    url(r'^testing/$', 'MessageApp.views.jquery_test', name='testing'),

    url(r'^get_all_contacts/$', 'MessageApp.views_ajax.get_all_contacts', name='all_contacts'),
    url(r'^user_contacts/$', 'MessageApp.views_ajax.get_user_contacts', name='user_contacts'),
]