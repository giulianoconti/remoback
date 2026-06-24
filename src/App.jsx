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

  const readoutTextColor = (rgb) => {
    if (!rgb) return undefined;
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? "#1f2330" : "#ffffff";
  };

  return (
    <div className="app-shell">
      <div className="app-container">
        <div className={`dropzone unselectable${hasImages ? " dropzone-compact" : ""}`} ref={dropAreaRef} onDragOver={dragOver} onDragLeave={dragLeave} onDrop={fileDrop}>
          {!hasImages && <div className="dropzone-icon" />}
          {!hasImages && <div className="dropzone-title">{textDropAreaRef}</div>}
          {!hasImages && <div className="dropzone-sub">or choose a file</div>}
          <label>
            <input className="d-none" onChange={browseFile} type="file" multiple accept="image/*" />
            <span className={hasImages ? "btn-add-more" : "btn-browse"}>{hasImages ? "+ Add more" : "Browse File"}</span>
          </label>
        </div>

        {hasImages && (
          <div className="image-section">
            <div className="color-readout" style={{ backgroundColor: colorMouseMove || "#ffffff", color: readoutTextColor(colorMouseMove) }}>
              {colorMouseMove || "Tap an image to see its color"}
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
            Remove Background
          </button>
          {images.some((image) => image.processed) && (
            <>
              <button className="btn btn-secondary" onClick={downloadAll}>
                Download All
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
