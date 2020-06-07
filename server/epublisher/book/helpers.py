import subprocess

from django.conf import settings
from django.db.models import FileField
from django.forms import forms
from django.template.defaultfilters import filesizeformat
from django.utils.translation import ugettext_lazy as _

from .constants import (
    EPUB_FILENAME, LOCATIONS_FILENAME, SEARCH_FILENAME,
)


class ContentTypeRestrictedFileField(FileField):
    """
    Same as FileField, but you can specify:
        * content_types - list containing allowed content_types. Example: [''image/jpeg']
        * max_upload_size - a number indicating the maximum file size allowed for upload.
            2.5MB - 2621440
            5MB - 5242880
            10MB - 10485760
            20MB - 20971520
            50MB - 5242880
            100MB - 104857600
            250MB - 214958080
            500MB - 429916160
    """

    def __init__(self, *args, **kwargs):
        self.content_types = kwargs.pop("content_types", [])
        self.max_upload_size = kwargs.pop("max_upload_size", 0)

        super(ContentTypeRestrictedFileField, self).__init__(*args, **kwargs)

    def clean(self, *args, **kwargs):
        data = super(ContentTypeRestrictedFileField, self).clean(*args, **kwargs)

        file = data.file
        try:
            content_type = file.content_type
            if content_type in self.content_types:
                if file._size > self.max_upload_size:
                    raise forms.ValidationError(
                        _('File size limit: {1}. Current file size: {2}').format(
                            filesizeformat(self.max_upload_size), filesizeformat(file._size)))
            else:
                raise forms.ValidationError(_('File type not supported'))
        except AttributeError:
            pass

        return data


def process_book_content(content):
    book_dir = f'{settings.STORAGE_DIR}/{content.book.key}'
    epub_file_name = f'{book_dir}/{EPUB_FILENAME}'
    locations_file_name = f'{book_dir}/{LOCATIONS_FILENAME}'
    search_file_name = f'{book_dir}/{SEARCH_FILENAME}'

    subprocess.Popen([settings.NODEJS_PATH, settings.LOCATIONS_PREPROCESSOR, epub_file_name,
                      locations_file_name], cwd=book_dir, shell=False, stdout=subprocess.PIPE,
                     stderr=subprocess.PIPE)

    subprocess.Popen(
        [settings.NODEJS_PATH, settings.SEARCH_PREPROCESSOR, epub_file_name, search_file_name],
        cwd=book_dir, shell=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
