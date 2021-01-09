import LinkedList from "./LinkedList";
import Cell from "./Cell";
import ListNode from "./ListNode";
import logic from "logicjs";

interface CellWithProbability {
  cell: Cell;
  probability: number;
}

class Solver {
  private socket: WebSocket;
  private rawMap: string;
  private parsedMap: string[][];
  private mapSize: { x: number; y: number };
  private cellsListForAnalyze: LinkedList<Cell>;
  private flaggedCells: Set<string>;
  private autosolve: boolean;
  private gameStarted: boolean;

  public onMapUpdated: ((map: string) => void) | null;
  public onGameLost: (() => void) | null;
  public onGameWin: ((message: string) => void) | null;

  constructor(socket: WebSocket) {
    this.gameStarted = false;
    this.autosolve = false;
    this.socket = socket;
    this.rawMap = "";
    this.parsedMap = [];
    this.mapSize = { x: 0, y: 0 };
    this.flaggedCells = new Set();
    this.cellsListForAnalyze = new LinkedList<Cell>();
    this.onMapUpdated = null;
    this.onGameLost = null;
    this.onGameWin = null;
    socket.onmessage = this.messagesHandler.bind(this);
  }

  public setAutosolve(): void {
    if (this.gameStarted) {
      this.autosolve = true;
      this.makeStep();
    }
  }

  public openCoords(x: string, y: string): void {
    this.socket.send(`open ${x || 0} ${y || 0}`);
    this.uploadMap();
  }

  public startGame(difficulty: number): void {
    this.rawMap = "";
    this.parsedMap = [];
    this.mapSize = { x: 0, y: 0 };
    this.flaggedCells = new Set();
    this.cellsListForAnalyze = new LinkedList<Cell>();
    this.socket.send(`new ${difficulty}`);
    this.openCoords("0", "0");
  }

  public makeStep(): void {
    let noAction = true;
    let noActioNode: ListNode<Cell> | undefined;

    this.computeCellsListForAnalize();

    for (const node of this.cellsListForAnalyze) {
      const cell = node.value;

      const neighbours = this.getNeighbours(cell);

      const flaggedNeighboursCount = this.getNeighbourFlaggedCount(neighbours);

      if (flaggedNeighboursCount === cell.cellValue) {
        for (const neighbour of neighbours) {
          if (
            Number.isNaN(neighbour.cellValue) &&
            !this.isCellFlagged(neighbour)
          ) {
            noAction = false;
            noActioNode = undefined;
            this.openCell(neighbour);
          }
        }
        this.cellsListForAnalyze.removeNode(node);

        continue;
      }

      const closedNeighboursCount = this.getNeighbourClosedCount(neighbours);

      if (closedNeighboursCount === cell.cellValue) {
        for (const neighbour of neighbours) {
          if (Number.isNaN(neighbour.cellValue)) {
            noAction = false;
            noActioNode = undefined;
            this.flagCell(neighbour);
          }
        }
        this.cellsListForAnalyze.removeNode(node);

        continue;
      }

      if (node === noActioNode) {
        break;
      }

      if (noActioNode === undefined) {
        noActioNode = node;
      }
    }

    if (noAction) {
      this.solveByGroups();
    } else {
      this.uploadMap();
    }
  }

  private computeCellsListForAnalize(): void {
    if (this.mapSize) {
      for (let i = 0; i < this.mapSize.y; i++) {
        for (let j = 0; j < this.mapSize.x; j++) {
          const currentCell = +this.parsedMap[i][j];
          if (currentCell) {
            this.cellsListForAnalyze.addNode(
              new ListNode(new Cell({ x: j, y: i }, currentCell))
            );
          }
        }
      }
    }
  }

  private flagCell(cell: Cell): void {
    this.flaggedCells.add(`${cell.coords.x} ${cell.coords.y}`);
  }

  private openCell(cell: Cell): void {
    this.socket.send(`open ${cell.coords.x} ${cell.coords.y}`);
  }

