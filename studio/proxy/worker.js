/**
 * وسيط fal.ai — عامل Cloudflare من ملفّ واحد.
 *
 * يحلّ مشكلتين:
 *
 *   ١) CORS. المتصفّح يمنع الصفحة من مناداة ‎queue.fal.run‎ مباشرة ما لم
 *      يأذن الخادم. هذا الوسيط يأذن لصفحتك وحدها.
 *   ٢) المفتاح. مع الوسيط يبقى مفتاح fal في خزنة Cloudflare ولا يمرّ في
 *      المتصفّح أصلاً — وهذا وحده يستحقّ الدقائق الخمس.
 *
 * التنصيب:
 *
 *   1. افتح dash.cloudflare.com ← Workers & Pages ← Create ← Worker
 *   2. الصق هذا الملفّ كلّه مكان ما فيه، ثم Deploy
 *   3. Settings ← Variables ← Add variable:
 *        FAL_KEY     = مفتاحك من fal.ai        (اضغط Encrypt)
 *        ALLOW_ORIGIN = https://main-najm.github.io
 *   4. انسخ رابط العامل (‎https://xxx.workers.dev‎) وضعه في
 *      «الإعدادات ← التوليد ← وسيط» داخل الاستوديو، وامسح المفتاح من هناك.
 *
 * بعدها تصير طلبات الاستوديو: المتصفّح ← عاملك ← fal. والمفتاح لا يغادر
 * Cloudflare.
 */

const FAL = 'https://queue.fal.run';

export default {
  async fetch(request, env) {
    const allow = env.ALLOW_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };

    // طلب الاستئذان الذي يرسله المتصفّح قبل الطلب الحقيقي.
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (!env.FAL_KEY) {
      return new Response(JSON.stringify({ detail: 'FAL_KEY غير مضبوط في متغيّرات العامل.' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // المنشأ يُفحص هنا لا في المتصفّح: ترويسة CORS تمنع القراءة، لكنها لا
    // تمنع الطلب من الوصول — ولو وصل لصُرف من رصيد صاحب المفتاح.
    const origin = request.headers.get('Origin');
    if (allow !== '*' && origin && origin !== allow) {
      return new Response(JSON.stringify({ detail: 'منشأ غير مسموح.' }), {
        status: 403, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, '');
    if (!path) {
      return new Response('وسيط fal يعمل. ضع رابطه في إعدادات الاستوديو.', {
        status: 200, headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const upstream = await fetch(`${FAL}/${path}${url.search}`, {
      method: request.method,
      headers: {
        Authorization: `Key ${env.FAL_KEY}`,
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
      },
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { ...cors, 'Content-Type': upstream.headers.get('Content-Type') || 'application/json' },
    });
  },
};
