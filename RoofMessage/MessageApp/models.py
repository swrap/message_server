import hashlib

from datetime import timedelta

from django.db import models
from django.contrib.auth.models import User, Group

# Create your models here.
from django.utils.crypto import random
from django.utils import timezone
from django.utils.datetime_safe import date

GROUP_ANDROID = "Android"
GROUP_BROWSER = "Browser"

MAX_ATTEMPTS = 5
ANDROID_CONSTANT = str("_ANDROID")

class AndroidModel(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, default='')
    session_key = models.CharField(max_length=64, null=True, default='')
    key_created = models.DateField(default=timezone.now())
    attempts = models.IntegerField(default=0)

    def __str__(self):
        return self.user.username

    def new_session_key(self):
        usernamesalt = self.user.username.encode('utf-8')
        salt = hashlib.sha256(str(random.random()).encode('utf-8')).hexdigest()
        salt = salt.encode('utf-8')
        self.session_key = hashlib.sha256(salt + usernamesalt).hexdigest()
        self.key_created = timezone.now()
        self.save()
        return self.session_key

    def check_expire(self):
        if self.key_created is None:
            return False
        days = date.today() - self.key_created
        time_delta = timedelta(days=2)
        if days < time_delta:
            return True
        return False

    def logout(self):
        self.key_created = None
        self.session_key = None
        attempts = 0

    def ready(self):
        group = Group.objects.get(name=GROUP_ANDROID)
        group.user_set.add(self.user)

class UserProfile(models.Model):
    activate_key = models.CharField(max_length=64, null=True, default='')
    reset_confirm_key = models.CharField(max_length=64, null=True, default='')
    reset_key = models.CharField(max_length=64, null=True, default='')
    new_pass_created = models.DateField(default=timezone.now())
    user = models.OneToOneField(User, on_delete=models.CASCADE, default='')
    activated_account = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    amount_good_till = models.DateField(default=timezone.now())

    def __str__(self):
        return self.user.username

    def new_activate_key(self):
        """Create new activate key and saves value to object

        Keyword arguments:
        self -- instance of self

        :return: new key value as 64 sized string
        """
        usernamesalt = self.user.username.encode('utf-8')
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
        usernamesalt = self.user.username.encode('utf-8')
        salt = hashlib.sha256(str(random.random()).encode('utf-8')).hexdigest()
        salt = salt.encode('utf-8')
        self.reset_key = hashlib.sha256(salt + usernamesalt).hexdigest()
        self.new_pass_created = timezone.now()
        self.save()
        return self.reset_key


    def new_reset_confirm_key(self):
        """Create new reset confirm key and saves value to object

        Keyword arguments:
        self -- instance of self

        :return: new key value as 64 sized string
        """
        usernamesalt = self.user.username.encode('utf-8')
        salt = hashlib.sha256(str(random.random()).encode('utf-8')).hexdigest()
        salt = salt.encode('utf-8')
        self.reset_confirm_key = hashlib.sha256(salt + usernamesalt).hexdigest()
        self.save()
        return self.reset_confirm_key


    def check_attempts(self):
        if self.attempts >= MAX_ATTEMPTS:
            return False
        return True

class Contact(models.Model):
    contact = models.OneToOneField(User, on_delete=models.CASCADE,default='')
    is_blocked = models.BooleanField(default=False)
    contacts = models.ForeignKey(UserProfile,on_delete=models.CASCADE,default='',null=True,)

class Conversation(models.Model):
    title = models.CharField(max_length=50)
    users = models.ManyToManyField(User)

class Message(models.Model):
    user_poster = models.ForeignKey(User, on_delete=models.CASCADE,default='', null=True,)
    date = models.DateField(default=timezone.now())
    time = models.TimeField(default=timezone.now())
    text = models.CharField(max_length=1000)
    conversation = models.ForeignKey(Conversation)

class Key(models.Model):
    key = models.CharField(max_length=30, null=True, default='', unique=True)