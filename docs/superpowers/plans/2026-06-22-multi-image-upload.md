# Multi-image upload, bulk remove background, zip download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let user upload many images at once, apply one shared color-range removal to all of them, download all results as a single zip.

**Architecture:** Replace the single `image`/`imgRef`/`canvasImgRef`/`canvasRef` state in `src/App.jsx` with an `images` array (one entry per uploaded file) rendered as a grid of cards, each with its own original+processed canvas pair tracked via a ref map. The existing per-pixel alpha-zeroing algorithm is unchanged — it now runs in a loop over all images. Download switches from single `canvas.toDataURL()` + anchor click to building a zip (via `jszip`) containing one image per canvas.

**Tech Stack:** React 18, Vite, plain `<canvas>` 2D context pixel manipulation, `jszip` (new dependency).

**No test framework exists in this project** (no jest/vitest configured, `package.json` has no test script). This is a small canvas-heavy UI app — automated tests for canvas pixel manipulation would require jsdom canvas mocking infrastructure that doesn't exist and isn't worth introducing for this change. Each task instead has a **manual verification step**: run `npm run dev`, open the page, and check specific behavior in the browser. This is a deliberate deviation from TDD because no test harness exists to TDD against.

---

## Current code being replaced

`src/App.jsx` currently has (for reference while editing):

- State: `imgRef`, `canvasRef`, `canvasImgRef` (all single refs), `image`, `saveFileURL`, `showDownloadButton` (all single values)
- `showFile(file)` — takes one `File`, FileReader → `setImage`/`setSaveFileURL`, calls `loadImageInCanvas`
- `loadImageInCanvas(fileURL)` — draws into `canvasImgRef.current`, sized off `imgRef.current.naturalWidth/Height`
- `getPixel(e)` — reads pixel under cursor from `canvasImgRef.current`
- `removeBackground()` — draws `imgRef.current` into `canvasRef.current`, zeroes alpha of matching pixels
- `downloadImage()` — `canvasRef.current.toDataURL()` + anchor click
- JSX renders one drop area, one `<img className="invisible">`, one preview `<canvas>`, one output `<canvas>`, one Download button

All of this is being replaced by the array-based version below. `ChooseColorRangeItem`, `ChooseColorColorItem`, `Footer`, `useWindowDimensions`, and the color-range state (`removeWhatColor`, `changeColor`) are **unchanged**.

---

### Task 1: Add jszip dependency

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install jszip**

Run: `npm install jszip`

Expected: `package.json` `dependencies` gains `"jszip": "^3.x.x"`, `node_modules/jszip` exists.

- [ ] **Step 2: Verify import works**

Run: `node -e "require('jszip'); console.log('ok')"`

