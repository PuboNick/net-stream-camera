const moment = require("moment");

const path = require("path");
const fs = require("fs");
const { loop } = require("pubo-utils");

const { createRTPClient } = require("./rtp-client");
const { videos } = require("./config");

// local 当前主机ip，remote 远程服务器ip
const options = {
  server: "ws://192.168.2.167:8081/rtp",
  local: "192.168.2.150",
  remote: "192.168.2.167",
};

const now = () => moment().add("minutes", 1).format("YYYYMMDD");

const createFolder = async () => {
  const folder = path.resolve(`cache/recorder`);
  for (const item of videos) {
    fs.mkdirSync(`${folder}/${item.id}/${now()}`, { recursive: true });
  }
};

createFolder();

loop(async () => {
  createFolder();
}, 1000);

videos.forEach((video) => {
  // 按每小时
  const output = `-f segment -segment_time 60 -reset_timestamps 1 -strftime 1 ./cache/recorder/${video.id}/%Y%m%d/%H%M%S.mp4`;
  createRTPClient({ ...video, ...options, output });
});

process.on("uncaughtException", (err) => console.log(err));
process.on("unhandledRejection", (err) => console.log(err));
