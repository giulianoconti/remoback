export const ChooseColorRangeItem = ({ colorName, name, value, onChange }) => {
  return (
    <li className="color-range-item">
      <div className="color-range-item-header">
        <span className={`color-range-label bg-${colorName}`}>{colorName}</span>
        <input className="color-range-input" name={name} value={value} onChange={onChange} />
      </div>
      <input className="input-range" type="range" name={name} min="0" max="255" value={value} onChange={onChange} />
    </li>
  );
};
