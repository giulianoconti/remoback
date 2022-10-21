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

  useEffect(() => {
    if (widthWindow < 530) {
      setWidthCanvasImg(widthWindow - 1);
      loadImageInCanvas(saveFileURL);
    } else if (widthWindow >= 530 && widthWindow < 560) {
      setWidthCanvasImg(530);
      loadImageInCanvas(saveFileURL);
    }
  }, [widthWindow]);

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
    showFile(e.dataTransfer.files[0]);
  };

  // ----- Browse File Button -----
  const browseFile = (e) => {
    e.preventDefault();
    showFile(e.target.files[0]);
  };

  // ----- Show The File When They Drop The Image Or Select With The Button -----
  const showFile = (file) => {
    setShowDownloadButton(false);
    imgRef.current.name = file.name.split(".")[0];
    const fileType = file.type;
    const validExtensions = [
      "image/apng",
      "image/avif",
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "image/webp",
      "image/bmp",
      "image/x-icon",
      "image/tiff",
    ];
    if (validExtensions.includes(fileType)) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const fileURL = fileReader.result;
        setSaveFileURL(fileURL);
        setImage(fileURL);
        loadImageInCanvas(fileURL);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const loadImageInCanvas = (fileURL) => {
    const canvasOriginalImg = canvasImgRef.current;
    const ctx = canvasOriginalImg.getContext("2d");
    const img = new Image();
    img.src = fileURL;
    img.onload = () => {
      if (imgRef.current.naturalWidth >= 530) {
        canvasOriginalImg.width = widthCanvasImg;
        canvasOriginalImg.height = (imgRef.current.naturalHeight / imgRef.current.naturalWidth) * widthCanvasImg;
        ctx.drawImage(img, 0, 0, widthCanvasImg, (imgRef.current.naturalHeight / imgRef.current.naturalWidth) * widthCanvasImg);
      } else {
        canvasOriginalImg.width = imgRef.current.naturalWidth;
        canvasOriginalImg.height = imgRef.current.naturalHeight;
        ctx.drawImage(img, 0, 0, imgRef.current.naturalWidth, imgRef.current.naturalHeight);
      }
    };
  };

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

  // ----- Download Image Button-----
  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = imgRef.current.name + "-RemovedBG." + fileType;
    link.href = canvas.toDataURL("image/" + fileType);
    link.click();
  };

  const downloadImageWith = (e) => {
    setFileType(e.target.value);
  };

  const handleStopGetPixel = () => setStopGetPixel(!stopGetPixel);

  return (
    <div className="bg-rgb-170-190-210 flex justify-center align-items-center flex-column">
      <div className="w-full max-w-530 outline-5 bg-rgb-50-50-50 border-radius-5 mt-10">
        <div className="bg-linear-black-violet p-10 text-center unselectable" ref={dropAreaRef} onDragOver={dragOver} onDragLeave={dragLeave} onDrop={fileDrop}>
          <div className="w-50 mx-auto mb-10">
            <div className="upload-file" />
            <h3 className="text-white">{textDropAreaRef}</h3>
            <h3 className="text-white mb-10">Or</h3>
            <label>
              <input className="d-none" onChange={browseFile} type="file" placeholder="hola" />
              <span className="btn">Browse File</span>
            </label>
          </div>
        </div>

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

        <div className="flex flex-column bg-rgb-50-50-50 p-10 text-white text-center">
          <h3 className="mb-10">Choose color range you want to remove</h3>
          <div className="flex justify-center">
            <ul className="w-full">
              <ChooseColorRangeItem colorName={"Red"} name={"red1"} value={removeWhatColor.red1} onChange={changeColor} />
              <ChooseColorRangeItem colorName={"Green"} name={"green1"} value={removeWhatColor.green1} onChange={changeColor} />
              <ChooseColorRangeItem colorName={"Blue"} name={"blue1"} value={removeWhatColor.blue1} onChange={changeColor} />
            </ul>
            <ChooseColorColorItem margin="l" removeWhatColor1={removeWhatColor.red1} removeWhatColor2={removeWhatColor.green1} removeWhatColor3={removeWhatColor.blue1} />
            <ChooseColorColorItem margin="r" removeWhatColor1={removeWhatColor.red2} removeWhatColor2={removeWhatColor.green2} removeWhatColor3={removeWhatColor.blue2} />
            <ul className="w-full">
              <ChooseColorRangeItem colorName={"Red"} name={"red2"} value={removeWhatColor.red2} onChange={changeColor} />
              <ChooseColorRangeItem colorName={"Green"} name={"green2"} value={removeWhatColor.green2} onChange={changeColor} />
              <ChooseColorRangeItem colorName={"Blue"} name={"blue2"} value={removeWhatColor.blue2} onChange={changeColor} />
            </ul>
          </div>
        </div>

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
      </div>
      <Footer />
    </div>
  );
};
