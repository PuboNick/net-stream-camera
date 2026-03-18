const express = require('express');
const path = require('path');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const proxyConfig = {
  '/webrtc': {
    target: 'ws://localhost:8080',
    changeOrigin: true,
    ws: true,
  },
  '/api/wav': {
    target: 'http://localhost:8080/wav',
    changeOrigin: true,
    logLevel: 'silent',
  },
};

const wsProxyDic = {};

for (const key of Object.keys(proxyConfig)) {
  const proxy = createProxyMiddleware(proxyConfig[key]);
  if (proxyConfig[key].ws) {
    wsProxyDic[key] = proxy;
  }
  app.use(key, proxy);
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

// SPA 回退
app.all('*', async (_, res) => {
  res.render('index.ejs', { title: '' });
});

// 导出 app 和 wsProxy，供 bin/www 使用
module.exports = { app, wsProxyDic };
