# Multi-image upload, bulk remove background, zip download

## Goal

Let user upload many images at once, apply same color-range removal to all, download all results as a single zip.

## Current state (single image)

`src/App.jsx` holds one `image` (data URL), one `imgRef`/`canvasImgRef` (original preview) and one `canvasRef` (processed output). `removeBackground()` reads pixels from `canvasRef`, zeroes alpha for pixels inside the chosen RGB range, writes back. `downloadImage()` does `canvas.toDataURL` + anchor click.

## Changes

### State shape

Replace `image` (single) with `images`: array of
```js
{ id, file, name, originalURL, processed }
```
`id` = crypto.randomUUID() or incrementing counter. `name` = filename without extension (used for download name). `processed` = bool, true after Remove Background ran on that image.

Each grid item renders its own `<canvas>` via a ref callback stored in a `canvasRefs` map (`{ [id]: HTMLCanvasElement }`) — refs can't be array state, use a `Map`/object kept in a `useRef`.

`colorMouseMove` stays as single global value — shows color of whichever canvas was last clicked, same as today.

### Upload (drag&drop + browse)

`fileDrop`/`browseFile` iterate over `e.dataTransfer.files` / `e.target.files` (FileList), validate each against the existing `validExtensions` list, build one `images` entry per valid file via FileReader, append to existing `images` array (don't replace). Invalid files in the batch are skipped silently (existing behavior for single invalid file was also silent no-op).

Uploading a single file is just the N=1 case of the same code path — no special-casing needed.

### Rendering

Grid of cards (CSS grid, wraps responsively), one per image:
- `<canvas>` showing original (or processed result once `processed` true) — reuse existing `loadImageInCanvas` logic per-canvas
- click handler same as today: get pixel color under cursor, set `colorMouseMove`
- filename label

Color-range pickers (`ChooseColorRangeItem` / `ChooseColorColorItem`) stay exactly as-is, single global panel, unchanged.

### Remove Background button

`removeBackground()` becomes a loop: for each image in `images`, run the existing per-canvas pixel-scan/alpha-zero algorithm against that image's canvas, then mark `processed: true`. Same RGB range (`removeWhatColor` state) applied to every image — no per-image override.

### Download All

Replace `downloadImage()` with `downloadAll()`:
1. For each image, `canvas.toBlob()` (format from existing `fileType` state: png/webp/jpg) to get a Blob.
2. `JSZip` instance, `zip.file(`${name}-RemovedBG.${fileType}`, blob)` per image.
3. `zip.generateAsync({type: "blob"})`, then anchor-click download as `images.zip`.

New dependency: `jszip`.

Download button only enabled once at least one image has `processed === true` (mirrors current `showDownloadButton` gate, now `images.some(i => i.processed)`).

### Out of scope

- Per-image color range overrides
- Removing/reordering individual images from the grid before processing
- Progress indicator for large batches (no upper bound enforced, but no spinner/progress UI either)
