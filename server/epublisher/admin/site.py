from django.conf import settings
from django.contrib.admin import AdminSite
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from django.contrib.auth.models import User, Group
from django.utils.translation import ugettext_lazy as _


class EpublisherAdminSite(AdminSite):
    # Text to put at the end of each page's <title>.
    site_title = _(settings.BRAND_NAME)

    # Text to put in each page's <h1> (and above login form).
    site_header = _(settings.BRAND_NAME)

    # Text to put at the top of the admin index page.
    index_title = _('Administration')


admin_site = EpublisherAdminSite()
admin_site.register(User, UserAdmin)
admin_site.register(Group, GroupAdmin)
