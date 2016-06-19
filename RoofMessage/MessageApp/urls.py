from django.conf.urls import url

# Url patterns that django follows and directs to the specified views.

from . import views, views_ajax

urlpatterns = [
    # NON AJAX CALLS
    url(r'^$', views.index, name='index'),
    url(r'^login/$', views.user_login, name='login'),
    url(r'^logout/$', views.user_logout, name='logout'),

    url(r'^message/$', views.message, name='message'),

    url(r'^settings/$', views.settings_page, name='settings'),

    url(r'^register/$', views.register, name='register'),
    url(r'activate/(?P<key>.+)$', views.activate, name='activate'),

    url(r'^delete_account/$', views.delete_account, name='delete_account'),

    url(r'^new_password_send/$', views.new_password_send, name='new_password_send'), #used to send link
    url(r'^new_password_link/(?P<key>.+)$', views.new_password_link, name='new_password_link'),

    url(r'^testing/$', views.jquery_test, name='testing'),

    # AJAX CALLS
    url(r'^get_all_contacts/$', views_ajax.get_all_contacts, name='all_contacts'),
    url(r'^user_contacts/$', views_ajax.get_user_contacts, name='user_contacts'),

    url(r'^create_conversation/$', views_ajax.create_conversation, name='create_conversation'),
    url(r'^get_conversations/$', views_ajax.get_conversations, name='get_conversations'),

    url(r'^create_message/$', views_ajax.create_message, name='create_message'),
    url(r'^get_messages/$', views_ajax.get_messages, name='get_messages'),
]