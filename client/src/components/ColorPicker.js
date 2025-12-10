import { HexColorPicker } from "react-colorful";
import { useState } from "react";
import s from "./ColorPicker.module.css";

export default function ColorPicker() {
  const [color, setColor] = useState("#38BDF8");
  const [open, setOpen] = useState(false);

  return (
    <div className={s.container}>
        <div className={s.picker}>
          <HexColorPicker color={color} onChange={setColor}/>
          <input className={s.hexInput} type="text" value={color}/>
        </div>

    </div>
  );
}
