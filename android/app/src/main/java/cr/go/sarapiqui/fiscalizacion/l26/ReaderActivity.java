package cr.go.sarapiqui.fiscalizacion.l26;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

public class ReaderActivity extends Activity {
    private WebView webView;
    private TextView status;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private String caseId = "";
    private String tramite = "";

    private static final String AREA_SCRIPT = """
        (function(){
          var old=document.getElementById('__l26_area_overlay');if(old)old.remove();
          delete document.documentElement.dataset.l26AreaResult;
          var overlay=document.createElement('div');overlay.id='__l26_area_overlay';
          overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;cursor:crosshair;touch-action:none;background:rgba(0,0,0,.02)';
          var box=document.createElement('div');box.style.cssText='position:fixed;border:3px solid #0d6efd;background:rgba(13,110,253,.16);pointer-events:none;display:none';overlay.appendChild(box);
          var sx=0,sy=0,drag=false;
          function setBox(x,y){var l=Math.min(sx,x),t=Math.min(sy,y),r=Math.max(sx,x),b=Math.max(sy,y);box.style.left=l+'px';box.style.top=t+'px';box.style.width=(r-l)+'px';box.style.height=(b-t)+'px';return{left:l,top:t,right:r,bottom:b};}
          overlay.addEventListener('pointerdown',function(e){drag=true;sx=e.clientX;sy=e.clientY;box.style.display='block';setBox(sx,sy);overlay.setPointerCapture(e.pointerId);e.preventDefault();});
          overlay.addEventListener('pointermove',function(e){if(drag){setBox(e.clientX,e.clientY);e.preventDefault();}});
          overlay.addEventListener('pointerup',function(e){
            if(!drag)return;drag=false;var sel=setBox(e.clientX,e.clientY);overlay.remove();
            var nodes=Array.prototype.slice.call(document.querySelectorAll('body *'));var parts=[];var seen={};
            nodes.forEach(function(el){
              if(!el||el.children.length>0)return;var text=(el.innerText||el.textContent||'').replace(/\\s+/g,' ').trim();if(!text||seen[text])return;
              var r=el.getBoundingClientRect();var hit=r.left<sel.right&&r.right>sel.left&&r.top<sel.bottom&&r.bottom>sel.top;
              if(hit){seen[text]=true;parts.push(text);}
            });
            document.documentElement.dataset.l26AreaResult=JSON.stringify({text:parts.join('\\n'),title:document.title||'',url:location.href});
            e.preventDefault();
          });
          document.documentElement.appendChild(overlay);return true;
        })();
        """;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        String url = getIntent().getStringExtra("url");
        caseId = value(getIntent().getStringExtra("caseId"));
        tramite = value(getIntent().getStringExtra("tramite"));
        buildUi();
        configureRemoteWebView();
        if (url != null && (url.startsWith("https://") || url.startsWith("http://"))) webView.loadUrl(url);
        else finish();
    }

    private String value(String value) { return value == null ? "" : value; }

    private Button button(String label, View.OnClickListener click) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setOnClickListener(click);
        return button;
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.WHITE);
        HorizontalScrollView scroll = new HorizontalScrollView(this);scroll.setFillViewport(true);
        LinearLayout toolbar = new LinearLayout(this);toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.addView(button("← Atrás", v -> { if(webView.canGoBack()) webView.goBack(); }));
        toolbar.addView(button("→ Adelante", v -> { if(webView.canGoForward()) webView.goForward(); }));
        toolbar.addView(button("⟳ Recargar", v -> webView.reload()));
        toolbar.addView(button("Leer página", v -> readPage()));
        toolbar.addView(button("Leer área", v -> readArea()));
        toolbar.addView(button("Cerrar", v -> finish()));
        scroll.addView(toolbar);
        status = new TextView(this);status.setPadding(18,10,18,10);status.setText("Navegue en la página y use Leer página o Leer área.");
        webView = new WebView(this);
        root.addView(scroll, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        root.addView(status, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        root.addView(webView, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        setContentView(root);
    }

    private void configureRemoteWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        webView.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request){
                Uri uri=request.getUrl();String scheme=uri.getScheme()==null?"":uri.getScheme();
                return !(scheme.equalsIgnoreCase("http")||scheme.equalsIgnoreCase("https"));
            }
        });
    }

    private void readPage() {
        status.setText("Leyendo la página visible…");
        String script="(function(){return JSON.stringify({text:(document.body&&document.body.innerText)||'',title:document.title||'',url:location.href});})()";
        webView.evaluateJavascript(script, value -> handleReaderJson(value, "No se encontró texto visible en la página."));
    }

    private void readArea() {
        status.setText("Arrastre con el dedo un rectángulo sobre el área que desea leer.");
        webView.evaluateJavascript(AREA_SCRIPT, ignored -> pollAreaResult(0));
    }

    private void pollAreaResult(int attempt) {
        if (attempt > 240) { status.setText("La selección fue cancelada o tardó demasiado."); return; }
        handler.postDelayed(() -> webView.evaluateJavascript(
            "(function(){var v=document.documentElement.dataset.l26AreaResult||'';if(v)delete document.documentElement.dataset.l26AreaResult;return v;})()",
            value -> {
                String decoded = decodeJsValue(value);
                if (decoded == null || decoded.isBlank()) pollAreaResult(attempt + 1);
                else handleDecodedJson(decoded, "No se encontró texto dentro del área seleccionada.");
            }), 250);
    }

    private String decodeJsValue(String value) {
        try {
            if (value == null || value.equals("null") || value.equals("undefined")) return "";
            return new JSONArray("[" + value + "]").optString(0, "");
        } catch (Exception error) { return ""; }
    }

    private void handleReaderJson(String rawValue, String emptyMessage) {
        String decoded = decodeJsValue(rawValue);
        handleDecodedJson(decoded, emptyMessage);
    }

    private void handleDecodedJson(String decoded, String emptyMessage) {
        try {
            JSONObject payload = new JSONObject(decoded == null ? "{}" : decoded);
            String text = payload.optString("text", "").trim();
            if (text.isEmpty()) { status.setText(emptyMessage); return; }
            Intent result = new Intent();
            result.putExtra("caseId", caseId);
            result.putExtra("tramite", tramite);
            result.putExtra("text", text);
            result.putExtra("title", payload.optString("title", ""));
            result.putExtra("url", payload.optString("url", webView.getUrl()));
            setResult(RESULT_OK, result);
            finish();
        } catch (Exception error) {
            status.setText("No se pudo procesar la lectura: " + error.getMessage());
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
