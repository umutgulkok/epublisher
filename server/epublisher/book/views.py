import os

from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView

from epublisher.book.models import Ownership, Book
from epublisher.book.serializers import BookSerializer
from epublisher.deviceauth.models import Device
from .constants import (
    STORAGE_DIR_NAME, COVER_FILENAME, EPUB_FILENAME, SEARCH_FILENAME, LOCATIONS_FILENAME,
)


def is_book_ready(book):
    if not book.active:
        return False

    book_dir = f'{STORAGE_DIR_NAME}/{book.key}'
    image_file_name = f'{book_dir}/{COVER_FILENAME}'
    book_file_name = f'{book_dir}/{EPUB_FILENAME}'
    search_file_name = f'{book_dir}/{SEARCH_FILENAME}'
    locations_file_name = f'{book_dir}/{LOCATIONS_FILENAME}'

    if not os.path.exists(image_file_name):
        return False

    if not os.path.exists(book_file_name):
        return False

    if not os.path.exists(search_file_name):
        return False

    if not os.path.exists(locations_file_name):
        return False

    return True


class MyBooksView(APIView):
    serializer = BookSerializer()

    @staticmethod
    def get(request):
        device_auth_token = request.GET.get('auth_token', None)
        device_fingerprint = request.GET.get('fingerprint', None)
        if not device_auth_token or not device_fingerprint:
            return Response('Missing data', status=400)

        try:
            device_record = Device.objects.get(token=device_auth_token,
                                               fingerprint=device_fingerprint)
        except Device.DoesNotExist:
            return Response(status=403)
        if not device_record:
            return Response(status=403)

        ownerships = Ownership.objects.filter(user=device_record.user)
        ownerships = [o for o in ownerships if is_book_ready(o.book)]
        books_of_user = [BookSerializer(ownership.book).data for ownership in ownerships]
        return Response(books_of_user)


class BookContentView(APIView):
    CONTENT_KEY_COVER = 'cover'
    CONTENT_KEY_BOOK = 'book'
    CONTENT_KEY_LOCATIONS = 'locations'
    CONTENT_KEY_SEARCH = 'search'
    VALID_CONTENT_KEYS = [CONTENT_KEY_COVER, CONTENT_KEY_BOOK, CONTENT_KEY_LOCATIONS,
                          CONTENT_KEY_SEARCH]

    @staticmethod
    def get(request):
        device_auth_token = request.GET.get('auth_token', None)
        device_fingerprint = request.GET.get('fingerprint', None)
        book_key = request.GET.get('book_key', None)
        content_key = request.GET.get('content_key', None)
        if not device_auth_token or not device_fingerprint or not book_key or not content_key:
            return Response('Missing data', status=400)
        if content_key not in BookContentView.VALID_CONTENT_KEYS:
            return Response(
                f'Content key should be one of '
                f'{[str(x) for x in BookContentView.VALID_CONTENT_KEYS]}',
                status=400)

        try:
            device_record = Device.objects.get(token=device_auth_token,
                                               fingerprint=device_fingerprint)
        except Device.DoesNotExist:
            return Response(status=403)
        if not device_record:
            return Response(status=403)

        book = Book.objects.get(key=book_key)
        if not book or not is_book_ready(book):
            return Response('Not found', status=404)

        ownership = Ownership.objects.filter(user=device_record.user, book=book)
        if not ownership:
            return Response('Unauthorized', status=401)

        book_dir = f'{STORAGE_DIR_NAME}/{book.key}'

        if content_key == BookContentView.CONTENT_KEY_COVER:
            image_file_name = f'{book_dir}/{COVER_FILENAME}'
            with open(image_file_name, "rb") as f:
                return HttpResponse(f.read(), content_type="image/jpeg")

        elif content_key == BookContentView.CONTENT_KEY_LOCATIONS:
            locations_file_name = f'{book_dir}/{LOCATIONS_FILENAME}'
            with open(locations_file_name, "rb") as f:
                return HttpResponse(f.read(), content_type="application/json")

        elif content_key == BookContentView.CONTENT_KEY_SEARCH:
            search_file_name = f'{book_dir}/{SEARCH_FILENAME}'
            with open(search_file_name, "rb") as f:
                return HttpResponse(f.read(), content_type="application/json")

        else:
            # EPUB
            book_file_name = f'{book_dir}/{EPUB_FILENAME}'
            with open(book_file_name, "rb") as f:
                return HttpResponse(f.read(), content_type="application/epub+zip")
