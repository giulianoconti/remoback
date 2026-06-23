import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export const ImageCard = forwardRef(function ImageCard({ originalURL, name, onPixelPick, widthCanvasImg }, ref) {
  const imgRef = useRef(null);
  const fullCanvasRef = useRef(null);
  const displayCanvasRef = useRef(null);

  const refreshPreview = (targetWidth) => {
    const fullCanvas = fullCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    const useWidth = fullCanvas.width >= targetWidth ? targetWidth : fullCanvas.width;
    const useHeight = (fullCanvas.height / fullCanvas.width) * useWidth;
    displayCanvas.width = useWidth;
    displayCanvas.height = useHeight;
    displayCanvas.getContext("2d").drawImage(fullCanvas, 0, 0, useWidth, useHeight);
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
      refreshPreview(widthCanvasImg);
    };
  }, [originalURL]);

  useEffect(() => {
    if (imgRef.current) refreshPreview(widthCanvasImg);
  }, [widthCanvasImg]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => fullCanvasRef.current,
    refreshPreview: () => refreshPreview(widthCanvasImg),
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
    <div className="bg-transparent-img p-5 m-5" style={{ display: "inline-block" }}>
      <canvas ref={fullCanvasRef} style={{ display: "none" }} />
      <canvas ref={displayCanvasRef} className="mouse-crosshair" onMouseMove={getPixel} />
      <h4 className="text-white text-center" style={{ fontSize: "12px" }}>
        {name}
      </h4>
    </div>
  );
});