Expected output: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add jszip dependency for multi-image zip download"
```

---

### Task 2: Create ImageCard component (one card per uploaded image)

**Files:**

- Create: `src/components/ImageCard.jsx`

This component owns the two canvases (original preview + processed output) for a single image, mirroring what `App.jsx` currently does for the one global image. It exposes its canvas via a ref so `App.jsx` can run the removal algorithm and the zip export against it.

- [ ] **Step 1: Write the component**

```jsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export const ImageCard = forwardRef(function ImageCard({ originalURL, name, onPixelPick, widthCanvasImg }, ref) {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = originalURL;
    img.onload = () => {
      imgRef.current = img;
      drawAtWidth(widthCanvasImg);
    };
  }, [originalURL]);

  useEffect(() => {
    if (imgRef.current) drawAtWidth(widthCanvasImg);
  }, [widthCanvasImg]);

  const drawAtWidth = (targetWidth) => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const useWidth = img.naturalWidth >= targetWidth ? targetWidth : img.naturalWidth;
    const useHeight = (img.naturalHeight / img.naturalWidth) * useWidth;
    canvas.width = useWidth;
    canvas.height = useHeight;
    ctx.drawImage(img, 0, 0, useWidth, useHeight);
  };

  useImperativeHandle(ref, () => ({
    getNaturalImage: () => imgRef.current,
    getCanvas: () => canvasRef.current,
  }));

  const getPixel = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    const data = ctx.getImageData(x, y, 1, 1).data;
    onPixelPick(`rgb(${data[0]}, ${data[1]}, ${data[2]})`);
  };

  return (
    <div className="bg-transparent-img p-5 m-5" style={{ display: "inline-block" }}>
      <canvas ref={canvasRef} className="mouse-crosshair" onMouseMove={getPixel} />
      <h4 className="text-white text-center" style={{ fontSize: "12px" }}>
        {name}
      </h4>
    </div>
  );
});
```

Delete the placeholder `forwardRefWorkaround` lines — the final file is only the second code block (imports + `ImageCard` export).

- [ ] **Step 2: Manual check — file is syntactically valid**

Run: `npx vite build` (will fail later since `App.jsx` doesn't use it yet — that's expected; this step is just confirming no syntax error in the new file)

Expected: build error, if any, references `App.jsx`/unused-export concerns only, not a syntax error inside `ImageCard.jsx`. If it references a syntax error in `ImageCard.jsx`, fix it before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/components/ImageCard.jsx
git commit -m "Add ImageCard component for per-image canvas rendering"
```

---

### Task 3: Replace single-image state with images array in App.jsx

**Files:**

- Modify: `src/App.jsx:1-39` (imports, state, the `widthWindow` effect)

- [ ] **Step 1: Replace imports and refs/state**

Replace lines 1-29 of `src/App.jsx`:

```jsx
import { useEffect } from "react";
import { useRef, useState } from "react";
import { ChooseColorColorItem } from "./components/ChooseColorColorItem";
import { ChooseColorRangeItem } from "./components/ChooseColorRangeItem";
import { Footer } from "./components/Footer";
import { useWindowDimensions } from "./hooks/useWindowDimensions";

export const App = () => {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const dropAreaRef = useRef(null);
  const canvasImgRef = useRef(null);
  const [colorMouseMove, setColorMouseMove] = useState(null);
  const [stopGetPixel, setStopGetPixel] = useState(true);
  const [image, setImage] = useState(null);
  const [textDropAreaRef, setTextDropAreaRef] = useState("Drag & Drop To Upload File");
  const [removeWhatColor, setRemoveWhatColor] = useState({
    red1: 240,
    green1: 240,
    blue1: 240,
    red2: 255,
    green2: 255,
    blue2: 255,
  });
  const [widthCanvasImg, setWidthCanvasImg] = useState(530);
  const [saveFileURL, setSaveFileURL] = useState("");
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [fileType, setFileType] = useState("png");
  const { widthWindow } = useWindowDimensions();
```

with:

```jsx
import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { ChooseColorColorItem } from "./components/ChooseColorColorItem";
import { ChooseColorRangeItem } from "./components/ChooseColorRangeItem";
import { Footer } from "./components/Footer";
import { ImageCard } from "./components/ImageCard";
import { useWindowDimensions } from "./hooks/useWindowDimensions";

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
  const [widthCanvasImg, setWidthCanvasImg] = useState(530);
  const [fileType, setFileType] = useState("png");
  const { widthWindow } = useWindowDimensions();
```

Note: `stopGetPixel` and `showDownloadButton` are removed (`stopGetPixel` toggle behavior is dropped — pixel picking is always live, matching the simpler per-card hover-to-preview pattern; `showDownloadButton` becomes a derived value, added in Task 6).

- [ ] **Step 2: Replace the `widthWindow` resize effect**

Replace lines 31-39:

```jsx
useEffect(() => {
  if (widthWindow < 530) {
    setWidthCanvasImg(widthWindow - 1);
    loadImageInCanvas(saveFileURL);
  } else if (widthWindow >= 530 && widthWindow < 560) {
    setWidthCanvasImg(530);
    loadImageInCanvas(saveFileURL);
  }
}, [widthWindow]);
```

