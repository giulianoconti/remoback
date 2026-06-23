# Visual redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full mobile-first visual redesign of the "remove background" app — light/violet aesthetic, responsive grid, and a fixed-height image-card thumbnail that fixes the real bug where uploading a high-resolution image broke the page layout.

**Architecture:** Rewrite `src/index.css` to new design tokens and a CSS Grid-based image layout (replaces the fixed `max-width: 530px` shell + `flex-wrap` that never actually wrapped). `ImageCard.jsx` drops its `widthCanvasImg` prop entirely — the preview canvas is now capped to a fixed-height card via CSS (`max-height`) plus an internal resolution cap, independent of window width. `App.jsx` removes the now-dead `widthCanvasImg`/`useWindowDimensions` resize machinery and restructures its JSX into the new layout (collapsing drop zone, grid section, restyled color panel, restyled action row). `Footer.jsx`, `ChooseColorRangeItem.jsx`, `ChooseColorColorItem.jsx` get class-name-only restyles. No change to upload/background-removal/zip-download logic.

**Tech Stack:** React 18, Vite, plain CSS (hand-rolled utility classes, no framework).

## Global Constraints

- No test framework exists in this project (no jest/vitest, no test script in `package.json`). Every task has a manual browser verification step instead — run `npm run dev`, open the page, check the specific behavior. This is the same deliberate TDD deviation used in the prior multi-image-upload plan.
- Keep all existing functionality unchanged: multi-image upload, shared color-range background removal, zip download. Only visuals/layout/markup change.
- No CSS framework adoption — stays hand-rolled CSS in `src/index.css`.
- Spec: `docs/superpowers/specs/2026-06-23-visual-redesign-design.md`.

---

## Current code being replaced

`src/index.css` (273 lines) — full rewrite to new tokens/classes (see Task 1).

`src/components/ImageCard.jsx` currently takes `widthCanvasImg` as a prop and recomputes the display canvas size on every prop change via a `useEffect`. This ties preview size to a single global target width tracked in `App.jsx` via `useWindowDimensions` + a resize `useEffect`. The new design computes preview size purely from the full-resolution canvas's own aspect ratio capped to a max dimension, with the actual on-screen box size enforced by CSS (`max-height: 220px` on the card, the canvas scales via `max-width/max-height: 100%`). This removes the need for `widthCanvasImg` and the window-resize wiring entirely.

`src/App.jsx` currently renders one big fixed-width shell (`max-w-530`), a `flex flex-wrap` image container that never actually wraps (because the shell itself is capped at 530px), a flat dark color-range panel, and an unconditional full drop zone.

---

### Task 1: Rewrite `src/index.css` with new design tokens and layout classes

**Files:**
- Modify: `src/index.css` (full replace)

**Interfaces:**
- Produces: CSS classes consumed by Tasks 2-4 — `.app-shell`, `.app-container`, `.dropzone`, `.dropzone-compact`, `.dropzone-icon`, `.dropzone-title`, `.dropzone-sub`, `.btn-browse`, `.btn-add-more`, `.image-section`, `.color-readout`, `.image-grid`, `.image-card`, `.image-card-thumb`, `.image-card-canvas`, `.image-card-name`, `.image-card-badge`, `.color-panel`, `.color-panel-title`, `.color-panel-row`, `.color-range-list`, `.color-range-item`, `.color-range-item-header`, `.color-range-label`, `.color-range-input`, `.color-swatch`, `.input-range`, `.bg-Red`, `.bg-Green`, `.bg-Blue`, `.actions`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-select`, `.app-footer`, `.unselectable`, `.mouse-crosshair`, `.d-none`, `.upload-file`.

- [ ] **Step 1: Replace the entire file**

Replace all of `src/index.css` with:

```css
:root {
  --color-bg: #f4f6fb;
  --color-surface: #ffffff;
  --color-text: #1f2330;
  --color-text-muted: #6b7280;
  --color-accent-start: #6366f1;
  --color-accent-end: #8b5cf6;
  --color-secondary-bg: #e5e7eb;
  --color-secondary-text: #374151;
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-card: 0 1px 4px rgba(0, 0, 0, 0.08);
  --font-sans: -apple-system, "Inter", "Segoe UI", Roboto, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  border: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-text);
}

/* -------------- Layout shell -------------- */

