package cr.go.sarapiqui.fiscalizacion.l26;

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONObject;

import com.google.android.gms.tasks.Tasks;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLConnection;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class MainActivity extends Activity {
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String APP_URL = "https://appassets.androidplatform.net/assets/index.html";
    private static final int REQUEST_FILE = 4101;
    private static final int REQUEST_READER = 4102;
    private static final int REQUEST_LOCATION = 4103;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private GeolocationPermissions.Callback pendingGeoCallback;
    private String pendingGeoOrigin;
    private TextRecognizer offlineTextRecognizer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);
        offlineTextRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        configureTrustedAppWebView();
        webView.loadUrl(APP_URL);
    }

    private void configureTrustedAppWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);

        // This bridge exists only in the trusted bundled L-26 WebView.
        webView.addJavascriptInterface(new TrustedL26Bridge(), "L26Android");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (APP_HOST.equalsIgnoreCase(uri.getHost()) && uri.getPath() != null && uri.getPath().startsWith("/assets/")) {
                    return loadAsset(uri.getPath().substring("/assets/".length()));
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (APP_HOST.equalsIgnoreCase(uri.getHost())) return false;
                String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
                if (scheme.equals("http") || scheme.equals("https")) {
                    openReader(uri.toString(), "", "");
                    return true;
                }
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), REQUEST_FILE);
                    return true;
                } catch (Exception error) {
                    fileCallback = null;
                    Toast.makeText(MainActivity.this, "No se pudo abrir el selector de archivos.", Toast.LENGTH_LONG).show();
                    return false;
                }
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                        checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    callback.invoke(origin, true, false);
                    return;
                }
                pendingGeoCallback = callback;
                pendingGeoOrigin = origin;
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQUEST_LOCATION);
            }
        });
    }

    private WebResourceResponse loadAsset(String relative) {
        try {
            String safe = relative == null || relative.isEmpty() ? "index.html" : relative;
            if (safe.contains("..")) return null;
            InputStream stream = getAssets().open("www/" + safe);
            return new WebResourceResponse(mimeType(safe), "UTF-8", stream);
        } catch (Exception error) {
            return null;
        }
    }

    private String mimeType(String name) {
        String lower = name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".mjs") || lower.endsWith(".js")) return "text/javascript";
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".webmanifest")) return "application/manifest+json";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".pdf")) return "application/pdf";
        String guessed = URLConnection.guessContentTypeFromName(name);
        return guessed == null ? "application/octet-stream" : guessed;
    }

    private void openReader(String url, String caseId, String tramite) {
        if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) {
            Toast.makeText(this, "El enlace no es válido.", Toast.LENGTH_LONG).show();
            return;
        }
        Intent intent = new Intent(this, ReaderActivity.class);
        intent.putExtra("url", url);
        intent.putExtra("caseId", caseId == null ? "" : caseId);
        intent.putExtra("tramite", tramite == null ? "" : tramite);
        startActivityForResult(intent, REQUEST_READER);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_FILE) {
            if (fileCallback != null) {
                fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                fileCallback = null;
            }
            return;
        }
        if (requestCode == REQUEST_READER && resultCode == RESULT_OK && data != null) {
            try {
                JSONObject payload = new JSONObject();
                payload.put("caseId", data.getStringExtra("caseId"));
                payload.put("tramite", data.getStringExtra("tramite"));
                payload.put("text", data.getStringExtra("text"));
                payload.put("title", data.getStringExtra("title"));
                payload.put("url", data.getStringExtra("url"));
                String script = "window.l26AndroidReaderData&&window.l26AndroidReaderData(" + payload + ");";
                webView.evaluateJavascript(script, null);
            } catch (Exception error) {
                Toast.makeText(this, "No se pudo devolver la lectura al expediente.", Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_LOCATION && pendingGeoCallback != null) {
            boolean granted = false;
            for (int result : grantResults) if (result == PackageManager.PERMISSION_GRANTED) granted = true;
            pendingGeoCallback.invoke(pendingGeoOrigin, granted, false);
            pendingGeoCallback = null;
            pendingGeoOrigin = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (offlineTextRecognizer != null) {
            offlineTextRecognizer.close();
            offlineTextRecognizer = null;
        }
        if (webView != null) {
            webView.removeJavascriptInterface("L26Android");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private final class TrustedL26Bridge {
        @JavascriptInterface
        public void openSource(String json) {
            try {
                JSONObject payload = new JSONObject(json == null ? "{}" : json);
                String url = payload.optString("url", "");
                String caseId = payload.optString("caseId", "");
                String tramite = payload.optString("tramite", "");
                runOnUiThread(() -> openReader(url, caseId, tramite));
            } catch (Exception error) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "No se pudo abrir el lector interno.", Toast.LENGTH_LONG).show());
            }
        }


        @JavascriptInterface
        public String ocrImage(String dataUrl) {
            Bitmap bitmap = null;
            try {
                int comma = dataUrl == null ? -1 : dataUrl.indexOf(',');
                if (comma < 0) return "";
                byte[] bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);
                bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                if (bitmap == null) return "";
                InputImage image = InputImage.fromBitmap(bitmap, 0);
                if (offlineTextRecognizer == null) {
                    offlineTextRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
                }
                Text result = Tasks.await(offlineTextRecognizer.process(image), 25, TimeUnit.SECONDS);
                return result == null ? "" : result.getText();
            } catch (Exception error) {
                return "";
            } finally {
                if (bitmap != null && !bitmap.isRecycled()) bitmap.recycle();
            }
        }

        @JavascriptInterface
        public void saveBlob(String dataUrl, String fileName, String mimeType) {
            try {
                int comma = dataUrl == null ? -1 : dataUrl.indexOf(',');
                if (comma < 0) throw new IllegalArgumentException("Datos de archivo inválidos");
                byte[] bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);
                String safeName = (fileName == null ? "archivo" : fileName).replaceAll("[\\\\/:*?\"<>|]", "_");
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType == null || mimeType.isBlank() ? "application/octet-stream" : mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/FiscalizacionL26");
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("No fue posible crear el archivo");
                try (OutputStream output = getContentResolver().openOutputStream(uri)) {
                    if (output == null) throw new IllegalStateException("No fue posible abrir el archivo");
                    output.write(bytes);
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(uri, values, null, null);
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Archivo guardado en Descargas/FiscalizacionL26", Toast.LENGTH_LONG).show());
            } catch (Exception error) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "No se pudo guardar el archivo: " + error.getMessage(), Toast.LENGTH_LONG).show());
            }
        }
    }
}
