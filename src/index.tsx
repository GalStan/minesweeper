import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import CoordinatesInput from "./components/CoordinatesInput";
import styles from "./index.module.css";
import Solver from "./Solver";

const solver = new Solver(new WebSocket("wss://hometask.eg1236.com/game1/"));

const App = () => {
  const [map, setMap] = useState("");

  const [gameLost, setGameLost] = useState(false);

  const [winMessage, setWinMessage] = useState<string>();

  const [solving, setSolving] = useState(false);

  useEffect(() => {
    solver.onMapUpdated = setMap;
    solver.onGameLost = () => {
      setGameLost(true);
      setSolving(false);
    };
    solver.onGameWin = (message) => {
      setWinMessage(message);
      setSolving(false);
    };
  }, []);

  const mapForRender = useMemo(
    () =>
      map.split("\n").map((raw, index) => (
        <span key={index}>
          {raw}
          <br />
        </span>
      )),
    [map]
  );

  const handleNewGame = (difficulty: number) => {
    solver.startGame(difficulty);
    setGameLost(false);
    setWinMessage("");
  };

  return (
    <main className={styles.appWrapper}>
      <h1>Minesweeper</h1>

      <div>
        <button onClick={() => handleNewGame(1)}>New game 1</button>
        <button onClick={() => handleNewGame(2)}>New game 2</button>
        <button onClick={() => handleNewGame(3)}>New game 3</button>
        <button onClick={() => handleNewGame(4)}>New game 4</button>
        <button onClick={() => solver.makeStep()}>Make step</button>
        <button
          onClick={() => {
            solver.setAutosolve();
            setSolving(true);
          }}
        >
          Auto solve
        </button>
      </div>
      {gameLost && <h2>Game lost :(</h2>}
      {winMessage && <h2>{winMessage}</h2>}
      {solving && <h2>Solving ...</h2>}
      <CoordinatesInput onCoordinatesPick={solver.openCoords.bind(solver)} />
      <div className={styles.mapWrapper}>
        <div className={styles.map}>{mapForRender}</div>
      </div>
    </main>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
