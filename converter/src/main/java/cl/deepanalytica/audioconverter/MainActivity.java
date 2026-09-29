package cl.deepanalytica.audioconverter;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.arthenica.ffmpegkit.FFmpegKit;
import com.arthenica.ffmpegkit.ReturnCode;
import com.arthenica.ffmpegkit.Session;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private static final int PICK_FILE = 1001;

    private final String[] formats = {"MP3", "M4A", "AAC", "WAV", "FLAC", "OGG", "OPUS"};
    private final String[] bitrates = {"128k", "192k", "256k", "320k"};

    private Uri selectedUri;
    private String selectedName = "archivo";
    private long selectedSize = -1;

    private Uri outputUri;
    private String outputMime = "audio/mpeg";

    private TextView fileNameText;
    private TextView fileMetaText;
    private TextView statusText;
    private TextView resultText;
    private Spinner formatSpinner;
    private Spinner bitrateSpinner;
    private TextView bitrateLabel;
    private Button chooseButton;
    private Button convertButton;
    private Button cancelButton;
    private Button openButton;
    private Button shareButton;
    private ProgressBar progressBar;
    private LinearLayout resultCard;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private int bg = Color.rgb(8, 17, 31);
    private int card = Color.rgb(16, 27, 43);
    private int card2 = Color.rgb(20, 37, 56);
    private int accent = Color.rgb(104, 231, 212);
    private int text = Color.rgb(243, 247, 252);
    private int muted = Color.rgb(184, 197, 215);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(bg);
        getWindow().setNavigationBarColor(bg);
        buildUi();
    }

    private void buildUi() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(bg);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(30), dp(20), dp(30));
        scroll.addView(root, new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        root.addView(header);

        TextView logo = new TextView(this);
        logo.setText("≋");
        logo.setTextColor(Color.rgb(5, 25, 30));
        logo.setTextSize(32);
        logo.setGravity(Gravity.CENTER);
        logo.setTypeface(Typeface.DEFAULT_BOLD);
        logo.setBackground(roundRect(accent, 18));
        header.addView(logo, new LinearLayout.LayoutParams(dp(54), dp(54)));

        LinearLayout titleBox = new LinearLayout(this);
        titleBox.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1);
        titleParams.leftMargin = dp(14);
        header.addView(titleBox, titleParams);

        TextView title = label("Deep Audio Convert", 26, text, true);
        titleBox.addView(title);
        TextView subtitle = label("Conversión local · sin subir tus archivos", 13, muted, false);
        titleBox.addView(subtitle);

        spacer(root, 22);

        LinearLayout fileCard = cardContainer();
        root.addView(fileCard);

        fileNameText = label("Selecciona un audio o video", 17, text, true);
        fileCard.addView(fileNameText);
        fileMetaText = label("WMV, WMA, MP4, MOV, WAV, FLAC, AAC, OGG y más", 12, muted, false);
        LinearLayout.LayoutParams metaParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        metaParams.topMargin = dp(4);
        fileCard.addView(fileMetaText, metaParams);

        chooseButton = actionButton("Elegir archivo", true);
        LinearLayout.LayoutParams chooseParams = fullWidthButtonParams();
        chooseParams.topMargin = dp(16);
        fileCard.addView(chooseButton, chooseParams);
        chooseButton.setOnClickListener(v -> chooseFile());

        spacer(root, 16);

        LinearLayout optionsCard = cardContainer();
        root.addView(optionsCard);

        TextView outputLabel = label("Formato de salida", 16, text, true);
        optionsCard.addView(outputLabel);

        formatSpinner = spinner(formats);
        LinearLayout.LayoutParams spinParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(54));
        spinParams.topMargin = dp(12);
        optionsCard.addView(formatSpinner, spinParams);

        bitrateLabel = label("Calidad / bitrate", 13, muted, false);
        LinearLayout.LayoutParams bitLabelParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        bitLabelParams.topMargin = dp(16);
        optionsCard.addView(bitrateLabel, bitLabelParams);

        bitrateSpinner = spinner(bitrates);
        LinearLayout.LayoutParams bitSpinParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(54));
        bitSpinParams.topMargin = dp(8);
        optionsCard.addView(bitrateSpinner, bitSpinParams);
        bitrateSpinner.setSelection(1);

        formatSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                String fmt = formats[position];
                boolean lossy = !(fmt.equals("WAV") || fmt.equals("FLAC"));
                bitrateSpinner.setVisibility(lossy ? View.VISIBLE : View.GONE);
                bitrateLabel.setVisibility(lossy ? View.VISIBLE : View.GONE);
                if (selectedUri != null) convertButton.setText("Convertir a " + fmt);
            }
            @Override public void onNothingSelected(AdapterView<?> parent) {}
        });

        convertButton = actionButton("Convertir a MP3", true);
        convertButton.setEnabled(false);
        LinearLayout.LayoutParams convertParams = fullWidthButtonParams();
        convertParams.topMargin = dp(18);
        optionsCard.addView(convertButton, convertParams);
        convertButton.setOnClickListener(v -> startConversion());

        cancelButton = actionButton("Cancelar conversión", false);
        cancelButton.setVisibility(View.GONE);
        LinearLayout.LayoutParams cancelParams = fullWidthButtonParams();
        cancelParams.topMargin = dp(10);
        optionsCard.addView(cancelButton, cancelParams);
        cancelButton.setOnClickListener(v -> {
            FFmpegKit.cancel();
            statusText.setText("Cancelando…");
        });

        spacer(root, 16);

        LinearLayout statusCard = cardContainer();
        statusCard.setBackground(roundRect(Color.rgb(12, 23, 38), 22));
        root.addView(statusCard);

        TextView stateLabel = label("ESTADO", 11, muted, true);
        statusCard.addView(stateLabel);
        statusText = label("Listo para convertir", 15, text, true);
        LinearLayout.LayoutParams stateParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        stateParams.topMargin = dp(8);
        statusCard.addView(statusText, stateParams);

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setIndeterminate(true);
        progressBar.setVisibility(View.GONE);
        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(5));
        progressParams.topMargin = dp(12);
        statusCard.addView(progressBar, progressParams);

        spacer(root, 16);

        resultCard = cardContainer();
        resultCard.setBackground(roundRect(Color.rgb(18, 44, 43), 22));
        resultCard.setTag("resultCard");
        resultCard.setVisibility(View.GONE);
        root.addView(resultCard);

        resultText = label("Archivo guardado", 15, text, true);
        resultCard.addView(resultText);

        LinearLayout actions = new LinearLayout(this);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams actionsParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        actionsParams.topMargin = dp(12);
        resultCard.addView(actions, actionsParams);

        openButton = actionButton("Abrir", true);
        LinearLayout.LayoutParams half1 = new LinearLayout.LayoutParams(0, dp(48), 1);
        half1.rightMargin = dp(6);
        actions.addView(openButton, half1);
        openButton.setOnClickListener(v -> openResult());

        shareButton = actionButton("Compartir", false);
        LinearLayout.LayoutParams half2 = new LinearLayout.LayoutParams(0, dp(48), 1);
        half2.leftMargin = dp(6);
        actions.addView(shareButton, half2);
        shareButton.setOnClickListener(v -> shareResult());

        spacer(root, 18);
        TextView footer = label(
                "Los archivos se procesan en tu teléfono. El resultado se guarda en Música/Deep Audio Convert.",
                12, muted, false);
        root.addView(footer);

        setContentView(scroll);
    }

    private void chooseFile() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                "audio/*", "video/*", "application/octet-stream",
                "video/x-ms-wmv", "audio/x-ms-wma"
        });
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(intent, PICK_FILE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_FILE || resultCode != RESULT_OK || data == null || data.getData() == null) return;

        selectedUri = data.getData();
        try {
            final int flags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            getContentResolver().takePersistableUriPermission(selectedUri, flags);
        } catch (Exception ignored) {}

        readFileInfo(selectedUri);
        fileNameText.setText(selectedName);
        fileMetaText.setText(selectedSize >= 0 ? humanSize(selectedSize) : "Archivo listo");
        statusText.setText("Archivo seleccionado");
        convertButton.setEnabled(true);
        convertButton.setText("Convertir a " + formats[formatSpinner.getSelectedItemPosition()]);
        hideResult();
    }

    private void readFileInfo(Uri uri) {
        selectedName = "archivo";
        selectedSize = -1;
        Cursor c = getContentResolver().query(
                uri, new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE},
                null, null, null
        );
        if (c != null) {
            try {
                if (c.moveToFirst()) {
                    int nameIndex = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    int sizeIndex = c.getColumnIndex(OpenableColumns.SIZE);
                    if (nameIndex >= 0 && !c.isNull(nameIndex)) selectedName = c.getString(nameIndex);
                    if (sizeIndex >= 0 && !c.isNull(sizeIndex)) selectedSize = c.getLong(sizeIndex);
                }
            } finally {
                c.close();
            }
        }
    }

    private void startConversion() {
        if (selectedUri == null) return;

        final String format = formats[formatSpinner.getSelectedItemPosition()];
        final String bitrate = bitrates[bitrateSpinner.getSelectedItemPosition()];

        setBusy(true);
        hideResult();
        statusText.setText("Preparando archivo…");

        executor.execute(() -> {
            try {
                ConversionResult result = convert(selectedUri, selectedName, format, bitrate);
                outputUri = result.uri;
                outputMime = result.mime;
                runOnUiThread(() -> {
                    setBusy(false);
                    statusText.setText("Conversión completada");
                    showResult(result.fileName);
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    setBusy(false);
                    statusText.setText("Error: " + shortMessage(e));
                    Toast.makeText(this, "No se pudo convertir el archivo", Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    private ConversionResult convert(Uri sourceUri, String sourceName, String format, String bitrate) throws Exception {
        String stamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        String sourceExt = extensionOf(sourceName);
        String base = safeBaseName(sourceName);
        String outExt = extensionFor(format);
        String mime = mimeFor(format);

        File inputFile = new File(getCacheDir(), "input_" + stamp + "." + sourceExt);
        File outputFile = new File(getCacheDir(), base + "_" + stamp + "." + outExt);

        postStatus("Copiando archivo al área de trabajo…");
        ContentResolver resolver = getContentResolver();
        try (InputStream in = resolver.openInputStream(sourceUri);
             OutputStream out = new FileOutputStream(inputFile)) {
            if (in == null) throw new Exception("No se pudo leer el archivo seleccionado");
            copy(in, out);
        }

        String codec = codecFor(format);
        String quality = (format.equals("WAV") || format.equals("FLAC")) ? "" : " -b:a " + bitrate;
        String command = "-y -hide_banner -i " + quote(inputFile.getAbsolutePath())
                + " -map 0:a:0? -vn -sn -dn " + codec + quality + " "
                + quote(outputFile.getAbsolutePath());

        postStatus("Convirtiendo con FFmpeg…");
        Session session = FFmpegKit.execute(command);
        if (!ReturnCode.isSuccess(session.getReturnCode())) {
            String logs = session.getAllLogsAsString();
            if (logs == null) logs = "";
            if (logs.length() > 500) logs = logs.substring(logs.length() - 500);
            throw new Exception("FFmpeg: " + logs);
        }

        if (!outputFile.exists() || outputFile.length() == 0) {
            throw new Exception("El archivo de salida quedó vacío");
        }

        postStatus("Guardando en Música/Deep Audio Convert…");
        String displayName = base + "_" + stamp + "." + outExt;

        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, displayName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, "Music/Deep Audio Convert");
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        Uri destination = resolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values);
        if (destination == null) throw new Exception("Android no permitió crear el archivo de salida");

        try {
            try (InputStream in = new java.io.FileInputStream(outputFile);
                 OutputStream out = resolver.openOutputStream(destination)) {
                if (out == null) throw new Exception("No se pudo escribir el resultado");
                copy(in, out);
            }
            values.clear();
            values.put(MediaStore.MediaColumns.IS_PENDING, 0);
            resolver.update(destination, values, null, null);
        } catch (Exception e) {
            resolver.delete(destination, null, null);
            throw e;
        } finally {
            inputFile.delete();
            outputFile.delete();
        }

        return new ConversionResult(destination, displayName, mime);
    }

    private String codecFor(String format) {
        switch (format) {
            case "MP3": return "-c:a libmp3lame";
            case "M4A":
            case "AAC": return "-c:a aac";
            case "WAV": return "-c:a pcm_s16le";
            case "FLAC": return "-c:a flac";
            case "OGG": return "-c:a libvorbis";
            case "OPUS": return "-c:a libopus";
            default: return "-c:a libmp3lame";
        }
    }

    private String extensionFor(String format) {
        switch (format) {
            case "M4A": return "m4a";
            case "AAC": return "aac";
            case "WAV": return "wav";
            case "FLAC": return "flac";
            case "OGG": return "ogg";
            case "OPUS": return "opus";
            default: return "mp3";
        }
    }

    private String mimeFor(String format) {
        switch (format) {
            case "M4A": return "audio/mp4";
            case "AAC": return "audio/aac";
            case "WAV": return "audio/wav";
            case "FLAC": return "audio/flac";
            case "OGG":
            case "OPUS": return "audio/ogg";
            default: return "audio/mpeg";
        }
    }

    private void setBusy(boolean busy) {
        chooseButton.setEnabled(!busy);
        convertButton.setEnabled(!busy && selectedUri != null);
        formatSpinner.setEnabled(!busy);
        bitrateSpinner.setEnabled(!busy);
        cancelButton.setVisibility(busy ? View.VISIBLE : View.GONE);
        progressBar.setVisibility(busy ? View.VISIBLE : View.GONE);
    }

    private void postStatus(String message) {
        runOnUiThread(() -> statusText.setText(message));
    }

    private void showResult(String fileName) {
        resultText.setText("Archivo guardado\n" + fileName);
        if (resultCard != null) resultCard.setVisibility(View.VISIBLE);
    }

    private void hideResult() {
        if (resultCard != null) resultCard.setVisibility(View.GONE);
        outputUri = null;
    }

    private void openResult() {
        if (outputUri == null) return;
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(outputUri, outputMime);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "No hay una app disponible para abrir este formato", Toast.LENGTH_SHORT).show();
        }
    }

    private void shareResult() {
        if (outputUri == null) return;
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType(outputMime);
        intent.putExtra(Intent.EXTRA_STREAM, outputUri);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        startActivity(Intent.createChooser(intent, "Compartir audio"));
    }

    private LinearLayout cardContainer() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(18), dp(18), dp(18), dp(18));
        box.setBackground(roundRect(card, 22));
        box.setElevation(dp(2));
        return box;
    }

    private TextView label(String value, int sp, int color, boolean bold) {
        TextView tv = new TextView(this);
        tv.setText(value);
        tv.setTextSize(sp);
        tv.setTextColor(color);
        tv.setLineSpacing(0, 1.12f);
        if (bold) tv.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return tv;
    }

    private Button actionButton(String value, boolean filled) {
        Button b = new Button(this);
        b.setText(value);
        b.setAllCaps(false);
        b.setTextSize(15);
        b.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        b.setTextColor(filled ? Color.rgb(4, 25, 28) : text);
        b.setBackground(roundRect(filled ? accent : card2, 16));
        b.setPadding(dp(12), 0, dp(12), 0);
        return b;
    }

    private Spinner spinner(String[] values) {
        Spinner s = new Spinner(this);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(
                this, android.R.layout.simple_spinner_item, values) {
            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                TextView v = (TextView) super.getView(position, convertView, parent);
                v.setTextColor(text);
                v.setTextSize(15);
                v.setPadding(dp(14), 0, dp(14), 0);
                return v;
            }
            @Override
            public View getDropDownView(int position, View convertView, ViewGroup parent) {
                TextView v = (TextView) super.getDropDownView(position, convertView, parent);
                v.setTextColor(text);
                v.setTextSize(15);
                v.setBackgroundColor(card2);
                v.setPadding(dp(16), dp(14), dp(16), dp(14));
                return v;
            }
        };
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        s.setAdapter(adapter);
        s.setBackground(roundRect(card2, 14));
        return s;
    }

    private GradientDrawable roundRect(int color, int radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radiusDp));
        return d;
    }

    private LinearLayout.LayoutParams fullWidthButtonParams() {
        return new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52));
    }

    private void spacer(LinearLayout root, int dp) {
        View v = new View(this);
        root.addView(v, new LinearLayout.LayoutParams(1, dp(dp)));
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private String humanSize(long bytes) {
        double mb = bytes / (1024.0 * 1024.0);
        if (mb >= 1) return String.format(Locale.US, "%.1f MB", mb);
        return String.format(Locale.US, "%.0f KB", bytes / 1024.0);
    }

    private String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot >= 0 && dot < fileName.length() - 1) return fileName.substring(dot + 1);
        return "bin";
    }

    private String safeBaseName(String fileName) {
        int dot = fileName.lastIndexOf('.');
        String base = dot > 0 ? fileName.substring(0, dot) : fileName;
        base = base.replaceAll("[^A-Za-z0-9áéíóúÁÉÍÓÚñÑ _-]", "_").trim();
        return base.isEmpty() ? "audio" : base;
    }

    private String quote(String value) {
        return "\"" + value.replace("\"", "\\\"") + "\"";
    }

    private void copy(InputStream in, OutputStream out) throws Exception {
        byte[] buffer = new byte[1024 * 64];
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
        out.flush();
    }

    private String shortMessage(Exception e) {
        String message = e.getMessage();
        if (message == null || message.trim().isEmpty()) return "error desconocido";
        message = message.replace("\n", " ").replace("\r", " ").trim();
        return message.length() > 180 ? message.substring(0, 180) + "…" : message;
    }

    @Override
    protected void onDestroy() {
        executor.shutdownNow();
        super.onDestroy();
    }

    private static class ConversionResult {
        final Uri uri;
        final String fileName;
        final String mime;

        ConversionResult(Uri uri, String fileName, String mime) {
            this.uri = uri;
            this.fileName = fileName;
            this.mime = mime;
        }
    }
}