  private messagesHandler(message: MessageEvent): void {
    if (message.data.includes("map")) {
      this.rawMap = message.data.slice(5);
      const parsedMap = this.rawMap.split("\n").map((row) => row.split(""));
      parsedMap.pop();
      this.parsedMap = parsedMap;
      if (!this.mapSize.x) {
        this.mapSize = {
          x: this.parsedMap[0].length,
          y: this.parsedMap.length,
        };
        this.gameStarted = true;
      }
      if (this.onMapUpdated && !this.autosolve) {
        this.onMapUpdated(this.rawMap);
      }
      if (this.autosolve) {
        this.makeStep();
      }
    }

    if (message.data.includes("You lose") && this.onGameLost) {
      this.gameStarted = false;
      this.autosolve = false;
      this.onGameLost();
    }

    if (message.data.includes("You win") && this.onGameWin) {
      this.gameStarted = false;
      this.autosolve = false;
      this.onGameWin(message.data);
    }
  }

  private uploadMap(): void {
    this.socket.send("map");
  }

  private getNeighbourFlaggedCount(neighbours: Cell[]): number {
    return neighbours.reduce((acc, neighbour) => {
      if (this.isCellFlagged(neighbour)) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }

  private getNeighbourClosedCount(neighbours: Cell[]): number {
    return neighbours.reduce((acc, neighbour) => {
      if (Number.isNaN(neighbour.cellValue)) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }

  private getNeighbours(cell: Cell): Cell[] {
    const neighbours: Cell[] = [];
    const startXPoint = cell.coords.x - 1 < 0 ? 0 : cell.coords.x - 1;
    const startYPoint = cell.coords.y - 1 < 0 ? 0 : cell.coords.y - 1;

    const finishXPoint =
      cell.coords.x - 1 < 0
        ? 1
        : startXPoint + 2 > this.mapSize.x - 1
        ? this.mapSize.x - 1
        : startXPoint + 2;

    const finishYPoint =
      cell.coords.y - 1 < 0
        ? 1
        : startYPoint + 2 > this.mapSize.y - 1
        ? this.mapSize.y - 1
        : startYPoint + 2;

    for (let i = startYPoint; i <= finishYPoint; i = i + 1) {
      for (let j = startXPoint; j <= finishXPoint; j = j + 1) {
        if (!(i === cell.coords.y && j === cell.coords.x)) {
          neighbours.push(new Cell({ x: j, y: i }, +this.parsedMap[i][j]));
        }
      }
    }

    return neighbours;
  }

  private isCellFlagged(cell: Cell) {
    return this.flaggedCells.has(`${cell.coords.x} ${cell.coords.y}`);
  }

  private solveByGroups(): void {
    const groups = this.findGroups();

    const { or, and, eq, run, lvar } = logic;

    let cellWithLowestProbabilty: CellWithProbability | undefined = undefined;

    let noAction = true;

    for (const group of groups) {
      const closedLVars = new Map();
      const ruleArgs: any[] = [];

      for (const cell of group) {
        const closedNeighbourLVars: any[] = [];
        let flaggedNeighboursCount = 0;

        const neighbours = this.getNeighbours(cell);

        for (const neighbour of neighbours) {
          if (this.isCellFlagged(neighbour)) {
            flaggedNeighboursCount++;

            continue;
          }

          if (Number.isNaN(neighbour.cellValue)) {
            const key = `${neighbour.coords.x} ${neighbour.coords.y}`;
            let closedLVar;

            if (closedLVars.has(key)) {
              closedLVar = closedLVars.get(key);
            } else {
              closedLVar = lvar(neighbour);
              closedLVars.set(key, closedLVar);
            }
            closedNeighbourLVars.push(closedLVar);
          }
        }

        const combinations = this.getMinesCombinations(
          closedNeighbourLVars.length,
          cell.cellValue - flaggedNeighboursCount
        );

        const orArgs = [];
        for (const comb of combinations) {
          const andArgs = [] as any;
          comb.forEach((isFlagged, index) => {
            andArgs.push(eq(closedNeighbourLVars[index], isFlagged));
          });
          orArgs.push(and(...andArgs));
        }
        ruleArgs.push(or(...orArgs));
      }

      const rule = and(...ruleArgs);
      const closedLVarArray = Array.from(closedLVars.values());

      const closedCellsArray = closedLVarArray.map(
        (closedLVar) => closedLVar.name
      );
      const probabilities = run(rule, closedLVarArray) as boolean[][];

      const composedCellWithProbabilities = this.getComposedCellsWithProbabilities(
        closedCellsArray,
        probabilities
      );

      for (const cellWithProbabilty of composedCellWithProbabilities) {
        switch (cellWithProbabilty.probability) {
          case 1:
            this.flagCell(cellWithProbabilty.cell);
            noAction = false;

            break;
          case 0:
            this.openCell(cellWithProbabilty.cell);
            noAction = false;

            break;
          default:
        }
      }

      if (noAction) {
        const groupCellWithLowestProbabilty = composedCellWithProbabilities.reduce(
          (acc, cell) => {
            if (!acc || acc.probability > cell.probability) {
              return cell;
            }
            return acc;
          },
          null as null | CellWithProbability
        );

        if (
          groupCellWithLowestProbabilty &&
          (!cellWithLowestProbabilty ||
            cellWithLowestProbabilty.probability >
              groupCellWithLowestProbabilty?.probability)
        ) {
          cellWithLowestProbabilty = groupCellWithLowestProbabilty;
        }
      }
    }

    if (noAction && cellWithLowestProbabilty) {
      this.openCell(cellWithLowestProbabilty.cell);
    }

    this.uploadMap();
  }

  private getComposedCellsWithProbabilities(
    closedCells: Cell[],
    probabilities: boolean[][]
  ) {
    return closedCells.map((cell, index) => ({
      cell,
      probability:
        probabilities.reduce(
          (acc, probability) => (probability[index] ? acc + 1 : acc),
          0
        ) / probabilities.length,
    }));
  }

  private getMinesCombinations(
    cellsCount: number,
    minesCount: number
  ): boolean[][] {
    const possibleCombinations: boolean[][] = [];

    function recursiveCombinator(prevArr: boolean[], minesPlaced = 0): void {
      if (prevArr.length === cellsCount) {
        if (minesPlaced === minesCount) possibleCombinations.push(prevArr);
        return;
      }
      recursiveCombinator([...prevArr, false], minesPlaced);
      if (minesPlaced < minesCount) {
        recursiveCombinator([...prevArr, true], minesPlaced + 1);
      }
    }
    recursiveCombinator([], 0);

    return possibleCombinations;
  }

  private findGroups(): Cell[][] {
    const groups: Cell[][] = [];
    const alreadyGroupedSet = new Set<string>();

    for (let i = 0; i < this.mapSize.y; i++) {
      for (let j = 0; j < this.mapSize.x; j++) {
        const cell = new Cell({ x: j, y: i }, +this.parsedMap[i][j]);

        const group: Cell[] = [];
        if (
          cell.cellValue ||
          !alreadyGroupedSet.has(`${cell.coords.x} ${cell.coords.y}`)
        )
          this.findGroupByCell(cell, group, alreadyGroupedSet);

        if (group.length) {
          groups.push(group);
        }
      }
    }

    return groups;
  }

  private findGroupByCell(
    cell: Cell,
    group: Cell[],
    alreadyGroupedSet: Set<string>,
    previousCell?: Cell
  ) {
    if (
      !cell.cellValue ||
      alreadyGroupedSet.has(`${cell.coords.x} ${cell.coords.y}`)
    )
      return;

    const neighbours = this.getNeighbours(cell);
    const flaggedNeighboursCount = this.getNeighbourFlaggedCount(neighbours);

    if (flaggedNeighboursCount === cell.cellValue) return;

    if (previousCell && !this.hasCommonClosedNeighbours(cell, previousCell))
      return;

    group.push(cell);
    alreadyGroupedSet.add(`${cell.coords.x} ${cell.coords.y}`);

    for (const neighbour of neighbours) {
      if (
        !neighbour.cellValue ||
        alreadyGroupedSet.has(`${neighbour.coords.x} ${neighbour.coords.y}`)
      )
        continue;

      this.findGroupByCell(neighbour, group, alreadyGroupedSet, cell);
    }
  }

  private hasCommonClosedNeighbours(cell1: Cell, cell2: Cell): boolean {
    const cell1ClosedNeighboursSet = new Set<string>();

    for (const cell of this.getNeighbours(cell1)) {
      if (Number.isNaN(cell.cellValue) && !this.isCellFlagged(cell)) {
        cell1ClosedNeighboursSet.add(`${cell.coords.x} ${cell.coords.y}`);
      }
    }

    const commonClosed = this.getNeighbours(cell2).filter((cell) =>
      cell1ClosedNeighboursSet.has(`${cell.coords.x} ${cell.coords.y}`)
    );

    return !!commonClosed.length;
  }
}

export default Solver;
