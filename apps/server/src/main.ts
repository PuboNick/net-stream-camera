import express from 'express';
import multer from 'multer';
import * as fs from 'fs';

import { cors } from './middleware/token.middleware';
import { useWebsocket } from './middleware/ws.middleware';
import { exec } from 'child_process';
import { ProducerState } from './meidasoup/state';
import { YKAudioSpeaker } from './audio-speaker';

const port = process.argv[2] ?? 8080;

async function bootstrap() {
  const storage = multer.memoryStorage();
  const upload = multer({ storage });
  const app = express();
  app.all('*', cors);
  useWebsocket(app);

  app.post('/wav/play', upload.single('file'), async (req: any, res) => {
    YKAudioSpeaker.instance.play(req.file.buffer);
    fs.writeFileSync('test.wav', req.file.buffer);
    res.send('success');
  });

  app.listen(port, () => console.log(`webrtc start at ${port}`));
}
bootstrap();

process.on('uncaughtException', (err) => console.log(err));
process.on('unhandledRejection', (err) => console.log(err));

process.on('SIGINT', async () => {
  const list = [];
  const producers = ProducerState.getState();
  for (const key of Object.keys(producers)) {
    list.push(producers[key].kill());
  }

  await Promise.all(list);
  exec('killall -9 ffmpeg');
  process.exit();
});
