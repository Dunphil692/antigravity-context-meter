const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 引用编译后的核心监听模块
const { LogWatcher } = require('../../out/test-runner.js');

const PORT = 8765;
let clients = [];
let latestSnapshot = null;

// 创建轻量 HTTP 服务 (Stage 4)
const server = http.createServer((req, res) => {
  if (req.url === '/events') {
    // SSE (Server-Sent Events) 实时推送通道
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    clients.push(res);

    if (latestSnapshot) {
      res.write(`data: ${JSON.stringify({ type: 'UPDATE_SNAPSHOT', payload: latestSnapshot })}\n\n`);
    }

    req.on('close', () => {
      clients = clients.filter((c) => c !== res);
    });
    return;
  }

  // 静态页面路由
  let filePath = path.join(__dirname, '..', 'ui', req.url === '/' ? 'panel.html' : req.url);
  const ext = path.extname(filePath);
  let contentType = 'text/html';

  if (ext === '.css') contentType = 'text/css';
  else if (ext === '.js') contentType = 'text/javascript';
  else if (ext === '.svg') contentType = 'image/svg+xml';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      if (ext === '.js' && req.url === '/panel.js') {
        // 注入 SSE 监听代码
        const sseBridge = `
          const evtSource = new EventSource('/events');
          evtSource.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'UPDATE_SNAPSHOT') {
              renderSnapshot(data.payload);
            }
          };
        `;
        res.end(data + '\n' + sseBridge);
      } else {
        res.end(data);
      }
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`====================================================`);
  console.log(`🚀 Antigravity Context Meter 桌面悬浮服务已启动！`);
  console.log(`👉 本地监控面板地址: http://127.0.0.1:${PORT}`);
  console.log(`====================================================`);
});
