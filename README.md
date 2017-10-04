# message_server

This is a django message-proxy-server for handling the connection between the message_app and the frontend. 
It uses [Django Channels](https://channels.readthedocs.io/en/stable/) as a way to forward the websockets information
between the clients phone and its connection.

This server allows [message_app](https://github.com/swrap/message_app) to connect to it. The app updates the front-end ui for real time text-messages that an android client has.

The app was not built to support SSL. Put behind a reverse proxy.

Please read up on the how to run a django app and installing Django Channels.
