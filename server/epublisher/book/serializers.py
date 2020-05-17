from rest_framework import serializers


class BookSerializer(serializers.Serializer):
    key = serializers.CharField()
    name = serializers.CharField()
    isbn = serializers.CharField()
    author = serializers.CharField()
    publisher = serializers.CharField()
    date_published = serializers.DateTimeField()
