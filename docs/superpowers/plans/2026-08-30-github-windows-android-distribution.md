# GitHub Windows + Android Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the L-26 repository so GitHub automatically tests the application and produces installable Windows and Android artifacts, while preserving the protected transaction identity and internal readers.

**Architecture:** Keep the existing web runtime as the single application core. Windows packages it with the existing Electron wrapper. Android adds a thin native WebView shell that serves the same runtime from an HTTPS-like local origin, provides a native internal web reader without exposing a JavaScript bridge to untrusted remote pages, and returns read text to the trusted L-26 runtime.

**Tech Stack:** HTML/JavaScript PWA, Python/Node tests, Electron 44 + electron-builder, Android Java WebView, AGP 9.3.0, Gradle 9.5.0, GitHub Actions.

**Spec:** Conversation-approved distribution design: GitHub repository builds `.exe` for Windows and `.apk` for Android/tablet/cellphone.

## Global Constraints

- Preserve IndexedDB database name `LibretaValoracionCR` and DB version `6`.
- Never allow readers to replace the active transaction number.
- Windows external links must open in the L-26 internal reader.
- Android external links must open in a dedicated in-app reader; no JavaScript bridge may be exposed to untrusted remote pages.
- PDF rendering must use the compatible PDF.js 4.10.38 legacy runtime and new cache key.
- GitHub builds must run regression tests before packaging.
- Windows and Android artifacts must be downloadable from GitHub Actions; version tags must produce a GitHub Release.

---

### Task 1: PDF compatibility repair
- [ ] Make PDF.js 4.10.38 legacy the runtime and worker source.
- [ ] Install typed-array compatibility before module import.
- [ ] Version the service-worker/PDF cache.
- [ ] Run PDF compatibility contract tests.

### Task 2: CI contract
- [ ] Add a cross-platform CI runner script.
- [ ] Add GitHub Actions CI workflow.
- [ ] Verify Python, Node and desktop static tests are included.

### Task 3: Windows build workflow
- [ ] Add Windows GitHub Actions workflow.
- [ ] Install pinned desktop dependencies and run tests.
- [ ] Build NSIS installer + portable executable.
- [ ] Upload Windows artifacts.

### Task 4: Android application shell
- [ ] Add Android Gradle project with package `cr.go.sarapiqui.fiscalizacion.l26`.
- [ ] Serve trusted bundled L-26 assets via `https://appassets.androidplatform.net` interception.
- [ ] Add file chooser, location permission and trusted download bridge.
- [ ] Add internal reader activity with page and rectangular-area reading.
- [ ] Return reader data to the exact L-26 case through a trusted callback.

### Task 5: Android build workflow
- [ ] Add runtime asset sync script.
- [ ] Build debug-signed installable APK on GitHub.
- [ ] Rename/upload APK as `Fiscalizacion-L26-Android.apk`.

### Task 6: Releases
- [ ] Add tag-triggered release workflow.
- [ ] Build Windows and Android in isolated jobs.
- [ ] Publish `.exe` and `.apk` assets only after tests/builds succeed.

### Task 7: Verification and delivery
- [ ] Run full local regression suite excluding only external-file fixtures not present in repository.
- [ ] Validate workflow YAML and Android source contracts.
- [ ] Generate SHA-256 manifest and ZIP repository package.
