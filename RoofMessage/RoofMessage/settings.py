"""
Django settings for RoofMessage project.

Generated by 'django-admin startproject' using Django 1.9.2.

For more information on this file, see
https://docs.djangoproject.com/en/1.9/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.9/ref/settings/
"""

# the forwarding for @login_required
LOGIN_URL = '/'

# CONSTANTS FOR EMAIL
EMAIL_USE_TLS = True
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = "rooftext@gmail.com"
EMAIL_HOST_PASSWORD = "AMn5b1jadf80h5basdf"
DOMAIN_HOST = "https://rooftext.com"  # "http://yourdomain.com/"

TIME_ZONE = 'US/Eastern'

LANGUAGE_CODE = 'en-us'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

if not DEBUG:
    import os

    # Build paths inside the project like this: os.path.join(BASE_DIR, ...)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


    # Quick-start development settings - unsuitable for production
    # See https://docs.djangoproject.com/en/1.9/howto/deployment/checklist/

    # SECURITY WARNING: keep the secret key used in production secret!
    SECRET_KEY = '835setwc%vdpi552lq*%^21mfpj+&2xbnwxwu_eklg4xumvd_i'

    ALLOWED_HOSTS = ['rooftext.com','129.21.149.180','0.0.0.0',
		'127.0.0.1','127.0.0.0','129.21.149.113']

    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_SSL_REDIRECT = True
    USE_X_FORWARDED_HOST = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    SESSION_EXPIRE_AT_BROWSER_CLOSE = True

    ADMINS = [('Jesse','jesse.saranwrap@gmail.com'),('Tommy','accounts2952@gmail.com')]

    #Channels
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "asgi_redis.RedisChannelLayer",
            "ROUTING": "MessageApp.routing.channel_routing",
        "Config": {
            "hosts": [os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379')],
        }
        },
    }

    # Application definition

    INSTALLED_APPS = [
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'MessageApp',
        'channels',
    ]

    MIDDLEWARE_CLASSES = [
        'django.middleware.security.SecurityMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ]

    ROOT_URLCONF = 'RoofMessage.urls'

    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [#"static/email/",
                     #"RoofMessage/static/email/",
                    # "/home/jesse/rooftext/messagerepo/static_files/",
                    #  "/home/jesse/rooftext/messagerepo/static_files/email/"
                    os.path.join(os.path.dirname(BASE_DIR), "RoofMessage/static_not_mapped/"),],
            'APP_DIRS': True,
            'OPTIONS': {
                'context_processors': [
                    'django.template.context_processors.debug',
                    'django.template.context_processors.request',
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
                ],
            },
        },
    ]

    WSGI_APPLICATION = 'RoofMessage.wsgi.application'


    # Database
    # https://docs.djangoproject.com/en/1.9/ref/settings/#databases

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }


    # Password validation
    # https://docs.djangoproject.com/en/1.9/ref/settings/#auth-password-validators

    AUTH_PASSWORD_VALIDATORS = [
        {
            'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
        },
    ]


    # Internationalization
    # https://docs.djangoproject.com/en/1.9/topics/i18n/

    USE_I18N = True

    USE_L10N = True

    USE_TZ = True


    # Static files (CSS, JavaScript, Images)
    # https://docs.djangoproject.com/en/1.9/howto/static-files/

    STATIC_URL = '/static/'

    STATIC_NOT_MAPPED = os.path.join(os.path.dirname(BASE_DIR),"RoofMessage/static_not_mapped/")#"/var/www/example.com/static/"

    #static files .css, .js, etc.
    STATIC_ROOT = os.path.join(os.path.dirname(BASE_DIR),"static_files/")#"/var/www/example.com/static/"

    #user files
    MEDIA_ROOT = os.path.join(os.path.dirname(BASE_DIR),"media_files/")#"/var/www/example.com/static/"

    STATICFILES_DIRS = [
        os.path.join(BASE_DIR, "static"),
    #    '/var/www/static/',
    ]

    #logging
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'filters': {
            'require_debug_false': {
                '()': 'django.utils.log.RequireDebugFalse'
            }
        },
        'formatters': {
            'standard': {
                'format' : "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s",
                'datefmt' : "%d/%b/%Y %H:%M:%S"
            },
        },
        'handlers': {
            'mail_admins': {
                'level': 'INFO',
                'filters': ['require_debug_false'],
                'class': 'django.utils.log.AdminEmailHandler'
            },
        'logfile': {
                'level':'DEBUG',
                'class':'logging.handlers.RotatingFileHandler',
                'filename': os.path.join(os.path.dirname(BASE_DIR),"logfile"),
                'maxBytes': 1024*1024*500, #500 Megabytes
                'backupCount': 5,
                'formatter': 'standard',
            },
            # 'applogfile': {
            #     'level': 'DEBUG',
            #     'class': 'logging.handlers.RotatingFileHandler',
            #     'filename': os.path.join(BASE_DIR, 'APPNAME.log'),
            #     'maxBytes': 1024 * 1024 * 15,  # 15MB
            #     'backupCount': 10,
            # },
        },
        'loggers': {
            'django.request': {
                'handlers': ['mail_admins'],
                'level': 'INFO',
                'propagate': True,
            },
            'RoofMessage': {
                'handlers': ['logfile'],
                'level': 'DEBUG',
            },
            # 'MessageApp': {
            #     'handlers': ['applogfile',],
            #     'level': 'DEBUG',
            # }}
        }
    }
    # LOGGING = {
    #     'version': 1,
    #     'disable_existing_loggers': False,
    #     'filters': {
    #         'require_debug_false': {
    #             '()': 'django.utils.log.RequireDebugFalse'
    #         }
    #     },
    #
    #     'handlers': {
    #         'mail_admins': {
    #             'level': 'ERROR',
    #             'filters': ['require_debug_false'],
    #             'class': 'django.utils.log.AdminEmailHandler'
    #         },
    #      'console':{
    #             'level': 'INFO',
    #             'class': 'logging.StreamHandler',
    #         },
    #     },
    #     'loggers': {
    #         'django.request': {
    #             'handlers': ['mail_admins'],
    #             'level': 'ERROR',
    #             'propagate': True,
    #         },
    #     }
    # }

