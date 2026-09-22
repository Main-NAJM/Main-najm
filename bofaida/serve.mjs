// خادم ثابت بسيط لتشغيل موقع «BOFAIDA ADS» محلياً — بدون أي حزم خارجية.
//
//   node bofaida/serve.mjs            # المنفذ الافتراضي 8080
//   node bofaida/serve.mjs 3000       # منفذ مخصّص
//
// يطبع رابطين: رابط الجهاز نفسه، ورابط الشبكة المحلية لفتح الموقع من الهاتف
// أو من أي جهاز متصل بنفس الواي‑فاي.

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const DEFAULT_PORT = 8080;
const MAX_PORT_TRIES = 20;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

// يمنع الخروج من مجلد الموقع عبر مسارات مثل ../../etc/passwd
function resolveSafe(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const clean = normalize(decoded).replace(/^([/\\]|\.\.[/\\])+/, '');
  const full = resolve(ROOT, clean);
  return full === ROOT || full.startsWith(ROOT + sep) ? full : null;
}

async function resolveFile(urlPath) {
  const candidate = resolveSafe(urlPath);
  if (!candidate) return null;

  try {
    const info = await stat(candidate);
    if (info.isDirectory()) {
      const indexFile = join(candidate, 'index.html');
      const indexInfo = await stat(indexFile);
      return indexInfo.isFile() ? indexFile : null;
    }
    return info.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method Not Allowed');
    return;
  }

  // أي مسار غير موجود يعود إلى الصفحة الرئيسية (موقع من صفحة واحدة).
  const file = (await resolveFile(req.url || '/')) ?? (await resolveFile('/index.html'));

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('الملف غير موجود');
    return;
  }

  res.writeHead(200, {
    'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  createReadStream(file)
    .on('error', () => res.end())
    .pipe(res);
});

function localAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => net.address);
}

function listen(port, triesLeft) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && triesLeft > 0) {
      console.log(`المنفذ ${port} مشغول — تجربة ${port + 1}…`);
      listen(port + 1, triesLeft - 1);
      return;
    }
    console.error(`تعذّر تشغيل الخادم: ${err.message}`);
    process.exit(1);
  });

  server.listen(port, '0.0.0.0', () => {
    const lines = [
      '',
      '  موقع مؤسسة الباشة للمعادن يعمل الآن محلياً',
      '',
      `  على هذا الجهاز:   http://localhost:${port}`,
      ...localAddresses().map((ip) => `  على الشبكة:        http://${ip}:${port}`),
      '',
      '  افتح رابط الشبكة من هاتفك وهو متصل بنفس الواي‑فاي.',
      '  للإيقاف: Ctrl + C',
      '',
    ];
    console.log(lines.join('\n'));
  });
}

const requested = Number.parseInt(process.argv[2] ?? process.env.PORT ?? '', 10);
listen(Number.isInteger(requested) && requested > 0 ? requested : DEFAULT_PORT, MAX_PORT_TRIES);
