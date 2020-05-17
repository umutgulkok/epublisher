from django.contrib import admin

from epublisher.admin.decorators import register_to_admin
from epublisher.book.models import Book, Ownership, Content
from django.utils.translation import gettext_lazy as _


@register_to_admin(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['key', 'isbn', 'name', 'author', 'publisher', 'date_published', 'date_added',
                    'active']
    search_fields = ['isbn', 'name', 'author', 'publisher']
    ordering = ['-date_added']


@register_to_admin(Content)
class ContentAdmin(admin.ModelAdmin):
    def get_isbn_of_book(self, obj):
        return obj.book.isbn

    get_isbn_of_book.short_description = ' ISBN'

    def get_name_of_book(self, obj):
        return obj.book.name

    get_name_of_book.short_description = _('Name')

    def get_author_of_book(self, obj):
        return obj.book.author

    get_author_of_book.short_description = _('Author')

    def get_id_of_book(self, obj):
        return obj.book.key

    get_id_of_book.short_description = _('Book') + ' ID'

    list_display = ['id', 'get_isbn_of_book', 'get_name_of_book', 'get_author_of_book',
                    'get_id_of_book', 'date_added']
    search_fields = ['id', 'book', 'date_added']
    ordering = ['-date_added']
    autocomplete_fields = ['book']


@register_to_admin(Ownership)
class OwnershipAdmin(admin.ModelAdmin):
    def get_isbn_of_book(self, obj):
        return obj.book.isbn

    get_isbn_of_book.short_description = ' ISBN'

    def get_name_of_book(self, obj):
        return obj.book.name

    get_name_of_book.short_description = _('Name')

    def get_author_of_book(self, obj):
        return obj.book.author

    get_author_of_book.short_description = _('Author')

    def get_id_of_book(self, obj):
        return obj.book.key

    get_id_of_book.short_description = _('Book') + ' ID'

    list_display = ['id', 'user', 'get_isbn_of_book', 'get_name_of_book', 'get_author_of_book',
                    'get_id_of_book', 'date_added']
    search_fields = ['id', 'user', 'book', 'date_added']
    ordering = ['-date_added']
    autocomplete_fields = ['book', 'user']
