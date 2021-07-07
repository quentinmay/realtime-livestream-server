# 🎬 Realtime Livestream Server
Put together specifically to be an easily and quickly deployed video live streaming server/website meant for sharing content with friends.

🔒 All traffic uses SSL encryption to keep data safe from hackers or peepers.

## Streaming latency:
* Low Latency Mode: **110ms**
* High Quality Mode: **500ms**

![smaller](https://user-images.githubusercontent.com/73214439/124221527-cf311180-dab4-11eb-85a1-97a7b4de3270.gif)

These speeds were achieved on WAN streaming from my PC to my VPS, then to all clients watching the stream.
## ⚡[Quick Setup Guide](https://github.com/quentinmay/realtime-livestream-server/blob/main/setup.md)

## Credit:
The websocket relay server as well as the low-latency mode webpage were based on the work of [jsmpeg](https://github.com/phoboslab/jsmpeg).

The  quality mode webpage uses [mpegts.js](https://github.com/xqq/mpegts.js)
