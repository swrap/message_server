from django.conf.urls import url
from django.views.generic import TemplateView

# Url patterns that django follows and directs to the specified views.
from django.contrib.auth.models import Group

from . import views, views_android

urlpatterns = [
    # BROWSER CALLS
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

    #ANDROID CALLS
    url(r'^android_login/$', views_android.android_login, name='android_login'),
    url(r'^android_logout/$', views_android.android_logout, name='android_logout'),
    url(r'^android_version/$', views_android.check_version, name='android_check_version'),

    #ROBOT.TXT
    url(r'^robots\.txt$', TemplateView.as_view(template_name='robots.txt')),
]