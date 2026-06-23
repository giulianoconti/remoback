import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export const ImageCard = forwardRef(function ImageCard({ originalURL, name, onPixelPick, widthCanvasImg, processed }, ref) {
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
    if (imgRef.current && !processed) drawAtWidth(widthCanvasImg);
  }, [widthCanvasImg, processed]);

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
    getCanvas: () => canvasRef.current,
  }));

  const getPixel = (e) => {
    const canvas = canvasRef.current;
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
      <canvas ref={canvasRef} className="mouse-crosshair" onMouseMove={getPixel} />
      <h4 className="text-white text-center" style={{ fontSize: "12px" }}>
        {name}
      </h4>
    </div>
  );
});