.app-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
}

.app-container {
  width: 100%;
  max-width: 960px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.unselectable {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.d-none {
  display: none;
}

.mouse-crosshair {
  cursor: crosshair;
}

/* -------------- Drop zone -------------- */

.dropzone {
  background: linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end));
  padding: 32px 16px;
  text-align: center;
  color: white;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.dropzone-compact {
  padding: 12px 16px;
}

.dropzone-icon {
  background-image: url("/imgs/uploadFile.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  height: 64px;
  width: 64px;
  margin: 0 auto 12px;
}

.dropzone-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.dropzone-sub {
  font-size: 13px;
  opacity: 0.85;
  margin-bottom: 14px;
}

.btn-browse {
  display: inline-block;
  background: rgba(255, 255, 255, 0.18);
  border: 1.5px dashed rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-md);
  padding: 8px 18px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.btn-add-more {
  display: inline-block;
  background: white;
  color: var(--color-accent-start);
  border-radius: 20px;
  padding: 6px 16px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: var(--shadow-card);
}

/* -------------- Image grid -------------- */

.image-section {
  padding: 16px;
}

.color-readout {
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  padding: 8px;
  border-radius: var(--radius-md);
  margin-bottom: 14px;
  color: var(--color-text);
  border: 1px solid #e5e7eb;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.image-card {
  background: var(--color-surface);
  border: 1px solid #e9ebf1;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  position: relative;
}

.image-card-thumb {
  height: 220px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.04)), url("/imgs/bgpng.png");
  background-size: cover;
}

.image-card-canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

.image-card-name {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 8px 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-card-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #22c55e;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: var(--shadow-card);
}

/* -------------- Color range panel -------------- */

.color-panel {
  padding: 16px;
  border-top: 1px solid #eef0f5;
}

.color-panel-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
  color: var(--color-text);
}

.color-panel-row {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.color-range-list {
  list-style: none;
  flex: 1;
}

.color-range-item {
  margin-bottom: 14px;
}

.color-range-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.color-range-label {
  border-radius: var(--radius-md);
  padding: 4px 0;
  flex: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.color-range-input {
  border: 1px solid #d1d5db;
  border-radius: var(--radius-md);
  padding: 4px 0;
  flex: 1;
  text-align: center;
  font-size: 12px;
}

.color-range-input:focus {
  outline: 2px solid var(--color-accent-start);
}

.color-swatch {
  width: 60px;
  border-radius: var(--radius-md);
  border: 1px solid #e5e7eb;
}

.input-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  background: #e5e7eb;
}

.input-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent-start);
  cursor: pointer;
}

.input-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent-start);
  cursor: pointer;
  border: none;
}

.bg-Red {
  background-color: #ef4444;
}

.bg-Green {
  background-color: #22c55e;
}

.bg-Blue {
  background-color: #3b82f6;
}

/* -------------- Actions -------------- */

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid #eef0f5;
}

.btn {
  flex: 1;
  min-width: 140px;
  border-radius: var(--radius-md);
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end));
  color: white;
}

.btn-primary:hover {
  filter: brightness(0.95);
}

.btn-secondary {
  background: var(--color-secondary-bg);
  color: var(--color-secondary-text);
}

.btn-secondary:hover {
  filter: brightness(0.97);
}

.btn-select {
  flex: 0 0 90px;
  border-radius: var(--radius-md);
  border: 1px solid #d1d5db;
  padding: 12px 6px;
  font-size: 13px;
}

@media (max-width: 480px) {
  .actions {
    flex-direction: column;
  }

  .btn-select {
    flex: 1;
  }
}

/* -------------- Footer -------------- */

.app-footer {
  display: flex;
  gap: 4px;
  justify-content: center;
  padding: 16px 0;
  font-size: 13px;
  color: var(--color-text-muted);
}

.app-footer a {
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 600;
}

.app-footer a:hover {
  color: var(--color-text);
}
```

- [ ] **Step 2: Manual check**

Run: `npx vite build 2>&1 | tail -30`

Expected: clean build (CSS errors would show as a Vite/PostCSS parse error referencing `src/index.css` — confirm none appear). The page itself will look broken/unstyled until Tasks 2-4 update the JSX to use these new class names — that's expected at this point.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "Rewrite stylesheet with mobile-first design tokens and grid layout"
```

