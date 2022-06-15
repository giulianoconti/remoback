import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

export const App = () => {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [widthCanvas, setwidthCanvas] = useState(0);
  const [heightCanvas, setheightCanvas] = useState(0);
  const [files, setFiles] = useState([]);
  const [removeWhatColor, setRemoveWhatColor] = useState({
    red1: 240,
    green1: 240,
    blue1: 240,

    red2: 255,
    green2: 255,
    blue2: 255,
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    },
  });

  const images = files.map((file) => {
    return (
      <div key={file.name}>
        <img id={file.name.split(".")[0]} className="img" ref={imgRef} src={file.preview} alt="preview" />
      </div>
    );
  });

  const handleClick = () => {
    setwidthCanvas(imgRef.current.naturalWidth);
    setheightCanvas(imgRef.current.naturalHeight);
    setTimeout(() => {
      removeBackground();
    }, 10);
  };

  const removeBackground = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (img && canvas) {
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = imgRef.current.id + "-RemovedBG.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const changeColor = (e) => {
    console.log([e.target.name]);
    console.log(e.target.value);
    setRemoveWhatColor({
      ...removeWhatColor,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container mt-1">
      <div className="container-items border bg-app">
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <div className="drag-drop">
            <div className="uploadFile"/>
            <h3>Drag & Drop To Upload File -  Drop To Upload File Drop To Upload File</h3>
            <h3>Or</h3>
            <h3>Browse File</h3>
          </div>
        </div>

        <div className="container-items">
          {images}
          <canvas className="canvas" ref={canvasRef} width={`${widthCanvas}px`} height={`${heightCanvas}px`}></canvas>
        </div>

        <h3 className="title-inputs">Choose color range you want to remove</h3>
        <div className="inputs flex">
          <div>
            <h5 className="colors">Red</h5>
            <input className="input" name="red1" value={removeWhatColor.red1} onChange={changeColor} />
            <h5 className="colors">Green</h5>
            <input className="input" name="green1" value={removeWhatColor.green1} onChange={changeColor} />
            <h5 className="colors">Blue</h5>
            <input className="input" name="blue1" value={removeWhatColor.blue1} onChange={changeColor} />
          </div>
          <div>
            <div className="flex">
              <div
                style={{
                  marginLeft: "10px",
                  width: "50px",
                  height: "165px",
                  backgroundColor: "rgb(" + removeWhatColor.red1 + "," + removeWhatColor.green1 + "," + removeWhatColor.blue1 + ")",
                }}
              />

              <div
                style={{
                  marginRight: "10px",
                  width: "50px",
                  height: "165px",
                  backgroundColor: "rgb(" + removeWhatColor.red2 + "," + removeWhatColor.green2 + "," + removeWhatColor.blue2 + ")",
                }}
              />
            </div>
          </div>
          <div>
            <h5 className="colors">Red</h5>
            <input className="input" name="red2" value={removeWhatColor.red2} onChange={changeColor} />
            <h5 className="colors">Green</h5>
            <input className="input" name="green2" value={removeWhatColor.green2} onChange={changeColor} />
            <h5 className="colors">Blue</h5>
            <input className="input" name="blue2" value={removeWhatColor.blue2} onChange={changeColor} />
          </div>
        </div>

        <div className="flex">
          <button className="btn" onClick={handleClick}>
            Remove Background
          </button>
          {widthCanvas !== 0 && (
            <button className="btn" onClick={downloadImage}>
              Download Image
            </button>
          )}
        </div>
      </div>

      <footer className="footer">
        <h4>Made by:</h4>
        <a className="linkedin" href="https://www.linkedin.com/in/giulianoconti/" target="_blank">Giuliano Conti</a>
      </footer>
    </div>
  );
};