with:

```jsx
useEffect(() => {
  if (widthWindow < 530) {
    setWidthCanvasImg(widthWindow - 1);
  } else if (widthWindow >= 530 && widthWindow < 560) {
    setWidthCanvasImg(530);
  }
}, [widthWindow]);
```

(`ImageCard` redraws itself when `widthCanvasImg` changes via its own effect — see Task 2 — so `App.jsx` no longer calls `loadImageInCanvas` directly.)

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open the printed localhost URL.

Expected: page renders without a red error overlay (the rest of `App.jsx` still references old functions/JSX at this point, so a build error is expected if you check the terminal — that's fixed in the next tasks). This step is just confirming the state/import block itself has no typo. If Vite's overlay shows an error mentioning `image is not defined`, `imgRef is not defined`, etc., that's expected and will be resolved by Task 4.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "Replace single-image state with images array"
```

---

### Task 4: Multi-file upload (drag&drop + browse) and per-image FileReader loading

**Files:**

- Modify: `src/App.jsx` (the `dragOver`/`dragLeave`/`fileDrop`/`browseFile`/`showFile`/`loadImageInCanvas` block, originally lines 41-110)

- [ ] **Step 1: Replace upload handlers**

Replace the block from `// ----- Drag & Drop Image -----` through the end of `loadImageInCanvas` (originally lines 41-110) with:

```jsx
// ----- Drag & Drop Image -----
const dragOver = (e) => {
  e.preventDefault();
  dropAreaRef.current.style.background = "rgb(150, 50, 150)";
  setTextDropAreaRef("Drop Image");
};
const dragLeave = (e) => {
  e.preventDefault();
  dropAreaRef.current.style.background = "linear-gradient(rgb(50, 50, 50), rgb(150, 50, 150))";
  setTextDropAreaRef("Drag & Drop To Upload File");
};
const fileDrop = (e) => {
  e.preventDefault();
  dropAreaRef.current.style.background = "linear-gradient(rgb(50, 50, 50), rgb(150, 50, 150))";
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
```

- [ ] **Step 2: Update the `<input>` to accept multiple files**

Find in the JSX (originally around line 193):

```jsx
<input className="d-none" onChange={browseFile} type="file" placeholder="hola" />
```

Replace with:

```jsx
<input className="d-none" onChange={browseFile} type="file" multiple accept="image/*" />
```

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open the page, click "Browse File", select 3 different images at once (multi-select in the OS file picker).

Expected: no crash; we'll visually confirm the cards render in Task 5 once the grid JSX is in place. For now confirm in the browser dev console there are no errors after selecting files.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "Support selecting/dropping multiple image files at once"
```

---

### Task 5: Render the image grid and run pixel picking through ImageCard

**Files:**

- Modify: `src/App.jsx` (the `getPixel`/`changeColor` block and the main JSX return, originally lines 112-231)

- [ ] **Step 1: Remove the old `getPixel` function**

Delete this block (originally lines 112-128) — pixel picking now lives inside `ImageCard` (Task 2) and is wired via the `onPixelPick` prop:

```jsx
const getPixel = (e) => {
  if (!stopGetPixel) {
    const canvas = canvasImgRef.current;
    const ctx = canvas.getContext("2d");
    const { clientX, clientY } = e;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(clientX - rect.left);
    const y = Math.floor(clientY - rect.top);
    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    const red = data[0];
    const green = data[1];
    const blue = data[2];
    const color = `rgb(${red}, ${green}, ${blue})`;
    setColorMouseMove(color);
  }
};
```

Keep `changeColor` (originally lines 130-138) exactly as-is — unchanged.

Also delete `const handleStopGetPixel = () => setStopGetPixel(!stopGetPixel);` (originally line 182) — no longer needed.

- [ ] **Step 2: Replace the image-display JSX block**

Replace the block from `<div className="bg-transparent-img">` through its closing `</div>` (originally lines 199-213):

```jsx
<div className="bg-transparent-img">
  <img className="invisible" ref={imgRef} src={image} />
  <canvas
    className="flex mx-auto mouse-crosshair mb-10"
    width={widthCanvasImg}
    height={0}
    ref={canvasImgRef}
    onClick={handleStopGetPixel}
    onMouseMove={getPixel}
  ></canvas>
  <h3 className="text-center mx-auto text-shadow py-5" style={{ backgroundColor: `${colorMouseMove ? colorMouseMove : "rgba(255, 255, 255)"}` }}>
    {colorMouseMove ? colorMouseMove : "Click on the image to get the color"}
  </h3>
  <canvas className="max-w-full flex mx-auto py-10" height={0} ref={canvasRef}></canvas>
</div>
```

with:

```jsx
<div className="bg-transparent-img">
  <h3 className="text-center mx-auto text-shadow py-5" style={{ backgroundColor: `${colorMouseMove ? colorMouseMove : "rgba(255, 255, 255)"}` }}>
    {colorMouseMove ? colorMouseMove : "Click on the image to get the color"}
  </h3>
  <div className="flex flex-wrap justify-center">
    {images.map((image) => (
      <ImageCard
        key={image.id}
        ref={(el) => (cardRefs.current[image.id] = el)}
        originalURL={image.originalURL}
        name={image.name}
        widthCanvasImg={widthCanvasImg}
        onPixelPick={setColorMouseMove}
      />
    ))}
  </div>
</div>
```

- [ ] **Step 3: Manual check**

Run: `npm run dev`, drop or browse-select 2-3 images.

Expected: each image renders as its own canvas card in a wrapping row. Hovering over a card's canvas updates the color readout text above the grid to the `rgb(...)` under the cursor for that specific image.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "Render uploaded images as a grid of ImageCard canvases"
```

---

### Task 6: Bulk Remove Background

**Files:**

- Modify: `src/App.jsx` (the `removeBackground` function, originally lines 140-167, and the button JSX, originally lines 233-249)

- [ ] **Step 1: Replace `removeBackground` with a loop over all images**

Replace the block (originally lines 140-167):

```jsx
// ----- Remove Background Button -----
const removeBackground = () => {
  const img = imgRef.current;
  const canvas = canvasRef.current;
  if (img.src) {
    canvas.width = imgRef.current.naturalWidth;
    canvas.height = imgRef.current.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, imgRef.current.naturalWidth, imgRef.current.naturalHeight);
    const imageData = ctx.getImageData(0, 0, imgRef.current.naturalWidth, imgRef.current.naturalHeight);
    const data = imageData.data;
    const newColor = { r: 0, g: 0, b: 0, a: 0 };
    for (let i = 0; i < data.length; i += 4) {
      if (
        data[i] >= removeWhatColor.red1 &&
        data[i] <= removeWhatColor.red2 &&
        data[i + 1] >= removeWhatColor.green1 &&
        data[i + 1] <= removeWhatColor.green2 &&
        data[i + 2] >= removeWhatColor.blue1 &&
        data[i + 2] <= removeWhatColor.blue2
      ) {
        data[i + 3] = newColor.a;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    setShowDownloadButton(true);
  }
};
```

with:

```jsx
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
  images.forEach((image) => {
    const card = cardRefs.current[image.id];
    if (!card) return;
    removeBackgroundFromCanvas(card.getCanvas());
  });
  setImages((prev) => prev.map((image) => ({ ...image, processed: true })));
};
```

Note: this runs against each card's already-rendered preview canvas (sized to `widthCanvasImg`, not full natural resolution) — same display-resolution behavior the grid already shows. This is a deliberate simplification: the original single-image flow processed the full natural-resolution image in a separate hidden canvas; processing the visible (possibly downscaled) canvas directly keeps the multi-image version simple and is consistent across all cards. Downscaling only happens when `naturalWidth >= widthCanvasImg` (per `ImageCard`'s `drawAtWidth`), so most images are unaffected.

