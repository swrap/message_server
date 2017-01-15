"""RoofMessage URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include, handler400, handler403, handler404, handler500
from django.conf.urls.static import static
from django.contrib import admin

from django.conf import settings

handler400 = 'MessageApp.views.bad_request'
handler403 = 'MessageApp.views.permission_denied'
handler404 = 'MessageApp.views.page_not_found'
handler500 = 'MessageApp.views.server_error'

if settings.DEBUG:
	urlpatterns = [
	    url(r'^admin/', admin.site.urls),
	    url(r'^', include('MessageApp.urls', namespace="MessageApp")),
	]
else:
	urlpatterns = [
	    url(r'^', include('MessageApp.urls', namespace="MessageApp")),
	]

#tests if still in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
