# Android Offline PDF + OCR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the installed Android L-26 app fully usable offline for local functionality, with PDF.js and Spanish/Latin OCR bundled inside the APK.

**Architecture:** The trusted Android WebView continues to run the common L-26 web UI from APK assets. PDF.js becomes local-only and GitHub vendors the pinned distribution before building. Scanned-PDF OCR uses the bundled ML Kit Latin text-recognition model through the trusted Android bridge; no OCR model is downloaded at runtime.

**Tech Stack:** HTML/JavaScript, PDF.js 4.10.38 legacy, Android WebView Java, ML Kit bundled text recognition 16.0.1, Gradle 9.5 / AGP 9.3 / JDK 17, GitHub Actions.

**Spec:** Conversation-approved requirement: Android phone/tablet local functions and PDF reader must work without connection; PDF engine and OCR are included in the installed APK.

## Global Constraints
- Keep IndexedDB identity/database behavior unchanged.
- Do not change case merge rules, Gestión, croquis, filters, templates, or reports.
- External web pages still require network unless already cached externally.
- PDF.js must not use CDN/runtime download in the installed app.
- OCR must use the bundled ML Kit Latin model, not the Play Services downloadable model.
- GitHub build must fail instead of publishing an APK without required PDF assets.

---

### Task 1: Offline PDF engine contract
- [x] Add failing tests asserting no remote PDF.js runtime fallback and required local assets/build gate.
- [x] Change PDF loader and service worker to local-only assets.
- [x] Vendor PDF.js build resources through the build script.
- [x] Run focused tests.

### Task 2: Bundled Android OCR
- [x] Add failing tests for bundled ML Kit dependency and native OCR bridge.
- [x] Add bundled Latin OCR dependency.
- [x] Add trusted `ocrImage` bridge implementation.
- [x] Route scanned PDF OCR through Android bridge before browser TextDetector fallback.
- [x] Run focused tests.

### Task 3: Pending interface/runtime corrections
- [x] Add regression tests for `Información General` label and accurate Web/PWA diagnostic.
- [x] Apply only those pending approved corrections.
- [x] Run focused tests.

### Task 4: Distribution and regression
- [x] Verify Android sync copies PDF.js assets into APK web root.
- [x] Verify workflows vendor assets before Android/Windows builds.
- [x] Run full Python, self-contained Node, and desktop suites.
- [x] Create SHA-256 manifest and final GitHub repository ZIP.
- [x] Extract final ZIP and re-run critical contracts.