---

### Task 2: Simplify `ImageCard.jsx` — fixed-height thumbnail, drop `widthCanvasImg`, add `processed` badge

**Files:**
- Modify: `src/components/ImageCard.jsx` (full replace)

**Interfaces:**
- Consumes: nothing new.
- Produces: `ImageCard` now accepts props `{ originalURL, name, onPixelPick, processed }` (removed `widthCanvasImg`). Ref API unchanged in shape but `refreshPreview` is now zero-argument: `{ getCanvas: () => HTMLCanvasElement, refreshPreview: () => void }`. `getCanvas()` still returns the full-resolution canvas (used by `App.jsx` for background removal and zip export) — this task does not touch that contract.

- [ ] **Step 1: Replace the entire file**

Replace all of `src/components/ImageCard.jsx` with:

```jsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const MAX_PREVIEW_DIMENSION = 800;

export const ImageCard = forwardRef(function ImageCard({ originalURL, name, onPixelPick, processed }, ref) {
  const imgRef = useRef(null);
  const fullCanvasRef = useRef(null);
  const displayCanvasRef = useRef(null);

  const refreshPreview = () => {
    const fullCanvas = fullCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    const scale = Math.min(1, MAX_PREVIEW_DIMENSION / Math.max(fullCanvas.width, fullCanvas.height));
    displayCanvas.width = Math.round(fullCanvas.width * scale);
    displayCanvas.height = Math.round(fullCanvas.height * scale);
    displayCanvas.getContext("2d").drawImage(fullCanvas, 0, 0, displayCanvas.width, displayCanvas.height);
  };

  useEffect(() => {
    const img = new Image();
    img.src = originalURL;
    img.onload = () => {
      imgRef.current = img;
      const fullCanvas = fullCanvasRef.current;
      fullCanvas.width = img.naturalWidth;
      fullCanvas.height = img.naturalHeight;
      fullCanvas.getContext("2d").drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
      refreshPreview();
    };
  }, [originalURL]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => fullCanvasRef.current,
    refreshPreview,
  }));

  const getPixel = (e) => {
    const canvas = displayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    const data = ctx.getImageData(x, y, 1, 1).data;
    onPixelPick(`rgb(${data[0]}, ${data[1]}, ${data[2]})`);
  };

  return (
    <div className="image-card">
      {processed && <div className="image-card-badge">✓</div>}
      <div className="image-card-thumb">
        <canvas ref={fullCanvasRef} style={{ display: "none" }} />
        <canvas ref={displayCanvasRef} className="mouse-crosshair image-card-canvas" onMouseMove={getPixel} />
      </div>
      <div className="image-card-name">{name}</div>
    </div>
  );
});
```

Note what changed from the previous version: `widthCanvasImg` prop and its resize-driven `useEffect` are gone — `refreshPreview` now takes no argument and computes its own target size by capping the larger dimension at `MAX_PREVIEW_DIMENSION` (800px), independent of viewport width. The actual on-screen box size is enforced entirely by the `.image-card-thumb` (fixed `height: 220px` from Task 1) and `.image-card-canvas` (`max-width/max-height: 100%`) CSS — the browser scales the canvas's pixel buffer down visually to fit, no JS recalculation needed on resize.

- [ ] **Step 2: Manual check**

Run: `npx vite build 2>&1 | tail -30`

Expected: build error is fine/expected at this point if `App.jsx` (Task 3, not done yet) still passes a `widthCanvasImg` prop — React doesn't error on an extra unused prop, it's just ignored, so the build should actually succeed cleanly even before Task 3. Confirm clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/ImageCard.jsx
git commit -m "Cap ImageCard preview to fixed-height thumbnail, drop widthCanvasImg"
```

---

### Task 3: Restructure `App.jsx` — remove resize machinery, new layout JSX

**Files:**
- Modify: `src/App.jsx` (full replace)
- Delete: `src/hooks/useWindowDimensions.jsx` (only consumer is `App.jsx`; removed in this task)

**Interfaces:**
- Consumes: `ImageCard` props `{ originalURL, name, onPixelPick, processed }` and ref methods `{ getCanvas(), refreshPreview() }` from Task 2. CSS classes from Task 1.
- Produces: no new exports — `App` component's external behavior (what it renders into the DOM, top-level) is the only consumer-facing surface, and there are no other consumers of `App` besides `main.jsx`.

- [ ] **Step 1: Confirm `useWindowDimensions` has no other consumers**

Run: `grep -rn "useWindowDimensions" src/`

Expected: only `src/App.jsx` (import + one usage) and the hook's own definition file `src/hooks/useWindowDimensions.jsx`. If anything else references it, stop and report — don't delete the hook file in that case.

- [ ] **Step 2: Replace the entire `src/App.jsx` file**

```jsx
import { useRef, useState } from "react";
import JSZip from "jszip";
import { ChooseColorColorItem } from "./components/ChooseColorColorItem";
import { ChooseColorRangeItem } from "./components/ChooseColorRangeItem";
import { Footer } from "./components/Footer";
import { ImageCard } from "./components/ImageCard";

