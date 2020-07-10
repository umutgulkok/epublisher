import os

from django.conf import settings
from django.db import models
import uuid

from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from .helpers import ContentTypeRestrictedFileField, process_book_content
from .constants import (
    COVER_FILENAME, STORAGE_DIR_NAME, EPUB_FILENAME, MAX_IMAGE_UPLOAD_SIZE, MAX_EPUB_UPLOAD_SIZE,
)


class Book(models.Model):
    key = models.CharField("Key", max_length=40, primary_key=True, editable=False)
    isbn = models.CharField(_("ISBN"), max_length=60)
    name = models.CharField(_("Name"), max_length=200)
    author = models.CharField(_("Author"), max_length=200)
    publisher = models.CharField(_("Publisher"), max_length=200)
    active = models.BooleanField(_("Active"), default=True)
    date_published = models.DateTimeField(_("Date Published"), auto_now_add=True)
    date_added = models.DateTimeField(_("Date Added"), auto_now_add=True)

    class Meta:
        verbose_name = _("Book")
        verbose_name_plural = _("Books")

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = uuid.uuid4()

        book_dir = f'{settings.STORAGE_DIR}/{self.key}'
        os.mkdir(book_dir)

        return super().save(*args, **kwargs)

    def __str__(self):
        return str(self.isbn) + ' - ' + str(self.name[:30]) + ' - ID: ' + str(self.key)[
                                                                          0:2] + '...' + str(
            self.key)[-2:] + ''


def image_path(instance, filename):
    file_name = f'{STORAGE_DIR_NAME}/{instance.book.key}/{COVER_FILENAME}'
    if os.path.exists(file_name):
        os.remove(file_name)
    return file_name


def epub_path(instance, filename):
    file_name = f'{STORAGE_DIR_NAME}/{instance.book.key}/{EPUB_FILENAME}'
    if os.path.exists(file_name):
        os.remove(file_name)
    return file_name


class Content(models.Model):
    id = models.AutoField("ID", primary_key=True, editable=False)
    book = models.OneToOneField(Book, on_delete=models.CASCADE, verbose_name=_("Book"))
    image = ContentTypeRestrictedFileField(_("Image File"), upload_to=image_path,
                                           content_types=['image/jpeg'],
                                           max_upload_size=MAX_IMAGE_UPLOAD_SIZE)
    epub = ContentTypeRestrictedFileField(_("Epub File"), upload_to=epub_path,
                                          content_types=['application/epub+zip'],
                                          max_upload_size=MAX_EPUB_UPLOAD_SIZE)
    date_added = models.DateTimeField(_("Date Added"), auto_now_add=True, editable=False)

    class Meta:
        verbose_name = _("Book Content")
        verbose_name_plural = _("Book Contents")

    def save(self, *args, **kwargs):
        process_book_content(self)
        return super().save(*args, **kwargs)

    def __str__(self):
        return str(self.book)


@receiver(post_delete, sender=Content)
def book_content_deleted(sender, instance, **kwargs):
    instance.image.delete(False)
    instance.epub.delete(False)


class Ownership(models.Model):
    id = models.AutoField("ID", primary_key=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             verbose_name=_("User"))
    book = models.ForeignKey(Book, on_delete=models.CASCADE, verbose_name=_("Book"))
    date_added = models.DateTimeField(_("Date Added"), auto_now_add=True, editable=False)

    class Meta:
        verbose_name = _("Ownership")
        verbose_name_plural = _("Ownerships")

    def __str__(self):
        return str(self.user) + ' - ' + str(self.book)
