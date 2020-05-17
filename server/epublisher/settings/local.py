from .base import *
import os
from os import path
from pathlib import Path

STORAGE_DIR = path.join(
    Path(os.path.dirname(os.path.realpath(__file__))).parent.parent.parent.absolute(), 'storage')

# Full-Text Search

# EPUB_STORAGE_DIR = path.join(STORAGE_DIR, 'books')
EPUB_STORAGE_DIR = '/Users/umutgulkok/Epublisher/storage/books'

STATICFILES_DIRS = [EPUB_STORAGE_DIR, ]

USER_API_URL = 'https://yetkin.com.tr/index.php?route=api/auth&api_token=1'
USER_API_USERNAME = 'epublisher'
USER_API_KEY = '84gJkcZqqrw31UMT7MwJeyaKEaPYpQdBFcMpGuVanAzx7fzY7YwpOf5ME8sXj3Mwrrqx4CDLmgIx6SeY4' \
               'dTPMSTbPLeBVjZ1aUWhejahh1HCCefp5LSbHLhqAOB1AO6buLaMzweDWf6aJPBOjlAN3sHzpaqkCsOGbC' \
               'OHL07MjwpAK3Rixszm8iscfhaLLdiuwY5f1EeCF5uDm6Vhw3Dq2U2PxhWIQojn7AOaMPuxGB1YyZn077p' \
               'NOWnSoSITsqVC'