let nextImageId = 0;

export const App = () => {
  const dropAreaRef = useRef(null);
  const cardRefs = useRef({}); // { [imageId]: ImageCard ref }
  const [colorMouseMove, setColorMouseMove] = useState(null);
  const [images, setImages] = useState([]); // [{ id, name, originalURL, processed }]
  const [textDropAreaRef, setTextDropAreaRef] = useState("Drag & Drop To Upload File");
  const [removeWhatColor, setRemoveWhatColor] = useState({
    red1: 240,
    green1: 240,
    blue1: 240,
    red2: 255,
    green2: 255,
    blue2: 255,
  });
  const [fileType, setFileType] = useState("png");

  const hasImages = images.length > 0;

  // ----- Drag & Drop Image -----
  const dragOver = (e) => {
    e.preventDefault();
    dropAreaRef.current.style.filter = "brightness(0.92)";
    setTextDropAreaRef("Drop Image");
  };
  const dragLeave = (e) => {
    e.preventDefault();
    dropAreaRef.current.style.filter = "";
    setTextDropAreaRef("Drag & Drop To Upload File");
  };
  const fileDrop = (e) => {
    e.preventDefault();
    dropAreaRef.current.style.filter = "";
    setTextDropAreaRef("Drag & Drop To Upload File");
    showFiles(e.dataTransfer.files);
  };

  // ----- Browse File Button -----
  const browseFile = (e) => {
    e.preventDefault();
    showFiles(e.target.files);
  };

  // ----- Load Every Selected/Dropped File -----
  const validExtensions = ["image/apng", "image/avif", "image/gif", "image/jpeg", "image/png", "image/svg+xml", "image/webp", "image/bmp", "image/x-icon", "image/tiff"];

  const showFiles = (fileList) => {
    Array.from(fileList).forEach((file) => {
      if (!validExtensions.includes(file.type)) return;
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setImages((prev) => [
          ...prev,
          {
            id: nextImageId++,
            name: file.name.split(".")[0],
            originalURL: fileReader.result,
            processed: false,
          },
        ]);
      };
      fileReader.readAsDataURL(file);
    });
  };

  // ----- Choose Color -----
  const changeColor = ({ target: { value, name } }) => {
    if (!isNaN(value) && value >= 0 && value <= 255) {
      setRemoveWhatColor({
        ...removeWhatColor,
        [name]: value,
      });
    }
  };

  // ----- Remove Background Button -----
  const removeBackgroundFromCanvas = (canvas) => {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (
        data[i] >= removeWhatColor.red1 &&
        data[i] <= removeWhatColor.red2 &&
        data[i + 1] >= removeWhatColor.green1 &&
        data[i + 1] <= removeWhatColor.green2 &&
        data[i + 2] >= removeWhatColor.blue1 &&
        data[i + 2] <= removeWhatColor.blue2
      ) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const removeBackground = () => {
    const processedIds = new Set();
    images.forEach((image) => {
      const card = cardRefs.current[image.id];
      if (!card) return;
      removeBackgroundFromCanvas(card.getCanvas());
      card.refreshPreview();
      processedIds.add(image.id);
    });
    setImages((prev) => prev.map((image) => (processedIds.has(image.id) ? { ...image, processed: true } : image)));
  };

  // ----- Download All Button -----
  const downloadAll = async () => {
    const zip = new JSZip();
    for (const image of images) {
      const card = cardRefs.current[image.id];
      if (!card) continue;
      const canvas = card.getCanvas();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/" + fileType));
      if (!blob) continue;
      zip.file(`${image.name}.${fileType}`, blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.download = "images.zip";
    link.href = URL.createObjectURL(zipBlob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadImageWith = (e) => {
    setFileType(e.target.value);
  };

  return (
    <div className="app-shell">
      <div className="app-container">
        <div
          className={`dropzone unselectable${hasImages ? " dropzone-compact" : ""}`}
          ref={dropAreaRef}
          onDragOver={dragOver}
          onDragLeave={dragLeave}
          onDrop={fileDrop}
        >
          {!hasImages && <div className="dropzone-icon" />}
          {!hasImages && <div className="dropzone-title">{textDropAreaRef}</div>}
          {!hasImages && <div className="dropzone-sub">o elegí un archivo</div>}
          <label>
            <input className="d-none" onChange={browseFile} type="file" multiple accept="image/*" />
            <span className={hasImages ? "btn-add-more" : "btn-browse"}>{hasImages ? "+ Agregar más" : "Browse File"}</span>
          </label>
        </div>

        {hasImages && (
          <div className="image-section">
            <div className="color-readout" style={{ backgroundColor: colorMouseMove || "#ffffff" }}>
              {colorMouseMove || "Tocá una imagen para ver su color"}
            </div>
            <div className="image-grid">
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  ref={(el) => (cardRefs.current[image.id] = el)}
                  originalURL={image.originalURL}
                  name={image.name}
                  processed={image.processed}
                  onPixelPick={setColorMouseMove}
                />
              ))}
            </div>
          </div>
        )}

        <div className="color-panel">
          <h3 className="color-panel-title">Choose color range you want to remove</h3>
          <div className="color-panel-row">
            <ul className="color-range-list">
              <ChooseColorRangeItem colorName={"Red"} name={"red1"} value={removeWhatColor.red1} onChange={changeColor} />
              <ChooseColorRangeItem colorName={"Green"} name={"green1"} value={removeWhatColor.green1} onChange={changeColor} />
              <ChooseColorRangeItem colorName={"Blue"} name={"blue1"} value={removeWhatColor.blue1} onChange={changeColor} />
            </ul>
            <ChooseColorColorItem removeWhatColor1={removeWhatColor.red1} removeWhatColor2={removeWhatColor.green1} removeWhatColor3={removeWhatColor.blue1} />
            <ChooseColorColorItem removeWhatColor1={removeWhatColor.red2} removeWhatColor2={removeWhatColor.green2} removeWhatColor3={removeWhatColor.blue2} />
            <ul className="color-range-list">
              <ChooseColorRangeItem colorName={"Red"} name={"red2"} value={removeWhatColor.red2} onChange={changeColor} />
              <ChooseColorRangeItem colorName={"Green"} name={"green2"} value={removeWhatColor.green2} onChange={changeColor} />
              <ChooseColorRangeItem colorName={"Blue"} name={"blue2"} value={removeWhatColor.blue2} onChange={changeColor} />
            </ul>
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={removeBackground}>
            Quitar fondo
          </button>
          {images.some((image) => image.processed) && (
            <>
              <button className="btn btn-secondary" onClick={downloadAll}>
                Descargar todo
              </button>
              <select className="btn-select" onChange={downloadImageWith}>
                <option value="png">Png</option>
                <option value="webp">Webp</option>
                <option value="jpg">Jpg</option>
              </select>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};
```

- [ ] **Step 3: Delete the now-unused hook**

```bash
rm src/hooks/useWindowDimensions.jsx
```

- [ ] **Step 4: Manual check**

Run: `npx vite build 2>&1 | tail -30`

Expected: clean build, no errors.

- [ ] **Step 5: Commit**

```bash
git add -A src/App.jsx src/hooks/useWindowDimensions.jsx
git commit -m "Restructure App layout: collapsing dropzone, responsive grid, remove resize machinery"
```

---

### Task 4: Restyle `Footer.jsx`, `ChooseColorRangeItem.jsx`, `ChooseColorColorItem.jsx`

**Files:**
- Modify: `src/components/Footer.jsx`
- Modify: `src/components/ChooseColorRangeItem.jsx`
- Modify: `src/components/ChooseColorColorItem.jsx`

**Interfaces:**
- Consumes: CSS classes from Task 1 (`.app-footer`, `.color-range-item`, `.color-range-item-header`, `.color-range-label`, `.color-range-input`, `.input-range`, `.bg-Red`/`.bg-Green`/`.bg-Blue`, `.color-swatch`).
- Produces: `ChooseColorColorItem` no longer accepts a `margin` prop (it was only used for directional CSS margin classes that no longer exist — the new `.color-panel-row` uses `gap` instead). Both call sites in `App.jsx` already stopped passing `margin` in Task 3.

- [ ] **Step 1: Replace `src/components/Footer.jsx`**

```jsx
export const Footer = () => {
  return (
    <footer className="app-footer">
      <p>Made by:</p>
      <a href="https://www.linkedin.com/in/giulianoconti/" target="_blank" rel="noreferrer">
        Giuliano Conti
      </a>
    </footer>
  );
};
```

- [ ] **Step 2: Replace `src/components/ChooseColorRangeItem.jsx`**

```jsx
export const ChooseColorRangeItem = ({ colorName, name, value, onChange }) => {
  return (
    <li className="color-range-item">
      <div className="color-range-item-header">
        <span className={`color-range-label bg-${colorName}`}>{colorName}</span>
        <input className="color-range-input" name={name} value={value} onChange={onChange} />
      </div>
      <input className="input-range" type="range" name={name} min="0" max="255" value={value} onChange={onChange} />
    </li>
  );
};
```

- [ ] **Step 3: Replace `src/components/ChooseColorColorItem.jsx`**

```jsx
export const ChooseColorColorItem = ({ removeWhatColor1, removeWhatColor2, removeWhatColor3 }) => {
  return <div className="color-swatch" style={{ backgroundColor: "rgb(" + removeWhatColor1 + "," + removeWhatColor2 + "," + removeWhatColor3 + ")" }} />;
};
```

- [ ] **Step 4: Manual check**

Run: `npx vite build 2>&1 | tail -30`

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.jsx src/components/ChooseColorRangeItem.jsx src/components/ChooseColorColorItem.jsx
git commit -m "Restyle Footer and color-range components to new design"
```

---

### Task 5: Full manual verification pass

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` and note the URL it prints (e.g. `http://localhost:3000`).

- [ ] **Step 2: Empty state**

Open the app in a browser. Expected: large centered gradient drop zone with icon, title, subtitle, and a "Browse File" button — no image grid, no color panel visible yet... actually the color panel and action buttons ARE always rendered (only the image grid is conditional on `hasImages`) — confirm the color panel and "Quitar fondo" button are visible even with zero images (matches current/previous behavior, unchanged).

- [ ] **Step 3: Upload multiple images, including at least one large one**

Drag-and-drop or browse-select 2-3 images, including at least one with natural resolution larger than 1000px in either dimension (e.g. a phone photo). Expected:
- Drop zone shrinks to the compact "+ Agregar más" pill.
- Each image renders as a card with a thumbnail capped to a fixed height — confirm NO card/thumbnail exceeds roughly 220px tall regardless of the uploaded image's actual resolution (this is the core bug fix — open browser dev tools and check the `.image-card-thumb` element's rendered height if unsure).
- Cards are arranged in a grid — resize the browser window narrow (under ~500px) and confirm cards stack to a single column; widen it and confirm 2-3+ columns appear.

- [ ] **Step 4: Color picking**

Hover/click on an image card's canvas. Expected: the `color-readout` box above the grid updates to show the `rgb(...)` value and uses it as its own background color.

- [ ] **Step 5: Remove Background + Download All**

Click "Quitar fondo". Expected: all uploaded image thumbnails update to show transparency (checkerboard) where the background was removed, and a small green checkmark badge appears on each processed card. Click "Descargar todo", confirm a `images.zip` downloads. Unzip it and confirm the file dimensions match each original image's natural resolution (not the capped preview size) — this validates `getCanvas()` still returns the full-resolution canvas, unaffected by Task 2's preview changes.

- [ ] **Step 6: Console check**

Open browser dev tools console. Expected: no errors during any of the above steps.

- [ ] **Step 7: Report**

No commit for this task (verification only). If any step fails, fix the specific issue in the relevant earlier task's file and re-run this task's steps from the top.
