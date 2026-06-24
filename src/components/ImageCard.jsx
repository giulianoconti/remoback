import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const MAX_PREVIEW_DIMENSION = 800;

export const ImageCard = forwardRef(function ImageCard({ originalURL, name, onPixelPick, processed }, ref) {
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
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
