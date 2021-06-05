# ⚡Quick Setup Guide
### 1. Clone the repository 

```bash
git clone https://github.com/quentinmay/realtime-livestream-server.git
cd realtime-livestream-server
npm install
mv config.json.example config.json
```
### 2. Adjust the configuration to meet your needs. You must input an SSL key and certificate.
```json
{
    "sslKey": "/path/to/sslkey",
    "sslCert": "/path/to/sslCert",
    "streamKey": "streamkey",
    "streamSecret": "streamsecret",
    "streamPort": "8081",
    "wsPort": "443"
}
```
* **sslKey/sslCert**: Given by your SSL provider. This is what allows the data to be encrypted.
* **streamKey**: Acts as a sort of "stream id". This will be given to your friends so they can access the stream.
* **streamSecret**: Basically the streams password. Should only be known to the person who is providing the live stream.

### 3. Start the server.
```bash
sudo node index.js
```
### 4. Stream to the server (OBS)
* Pick one:
  1. Low Latency Mode (110ms):
![image](https://user-images.githubusercontent.com/73214439/120874862-71fd7b00-c55d-11eb-90d6-28f6ef496d42.png)

  1. High Quality Mode (500ms):
![image](https://user-images.githubusercontent.com/73214439/120874912-b12bcc00-c55d-11eb-801c-b35f3626486f.png)
Then on OBS, click "Start Recording" to begin the stream.

### 5. Open your website, fill out the info, then click "Join Stream":
![image](https://user-images.githubusercontent.com/73214439/120875245-b853d980-c55f-11eb-9318-5d2199699ce4.png)

### 6. Pass the website link and streamKey to your friends and enjoy 👍
