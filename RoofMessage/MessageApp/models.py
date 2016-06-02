import hashlib

from django.db import models
from django.contrib.auth.models import User

# Create your models here.
from django.utils.crypto import random
from django.utils.datetime_safe import date


class UserProfile(models.Model):
    activate_key = models.CharField(max_length=64, null=True, default='')
    reset_key = models.CharField(max_length=64, null=True, default='')
    new_pass_created = models.DateField(default=date.today())
    user = models.OneToOneField(User, on_delete=models.CASCADE, default='')
    activated_account = models.BooleanField(default=False)
    def __str__(self):
        return self.user.username

    def new_activate_key(self):
        """Create new activate key and saves value to object

        Keyword arguments:
        self -- instance of self

        :return: new key value as 64 sized string
        """
        usernamesalt = self.user.username.encode('utf8')
        salt = hashlib.sha256(str(random.random()).encode('utf-8')).hexdigest()
        salt = salt.encode('utf-8')
        self.activate_key = hashlib.sha256(salt + usernamesalt).hexdigest()
        self.save()
        return self.activate_key

    def new_reset_key(self):
        """Create new activate key and saves value to object and sets
        new_pass_created to the current date.

        Keyword arguments:
        self -- instance of self

        :return: new key value as 64 sized string
        """
        usernamesalt = self.user.username.encode('utf8')
        salt = hashlib.sha256(str(random.random()).encode('utf-8')).hexdigest()
        salt = salt.encode('utf-8')
        self.reset_key = hashlib.sha256(salt + usernamesalt).hexdigest()
        self.new_pass_created = date.today()
        self.save()
        return self.reset_key


class Conversation(models.Model):
    title = models.CharField(max_length=50)
    users = models.ManyToManyField(User)

class Message(models.Model):
    date = models.DateField()
    time = models.TimeField()
    text = models.CharField(max_length=1000)
    conversation = models.ForeignKey(Conversation)