- [ ] **Step 2: Manual check**

Run: `npm run dev`, upload 2-3 images with a solid-color background close to the default 240-255 white range, click "Remove Background".

Expected: all visible canvases update — background pixels become transparent (checkerboard pattern shows through, from the `bg-transparent-img` CSS) on every uploaded image, not just one.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "Apply background removal to every uploaded image"
```

---

### Task 7: Download All as zip

**Files:**

- Modify: `src/App.jsx` (the `downloadImage`/`downloadImageWith` block, originally lines 169-180, and the button row JSX, originally lines 233-249)

- [ ] **Step 1: Replace download functions**

Replace:

```jsx
// ----- Download Image Button-----
const downloadImage = () => {
  const canvas = canvasRef.current;
  const link = document.createElement("a");
  link.download = imgRef.current.name + "." + fileType;
  link.href = canvas.toDataURL("image/" + fileType);
  link.click();
};

const downloadImageWith = (e) => {
  setFileType(e.target.value);
};
```

with:

```jsx
// ----- Download All Button -----
const downloadAll = async () => {
  const zip = new JSZip();
  for (const image of images) {
    const card = cardRefs.current[image.id];
    if (!card) continue;
    const canvas = card.getCanvas();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/" + fileType));
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
```

- [ ] **Step 2: Update the button row JSX**

Replace (originally lines 233-249):

```jsx
<div className="flex bg-rgb-50-50-50">
  <button className="btn" onClick={removeBackground}>
    Remove Background
  </button>
  {showDownloadButton && (
    <>
      <button className="btn" onClick={downloadImage}>
        Download Image
      </button>
      <select className="btn" onChange={downloadImageWith}>
        <option value="png">Png</option>
        <option value="webp">Webp</option>
        <option value="jpg">Jpg</option>
      </select>
    </>
  )}
</div>
```

with:

```jsx
<div className="flex bg-rgb-50-50-50">
  <button className="btn" onClick={removeBackground}>
    Remove Background
  </button>
  {images.some((image) => image.processed) && (
    <>
      <button className="btn" onClick={downloadAll}>
        Download All
      </button>
      <select className="btn" onChange={downloadImageWith}>
        <option value="png">Png</option>
        <option value="webp">Webp</option>
        <option value="jpg">Jpg</option>
      </select>
    </>
  )}
</div>
```

- [ ] **Step 3: Manual check**

Run: `npm run dev`, upload 3 images, click "Remove Background", then "Download All".

Expected: a single `images.zip` downloads. Unzip it and confirm it contains 3 files named `<original-name>.png`, each with the background removed (transparent PNG opens showing checkerboard where background was).

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "Replace single-image download with zip of all processed images"
```

---

### Task 8: Final cleanup pass

**Files:**

- Modify: `src/App.jsx`

- [ ] **Step 1: Search for now-dead references**

Run: `grep -n "imgRef\|canvasImgRef\|canvasRef\b\|setImage\b\|saveFileURL\|showDownloadButton\|stopGetPixel\|loadImageInCanvas" src/App.jsx`

Expected: no output (all of these were removed in Tasks 3-7). If anything matches, remove the leftover reference.

- [ ] **Step 2: Full manual run-through**

Run: `npm run dev`. In the browser:

1. Drag-and-drop 2 images, then browse-select 1 more image (total 3).
2. Hover over each canvas, confirm color readout changes per-image.
3. Adjust the red/green/blue min-max sliders.
4. Click "Remove Background" — confirm all 3 canvases show transparency where background matched.
5. Switch the format `<select>` to `webp`.
6. Click "Download All" — confirm `images.zip` downloads containing 3 `.webp` files.
7. Resize the browser window below 530px wide — confirm canvases resize without crashing.

Expected: all 7 steps work with no console errors.

- [ ] **Step 3: Commit (only if cleanup step 1 found something to fix)**

```bash
git add src/App.jsx
git commit -m "Remove dead single-image refs left over from multi-image refactor"
```
