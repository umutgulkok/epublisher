# Generated by Django 3.0.5 on 2020-04-25 19:24

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Device',
            fields=[
                ('id', models.AutoField(editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(default=None, editable=False, max_length=40, verbose_name='Auth Token')),
                ('fingerprint', models.CharField(editable=False, max_length=120, verbose_name='Fingerprint')),
                ('name', models.CharField(editable=False, max_length=60, verbose_name='Name')),
                ('os', models.CharField(editable=False, max_length=40, verbose_name='OS')),
                ('type', models.CharField(editable=False, max_length=40, verbose_name='Type')),
                ('date_created', models.DateTimeField(auto_now=True, verbose_name='Date Created')),
                ('user', models.ForeignKey(editable=False, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'User Device',
                'verbose_name_plural': 'User Device',
            },
        ),
    ]
