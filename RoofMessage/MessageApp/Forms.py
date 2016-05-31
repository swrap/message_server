from django import forms
from django.contrib.auth.models import User

class UserForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    rep_pass = forms.CharField(label=("Repeat Password"),
                               widget=forms.PasswordInput(attrs={"onChange":'PasswordMatch()',
                                                                 "oninvalid":'PasswordMatch()'}),
                               )
    # checks to see if the username is in existance already
    def clean_username(self):
        username = self.cleaned_data['username']
        if User.objects.exclude(pk=self.instance.pk).filter(username=username).exists():
            raise forms.ValidationError('"%s" is already in use.' % username)
        return username

    def clean_rep_pass(self):
        password = self.cleaned_data['password']
        rep_pass = self.cleaned_data['rep_pass']
        if (rep_pass and rep_pass) and (password != rep_pass):
                raise forms.ValidationError("Passwords do NOT match")

    def __init__(self, *args, **kwargs):
        super(UserForm, self).__init__(*args, **kwargs)

        for key in self.fields:
            self.fields[key].required = True

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password', )
