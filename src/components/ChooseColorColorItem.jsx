export const ChooseColorColorItem = ({ margin, removeWhatColor1, removeWhatColor2, removeWhatColor3 }) => {
  return (
    <div
      className={`w-50 m${margin}-10 border-t-2 border-b-2 border-${margin}-2`}
      style={{ backgroundColor: "rgb(" + removeWhatColor1 + "," + removeWhatColor2 + "," + removeWhatColor3 + ")" }}
    />
  );
};
