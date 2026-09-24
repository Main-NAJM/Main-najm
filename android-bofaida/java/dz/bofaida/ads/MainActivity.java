package dz.bofaida.ads;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * يعرض موقع BOFAIDA ADS من داخل الملف.
 *
 * لِمَ أصل ‎https://bofaida.local‎ بدل ‎file:///android_asset‎؟ لأن المتصفّح يعامل
 * ملفّات file كأصول مجهولة، فيصير حفظ البيانات (localStorage) غير مضمون. وبتقديم
 * الأصول على أصل https داخلي يصير التخزين والمسارات كما هي في المتصفّح تماماً،
 * ولا شيء من ذلك يخرج إلى الشبكة: كل طلب على هذا المضيف يُقرأ من assets.
 */
public class MainActivity extends Activity {

  private static final String HOST = "bofaida.local";
  private static final String ORIGIN = "https://" + HOST;
  private static final String ASSET_ROOT = "www";

  private WebView web;

  @Override
  protected void onCreate(Bundle saved) {
    super.onCreate(saved);

    web = new WebView(this);
    web.setLayoutParams(
        new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    setContentView(web);

    WebSettings settings = web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setLoadWithOverviewMode(true);
    settings.setUseWideViewPort(true);
    settings.setSupportZoom(false);
    settings.setBuiltInZoomControls(false);
    settings.setTextZoom(100);

    web.setWebViewClient(new LocalClient());
    applyStatusBar();

    if (saved == null) {
      web.loadUrl(ORIGIN + "/index.html");
    } else {
      web.restoreState(saved);
    }
  }

  @Override
  protected void onSaveInstanceState(Bundle out) {
    super.onSaveInstanceState(out);
    web.saveState(out);
  }

  @Override
  public void onConfigurationChanged(Configuration config) {
    super.onConfigurationChanged(config);
    // تبديل وضع الجهاز الليلي وهو مفتوح: تُحدَّث سمة الصفحة وشريط الحالة.
    applyTheme();
    applyStatusBar();
  }

  @Override
  public void onBackPressed() {
    if (web.canGoBack()) {
      web.goBack();
    } else {
      super.onBackPressed();
    }
  }

  /** هل الجهاز في الوضع الليلي الآن؟ */
  private boolean isNight() {
    int mode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
    return mode == Configuration.UI_MODE_NIGHT_YES;
  }

  /**
   * WebView لا يمرّر وضع الجهاز الليلي إلى prefers-color-scheme بلا مكتبات إضافية،
   * فتُضبط سمة الصفحة صراحةً — والتطبيق يدعم data-theme أصلاً.
   */
  private void applyTheme() {
    String theme = isNight() ? "dark" : "light";
    web.evaluateJavascript(
        "document.documentElement.setAttribute('data-theme','" + theme + "')", null);
  }

  private void applyStatusBar() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return;
    // نفس كحليّ رأس التطبيق، فيبدو الشريط امتداداً له.
    getWindow().setStatusBarColor(isNight() ? 0xFF0E0C0B : 0xFF14100D);
  }

  private final class LocalClient extends WebViewClient {

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
      Uri url = request.getUrl();
      if (!HOST.equals(url.getHost())) return null; // طلب خارجي: يمرّ كما هو
      return serve(url.getPath());
    }

    // الصيغة النصّية لا صيغة WebResourceRequest: تلك جاءت في API 24، وهذه تعمل
    // على كل الإصدارات ويستدعيها WebView ما دامت هي المتجاوَزة.
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String rawUrl) {
      Uri url = Uri.parse(rawUrl);
      if (HOST.equals(url.getHost())) return false; // تنقّل داخل التطبيق
      // واتساب واتصال وأي رابط خارجي: يفتحه تطبيقه لا نافذتنا.
      try {
        Intent intent = new Intent(Intent.ACTION_VIEW, url);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
      } catch (Exception ignored) {
        // لا تطبيق يفتح هذا الرابط — يُتجاهل بهدوء.
      }
      return true;
    }

    @Override
    public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
      applyTheme();
    }

    @Override
    public void onPageFinished(WebView view, String url) {
      applyTheme();
    }
  }

  /** يقرأ الملفّ من assets/www. المسار الذي لا ملفّ له يُعاد إليه index.html. */
  private WebResourceResponse serve(String path) {
    if (path == null || path.isEmpty() || path.equals("/")) path = "/index.html";
    InputStream stream = open(ASSET_ROOT + path);

    if (stream == null) {
      // مسار داخل التطبيق (‎/orders‎ مثلاً) لا ملفّ له: تُعاد الصفحة ليكمل الموجّه.
      // أما ملفّ بامتداد فمفقود فعلاً، فيُعاد 404 لا صفحةُ HTML في مكان سكربت.
      if (hasExtension(path)) return notFound();
      stream = open(ASSET_ROOT + "/index.html");
      if (stream == null) return notFound();
      path = "/index.html";
    }

    return new WebResourceResponse(mimeOf(path), "utf-8", 200, "OK", noCache(), stream);
  }

  private InputStream open(String asset) {
    try {
      return getAssets().open(asset);
    } catch (IOException e) {
      return null;
    }
  }

  private WebResourceResponse notFound() {
    return new WebResourceResponse(
        "text/plain", "utf-8", 404, "Not Found", noCache(), null);
  }

  private static Map<String, String> noCache() {
    Map<String, String> headers = new HashMap<String, String>();
    // الأصول داخل الملف ولا تتغيّر إلا بتحديث التطبيق، فلا داعي لذاكرة وسيطة.
    headers.put("Cache-Control", "no-store");
    return headers;
  }

  private static boolean hasExtension(String path) {
    int slash = path.lastIndexOf('/');
    int dot = path.lastIndexOf('.');
    return dot > slash + 1;
  }

  private static String mimeOf(String path) {
    String lower = path.toLowerCase();
    if (lower.endsWith(".html")) return "text/html";
    if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "text/javascript";
    if (lower.endsWith(".css")) return "text/css";
    if (lower.endsWith(".json")) return "application/json";
    if (lower.endsWith(".webmanifest")) return "application/manifest+json";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    if (lower.endsWith(".ico")) return "image/x-icon";
    if (lower.endsWith(".woff2")) return "font/woff2";
    if (lower.endsWith(".woff")) return "font/woff";
    if (lower.endsWith(".ttf")) return "font/ttf";
    return "application/octet-stream";
  }
}
