const { writeFileSync, mkdirSync, readFileSync } = require('fs');
const path = require('path');
const { WatchDog } = require('pubo-utils');
const { SIGKILL } = require('pubo-node');

const WebSocket = require('ws');

mkdirSync(path.resolve(`cache/sdp`), { recursive: true });
const sdpFmt = readFileSync('./sdp-template.sdp').toString();

function RTPClient({ input, output, server, local, port, remote }) {
  this.input = input;
  this.output = output;
  this.server = server;
  this.ip = local;
  this.port = port;
  this.host = remote;

  this.sdp = path.resolve(`cache/sdp/${port}.sdp`);
  this.writeSDP();

  this.dog = new WatchDog({
    limit: 300,
    onTimeout: () => {
      this.closeOld();
      this.connect();
    },
  });
  this.connect();
}

RTPClient.prototype.getCmd = function () {
  return `ffmpeg -protocol_whitelist rtp,udp,file -max_delay 100000\
  -i ${this.sdp} \
  -c:v libx264 -threads 1 -map 0:v:0  -cpu-used 1 \
  ${this.output}`;
};

RTPClient.prototype.connect = function () {
  this.closeOld();

  this.dog.init();
  this.ws = new WebSocket(this.server);
  this.ws.on('open', () => {
    const message = this.encode({
      type: 'createRtpConsumer',
      payload: { url: this.input, ip: this.ip, port: this.port, host: this.host || '127.0.0.1' },
    });
    this.ws.send(message);
  });

  this.ws.on('message', () => {
    const cmd = this.getCmd()
      .split(' ')
      .filter((item) => item.trim().length > 0);

    console.log(cmd.join(' '));
    this.s = require('child_process').spawn(cmd[0], cmd.slice(1));
    this.s.stderr.on('data', (msg) => this.onMessage(msg));
  });

  this.ws.on('error', (err) => {
    console.log(new Date().valueOf());
    console.log(err);
    this.ws.close();
    setTimeout(() => this.connect(), 1000);
  });
};

RTPClient.prototype.onMessage = function (msg) {
  // console.log(msg.toString());
  this.dog.feed();
};

RTPClient.prototype.writeSDP = function () {
  const text = sdpFmt.replace(/{port}/g, this.port);

  writeFileSync(this.sdp, text);
};

RTPClient.prototype.destroy = function () {
  this.dog.stop();
  if (this.s) {
    SIGKILL(this.s.pid);
    this.s = null;
  }
};

RTPClient.prototype.closeOld = function () {
  if (this.s) {
    console.log(`LOG Video-Server: ${this.input} try to reconnect;`);
    SIGKILL(this.s.pid);
    this.s = null;
  }
};

RTPClient.prototype.encode = function (data) {
  return Buffer.from(JSON.stringify(data));
};

exports.RTPClient = RTPClient;

exports.createRTPClient = function (...args) {
  return new RTPClient(...args);
};
