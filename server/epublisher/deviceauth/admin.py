from django.contrib import admin
from .models import Device
from ..admin.decorators import register_to_admin


@register_to_admin(Device)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'type', 'os', 'date_created')
    list_display_links = None
    search_fields = ['user__username']
    ordering = ['-date_created']

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

