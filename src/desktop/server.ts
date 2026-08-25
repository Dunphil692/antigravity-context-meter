import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { LogWatcher } from '../core/log-watcher';
import { ContextUsageSnapshot } from '../../types/context';

const PORT = 8765;
let clients: http.ServerResponse[] = [];
let latestSnapshot: ContextUsageSnapshot | null = null;

// 初始化实时日志监听器
const logWatcher = new LogWatcher();

logWatcher.start((snapshot) => {
  latestSnapshot = snapshot;
  const message = `data: ${JSON.stringify({ type: 'UPDATE_SNAPSHOT', payload: snapshot })}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch {}
  }
});

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const pathname = parsedUrl.pathname;

  // 1. SSE 实时事件通道
  if (pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
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

  // 2. 会话切换 API: /api/select?id=xxx
  if (pathname === '/api/select') {
    const targetId = parsedUrl.searchParams.get('id');
    logWatcher.setSelectedConversation(targetId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, selectedId: targetId }));
    return;
  }

  // 3. 界面一键退出关闭 API: /api/quit
  if (pathname === '/api/quit') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'Quitting capsule...' }));
    setTimeout(() => {
      process.exit(0);
    }, 100);
    return;
  }

  // 3. 静态页面路由
  let filePath = '';
  if (pathname === '/capsule') {
    filePath = path.join(__dirname, '..', 'src', 'desktop', 'capsule-ui', 'capsule.html');
  } else {
    const reqPath = pathname === '/' ? 'panel.html' : pathname.replace(/^\//, '');
    filePath = path.join(__dirname, '..', 'src', 'ui', reqPath);
  }

  // 兼容直接从 dist 运行与源码目录
  if (!fs.existsSync(filePath)) {
    if (pathname === '/capsule') {
      filePath = path.join(__dirname, 'capsule.html');
    } else {
      filePath = path.join(__dirname, pathname === '/' ? 'panel.html' : pathname.replace(/^\//, ''));
    }
  }

  const ext = path.extname(filePath);
  let contentType = 'text/html';
  if (ext === '.css') contentType = 'text/css';
  else if (ext === '.js') contentType = 'text/javascript';
  else if (ext === '.svg') contentType = 'image/svg+xml';
  else if (ext === '.json') contentType = 'application/json';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`====================================================`);
  console.log(`🚀 Antigravity Context Meter 数据流服务已就绪！`);
  console.log(`👉 悬浮胶囊界面: http://127.0.0.1:${PORT}/capsule`);
  console.log(`👉 完整面板界面: http://127.0.0.1:${PORT}`);
  console.log(`====================================================`);
});
