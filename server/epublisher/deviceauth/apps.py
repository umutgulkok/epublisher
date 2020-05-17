from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class DeviceAuthConfig(AppConfig):
    name = 'epublisher.deviceauth'
    verbose_name = _("User Devices")
