from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.conf import settings
from .models import UserSession

@receiver(user_logged_in)
def sig_user_logged_in(sender, user, request, **kwargs):
    UserSession.objects.get_or_create(
        user=user,
        session_id=request.session.session_key
    )
user_logged_in.connect(sig_user_logged_in)

# @receiver(user_logged_out)
# def sig_user_logged_out(sender, user, request, **kwargs):
