export const ChooseColorColorItem = ({ removeWhatColor1, removeWhatColor2, removeWhatColor3 }) => {
  return <div className="color-swatch" style={{ backgroundColor: "rgb(" + removeWhatColor1 + "," + removeWhatColor2 + "," + removeWhatColor3 + ")" }} />;
};
