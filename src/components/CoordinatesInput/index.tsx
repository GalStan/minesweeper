import React, { FC, useState } from "react";
import { CoordinatesInputProps } from "./types";
import styles from "./CoordinatesInput.module.css";

const CoordinatesInput: FC<CoordinatesInputProps> = ({ onCoordinatesPick }) => {
  const [coordinates, setCoordinates] = useState({ x: "", y: "" });
  return (
    <div>
      <h2>Pick coordinates</h2>
      <input
        value={coordinates.x}
        className={styles.coordinateInput}
        onChange={(event) => {
          setCoordinates((prev) => ({ ...prev, x: event.target.value }));
        }}
      />
      <input
        value={coordinates.y}
        className={styles.coordinateInput}
        onChange={(event) => {
          setCoordinates((prev) => ({ ...prev, y: event.target.value }));
        }}
      />
      <button
        onClick={() => {
          onCoordinatesPick(coordinates.x, coordinates.y);
          setCoordinates({ x: "", y: "" });
        }}
      >
        pick
      </button>
    </div>
  );
};

export default CoordinatesInput;
