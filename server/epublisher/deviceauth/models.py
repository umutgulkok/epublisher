import binascii
import os

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Device(models.Model):
    id = models.AutoField("ID", primary_key=True, editable=False)
    token = models.CharField(_("Auth Token"), max_length=40, default=None, editable=False)
    fingerprint = models.CharField(_("Fingerprint"), max_length=120, editable=False)
    name = models.CharField(_("Name"), max_length=60, editable=False)
    os = models.CharField(_("OS"), max_length=40, editable=False)
    type = models.CharField(_("Type"), max_length=40, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name=_("User"),
        editable=False
    )
    date_created = models.DateTimeField(_("Date Created"), auto_now=True, editable=False)

    class Meta:
        verbose_name = _("User Device")
        verbose_name_plural = _("User Device")

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = binascii.hexlify(os.urandom(20)).decode()
        return super().save(*args, **kwargs)

    def __str__(self):
        return str(self.user) + ' - ' + str(self.id)
