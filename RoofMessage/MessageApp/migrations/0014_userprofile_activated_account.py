# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-06-02 21:31
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('MessageApp', '0013_auto_20160531_2149'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='activated_account',
            field=models.BooleanField(default=False),
        ),
    ]