else:
    import os

    # Build paths inside the project like this: os.path.join(BASE_DIR, ...)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


    # Quick-start development settings - unsuitable for production
    # See https://docs.djangoproject.com/en/1.9/howto/deployment/checklist/

    # SECURITY WARNING: keep the secret key used in production secret!
    SECRET_KEY = '835setwc%vdpi552lq*%^21mfpj+&2xbnwxwu_eklg4xumvd_i'

    ALLOWED_HOSTS = ["*"]

    # Application definition

    INSTALLED_APPS = [
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'MessageApp',
        'channels'
    ]

    MIDDLEWARE_CLASSES = [
        'django.middleware.security.SecurityMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ]

    ROOT_URLCONF = 'RoofMessage.urls'

    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "asgiref.inmemory.ChannelLayer",
            "ROUTING": "MessageApp.routing.channel_routing",
        },
    }

    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [#"static/email/",
                     #"RoofMessage/static/email/",
                    # "/home/jesse/rooftext/messagerepo/static_files/",
                    #  "/home/jesse/rooftext/messagerepo/static_files/email/"
                    os.path.join(os.path.dirname(BASE_DIR), "RoofMessage/static_not_mapped/"),],
            'APP_DIRS': True,
            'OPTIONS': {
                'context_processors': [
                    'django.template.context_processors.debug',
                    'django.template.context_processors.request',
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
                ],
            },
        },
    ]

    WSGI_APPLICATION = 'RoofMessage.wsgi.application'


    # Database
    # https://docs.djangoproject.com/en/1.9/ref/settings/#databases

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }


    # Password validation
    # https://docs.djangoproject.com/en/1.9/ref/settings/#auth-password-validators

    AUTH_PASSWORD_VALIDATORS = [
        {
            'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
        },
    ]


    # Internationalization
    # https://docs.djangoproject.com/en/1.9/topics/i18n/

    USE_I18N = True

    USE_L10N = True

    USE_TZ = True


    # Static files (CSS, JavaScript, Images)
    # https://docs.djangoproject.com/en/1.9/howto/static-files/

    STATIC_URL = '/static/'

    STATIC_NOT_MAPPED = os.path.join(os.path.dirname(BASE_DIR),"RoofMessage/static_not_mapped/")#"/var/www/example.com/static/"

    #static files .css, .js, etc.
    STATIC_ROOT = os.path.join(os.path.dirname(BASE_DIR),"static_files/")#"/var/www/example.com/static/"

    #user files
    MEDIA_ROOT = os.path.join(os.path.dirname(BASE_DIR),"media_files")#"/var/www/example.com/static/"

    STATICFILES_DIRS = [
        os.path.join(BASE_DIR, "static"),
    #    '/var/www/static/',
    ]
