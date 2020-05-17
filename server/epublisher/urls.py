from django.conf.urls.i18n import i18n_patterns
from django.urls import path

from epublisher.admin.site import admin_site
from epublisher.deviceauth.views import DeviceAuthView
from epublisher.book.views import MyBooksView, BookContentView

urlpatterns = [
    *i18n_patterns(
        path('admin/', admin_site.urls),
    ),
    path('mybooks/', MyBooksView.as_view()),
    path('content/', BookContentView.as_view()),
    path('auth/', DeviceAuthView.as_view())
]
