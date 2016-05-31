from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class UserProfile(models.Model):
    activate_key = models.CharField(max_length=64)
    user = models.OneToOneField(User, on_delete=models.CASCADE, default='')
    def __str__(self):
        return self.user.username

class Conversation(models.Model):
    title = models.CharField(max_length=50)
    users = models.ManyToManyField(User)

class Message(models.Model):
    date = models.DateField()
    time = models.TimeField()
    text = models.CharField(max_length=1000)
    conversation = models.ForeignKey(Conversation)