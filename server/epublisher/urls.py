from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import path, reverse_lazy
from django.views.generic import RedirectView

from epublisher.admin.site import admin_site
from epublisher.deviceauth.views import DeviceAuthView
from epublisher.book.views import MyBooksView, BookContentView

urlpatterns = [
    *i18n_patterns(
        path('admin/', admin_site.urls, name='admin'),
    ),
    path('mybooks/', MyBooksView.as_view()),
    path('content/', BookContentView.as_view()),
    path('auth/', DeviceAuthView.as_view()),
    path('', RedirectView.as_view(url=reverse_lazy('admin:index')))
]

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
