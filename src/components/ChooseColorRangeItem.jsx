export const ChooseColorRangeItem = ({ colorName, name, value, onChange }) => {
  return (
    <li className="style-type-none">
      <div className="flex align-items-center">
        <h5 className={`bg-${colorName} border-radius-5 py-5 w-full mr-10`}>{colorName}</h5>
        <input className="border-radius-5 outline-none py-5 w-full focus_outline-black text-center" name={name} value={value} onChange={onChange} />
      </div>
      <input className={`bg-${colorName} input-range mb-20`} type="range" name={name} min="0" max="255" value={value} onChange={onChange} />
    </li>
  );
};
