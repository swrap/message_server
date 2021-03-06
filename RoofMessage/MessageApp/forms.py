from django import forms
from django.contrib.auth.models import User

from .models import Key
from .views_android import *

class UserForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    rep_pass = forms.CharField(label=("Confirm Password"),
                               widget=forms.PasswordInput(attrs={"onChange":'PasswordMatch()',
                                                                 "oninvalid":'PasswordMatch()'}),
                               )
    key = forms.CharField(widget=forms.TextInput(), max_length=30)

    # checks to see if the username is in existance already
    def clean_username(self):
        username = self.cleaned_data['username']
        android_username = username + ANDROID_CONSTANT
        if User.objects.exclude(pk=self.instance.pk).filter(username=username).filter(username=android_username).exists() \
                or ANDROID_CONSTANT in username:
            raise forms.ValidationError('"%s" is already in use.' % username)
        return username

    # checks to see if the email used already
    def clean_email(self):
        email = self.cleaned_data['email']
        if User.objects.exclude(pk=self.instance.pk).filter(email=email).exists():
            raise forms.ValidationError('The email, %s, already has an account associated with it' % email)
        return email

    def clean_rep_pass(self):
        password = self.cleaned_data['password']
        rep_pass = self.cleaned_data['rep_pass']
        if (rep_pass and rep_pass) and (password != rep_pass):
                raise forms.ValidationError("Passwords do NOT match")

    def clean_key(self):
        self_key = self.cleaned_data['key']
        key_object = Key.objects.filter(key=self_key)
        if key_object.__len__() == 0:
            raise forms.ValidationError("Sorry alpha key is not recognized.")
        else:
            key_object = key_object[0]
            key_object.delete()

    def __init__(self, *args, **kwargs):
        super(UserForm, self).__init__(*args, **kwargs)

        for key in self.fields:
            self.fields[key].required = True

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password', )

class PasswordForm(forms.Form):
    old_password = forms.CharField(widget=forms.PasswordInput, label=("Password"))
    new_password1 = forms.CharField(widget=forms.PasswordInput, label=("New Password"))
    new_password2 = forms.CharField(label=("Confirm Password"),
                               widget=forms.PasswordInput(attrs={"onChange":'PasswordMatch()',
                                                                 "oninvalid":'PasswordMatch()'}),
                               )
    def clean_old_password(self):
        password =  self.cleaned_data['old_password']
        if password is None:
            raise forms.ValidationError("No pass")
        return password

    def clean_new_password2(self):
        password = self.cleaned_data['new_password1']
        rep_pass = self.cleaned_data['new_password2']
        if password != rep_pass:
                raise forms.ValidationError("Passwords do NOT match")

    def __init__(self, *args, **kwargs):
        super(PasswordForm, self).__init__(*args, **kwargs)

        for key in self.fields:
            self.fields[key].required = True

class NewPasswordForm(forms.Form):
    reset_key = forms.CharField(max_length=64,required=True)
    new_password = forms.CharField(widget=forms.PasswordInput, label=("New Password"),required=True)

    def __init__(self, *args, **kwargs):
        super(NewPasswordForm, self).__init__(*args, **kwargs)

        for key in self.fields:
            self.fields[key].required = True

class UserLoginForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('username', 'password', )
