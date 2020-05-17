import requests
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView

from epublisher.deviceauth.models import Device


class DeviceAuthView(APIView):

    @staticmethod
    def post(request):
        username = request.POST.get('username', None)
        password = request.POST.get('password', None)
        device_fingerprint = request.POST.get('device_fingerprint', None)
        device_name = request.POST.get('device_name', None)
        device_type = request.POST.get('device_type', None)
        device_os = request.POST.get('device_os', None)

        if not username or not password or not device_fingerprint or not device_name or not \
                device_type or not device_os:
            return Response('Missing data', status=400)

        user = authenticate(username=username, password=password)
        if not user:
            external_auth_request = requests.post(settings.USER_API_URL, data={
                'api_username': settings.USER_API_USERNAME,
                'api_key': settings.USER_API_KEY,
                'email': username,
                'password': password,
            })
            external_auth_response = external_auth_request.json()
            if not external_auth_response or not external_auth_response.get('success', False):
                return Response(status=403)

            # Credentials did not authenticate here but it did on the remote server
            try:
                user = User.objects.get(username=username)
                # We have the user object so the password might have been changed on the main site
                # update the password
                user.password = password
            except User.DoesNotExist:
                # First time for this user, cache it by creating a User object
                User(username=username, email=username, password=password,
                     first_name=external_auth_response.get('firstname', None),
                     last_name=external_auth_response.get('lastname', None)).save()
                user = User.objects.get(username=username)

        current_device = None

        devices_of_user = Device.objects.filter(user=user)
        for device_of_user in devices_of_user:
            if device_of_user.fingerprint == device_fingerprint:
                current_device = device_of_user
                break

        if not current_device:
            if len(devices_of_user) >= settings.DEVICE_LIMIT:
                return Response(data='Device limit reached', status=412)

            current_device = Device(user=user, fingerprint=device_fingerprint, name=device_name,
                                    type=device_type, os=device_os)
            current_device.save()

        return Response({
            'username': username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'auth_token': current_device.token,
        })
