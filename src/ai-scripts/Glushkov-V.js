/*
Bot for bomberman game by Glushkov Vladimir

Purpose of codes:
0 - nothing
1 - down
2 - right
3 - top
4 - left
5 - plant the bomb
*/
const DEBUG = true;
const CALCULATE_STATES_COUNT = 4;

class Point {
    constructor(x, y) {
        this.x = this.col = x;
        this.y = this.row = y;
    }
    
    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    static add(a, b) {
        return new Point(a.x + b.x, a.y + b.y);
    }
    
    static sub(a, b) {
        return new Point(a.x - b.x, a.y - b.y);
    }
    
    static eq(a, b) {
        return a.x === b.x && a.y === b.y;
    }
}

Point.prototype.toString = function() {
    return `col: ${this.x}, row: ${this.y}`;
};

function createEnum(values) {
    const enumObject = {};
    for (const val of values) {
        enumObject[val] = val;
    }
    return Object.freeze(enumObject);
}

const eMapObjType = createEnum([
    'BEDROCK',
    'FREE',
    'WALL',
    'PLAYER',
    'ENEMY',
    'BOMB',
    'FIRE',
]);

const eTurnState = createEnum([
    'START',
    'SEARCH_DANGER',
    'SEARCH_TARGET',
    'ESCAPE',
    'MOVE_TO_TARGET',
    'PLANT_BOMB',
    'IDLE',
]);

const eTargetGoal = createEnum([
    'ESCAPE',
    'BOMB',
]);

const finiteStateTable = {
    [eTurnState.START]          : false,
    [eTurnState.SEARCH_DANGER]  : false,
    [eTurnState.SEARCH_TARGET]  : false,
    [eTurnState.ESCAPE]         : false,
    [eTurnState.MOVE_TO_TARGET] : true,
    [eTurnState.PLANT_BOMB]     : true,
    [eTurnState.IDLE]           : true,
};

const mapObjWorth = {
    [eMapObjType.BEDROCK]: 0,
    [eMapObjType.FREE]: 0,
    [eMapObjType.WALL]: 1,
    [eMapObjType.PLAYER]: 0,
    [eMapObjType.ENEMY]: 2,
    [eMapObjType.BOMB]: 0,
    [eMapObjType.FIRE]: 0,
};

//0 - idle
//1 - down
//2 - right
//3 - top
//4 - left
const adjacents = [
    new Point(0, 0),
    new Point(0, 1),
    new Point(1, 0),
    new Point(0, -1),
    new Point(-1, 0),
];

function create2DArray(cols, rows, def) {
    return Array.from(Array(cols), () => Array.from(Array(rows), () => structuredClone(def)));
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

var controllerUUID = null;

var originalConsoleLog = console.log;

console.log = function() {
    args = [];
    args.push( '[' + controllerUUID + '] ' );
    // Note: arguments is part of the prototype
    for( var i = 0; i < arguments.length; i++ ) {
        args.push(arguments[i]);
    }
    originalConsoleLog.apply( console, args );
};

class Controller {
    Init(info) {
        if (!info) {
            return;
        }
        
        controllerUUID = info.mapData.playerData.controllerUUID;
        console.log(`Init Turn.`);
        
        this.turnCounter = 0;
        this.mapData = info.mapData;
        this.mapCols = info.mapData.map.length;
        this.mapRows = info.mapData.map[0].length;
        this.mapStates = Array.from(Array(CALCULATE_STATES_COUNT), () => create2DArray(
            this.mapCols, 
            this.mapRows, 
            { type: eMapObjType.FREE, worth: 0 }
        ));
        // console.log(this.mapStates);
        // save between moves
        this.path = null;
        this.lastBombRestoreTurn = 0;
        this.targetGoal = null;
        // ===========
        
        // restore before next turn
        const pp = this.mapData.playerData.position;
        this.playerPosition = new Point(pp._x, pp._y);
        this.minSearchTargetWorth = 1;
        this.isBombMustBeReady = false;
        this.currState = null;
        // ===========
        
        this.stateTable = {
            [eTurnState.START] : () => {
                this.ProcessStateStart();
                return null;
            },
            [eTurnState.SEARCH_DANGER] : () => {
                this.ProcessStateSearchDanger();
                return null;
            },
            [eTurnState.SEARCH_TARGET] : () => {
                this.ProcessStateSearchTarget();
                return null;
            },
            [eTurnState.ESCAPE] : () => {
                this.ProcessStateEscape();
                return null;
            },
            [eTurnState.MOVE_TO_TARGET] : () => {
                return this.ProcessStateMoveToTarget();
            },
            [eTurnState.PLANT_BOMB] : () => {
                return this.ProcessStatePlantBomb();
            },
            [eTurnState.IDLE] : () => {
                return this.ProcessStateIdle();
            },
        };
    }
    
    GetCommand(info) {
        ++this.turnCounter;
        
        if (DEBUG) {
            console.log(`Turn: ${this.turnCounter}`);
            console.log(info);
        }
        
        this.currState = eTurnState.START;
        this.mapData = info.mapData;
        const pp = this.mapData.playerData.position;
        this.playerPosition = new Point(pp._x, pp._y);
        this.minSearchTargetWorth = 1;
        this.isBombMustBeReady = false;
        
        const command = this.GetCommandInternal();
        
        return command;
    }
    
    GetCommandInternal() {
        var command = null;
        while (command === null) {
            if (!finiteStateTable[this.currState]) {
                this.stateTable[this.currState]();
            } else {
                command = this.stateTable[this.currState]();
            }
        }
        console.log("result command: ", command);
        return command;
        
        //debug
        // if (this.mapData.playerData.bombsCount === 1) {
        //     return { bombermanAction: 5 };
        // }
        // return { bombermanAction: 1 };
    }
    
    ProcessStateStart() {
        console.log("> ProcessStateStart begin");
        this.CalculateStates();
        this.currState = eTurnState.SEARCH_DANGER;
        console.log("> ProcessStateStart end");
    }
    
    ProcessStateSearchDanger() {
        console.log("> ProcessStateSearchDanger begin");
        // console.log("this.mapStates[0]: ", this.mapStates[0]);
        if (this.mapStates[0][this.playerPosition.col][this.playerPosition.row].type === eMapObjType.FIRE
            || this.mapStates[0][this.playerPosition.col][this.playerPosition.row].type === eMapObjType.BOMB)
        {
            this.currState = eTurnState.ESCAPE;
            console.log("> ProcessStateSearchDanger end");
            return;
        }
        this.currState = eTurnState.SEARCH_TARGET;
        console.log("> ProcessStateSearchDanger end");
        return;
    }
    
    IsWorthlyTarget(path) {
        // console.log("> IsWorthlyTarget begin");
        const last = path.slice(-1)[0];
        // checking cell worth in the moment when player will come there
        const st = Math.min(CALCULATE_STATES_COUNT, path.length) - 1;
        // console.log(this.mapStates[st]);
        const worth = this.mapStates[st][last.col][last.row].worth;
        const result = worth >= this.minSearchTargetWorth;
        if (this.isBombMustBeReady) {
            // console.log("> IsWorthlyTarget end");
            return result && this.turnCounter + path.length - 1 >= this.lastBombRestoreTurn;
        }
        // console.log("> IsWorthlyTarget end");
        return result;
    }
    
    ProcessStateSearchTarget() {
        console.log("> ProcessStateSearchTarget begin");
        
        const target = this.path !== null ? this.path.slice(-1)[0] : null;
        // console.log("this.playerPosition: ", this.playerPosition);
        // console.log(`target: ${target} | targetGoal: ${this.targetGoal}`);
        // console.log("this.mapData.playerData.bombsCount: ", this.mapData.playerData.bombsCount);
        if (target !== null && this.targetGoal === eTargetGoal.ESCAPE && Point.eq(target, this.playerPosition)) {
            this.targetGoal = null;
            this.path = null;
        }

        if (target !== null 
            && this.targetGoal === eTargetGoal.BOMB 
            && Point.eq(target, this.playerPosition)
            && this.mapData.playerData.bombsCount >= 1
            || target === null && this.IsWorthlyTarget([this.playerPosition]))
        {
            this.currState = eTurnState.PLANT_BOMB;
            console.log("> ProcessStateSearchTarget end");
            return;
        }
        
        const BFSGen = this.BFS(this.playerPosition, (path) => this.IsWorthlyTarget(path));
        const path1 = BFSGen.next().value;
        // console.log("path1: ", path1);
        if (path1 === null) {
            this.targetGoal = null;
            this.currState = eTurnState.IDLE;
            console.log("> ProcessStateSearchTarget end");
            return;
        }

        this.isBombMustBeReady = true;
        if (this.IsWorthlyTarget(path1)) {
            this.path = path1;
        } else {
            const path2 = BFSGen.next().value;
            this.path = path2 !== null ? path2 : path1;
        }
        
        // heuristic for end game where is only moving enemies are stay
        if (target !== null 
            && this.targetGoal === eTargetGoal.BOMB
            && !Point.eq(target, this.path.slice(-1)[0])
            && this.IsWorthlyTarget([this.playerPosition]))
        {
            this.isBombMustBeReady = false;
            this.currState = eTurnState.PLANT_BOMB;
            console.log("> ProcessStateSearchTarget end");
            return;
        }
        
        this.isBombMustBeReady = false;
        this.targetGoal = eTargetGoal.BOMB;
        this.currState = eTurnState.MOVE_TO_TARGET;
        console.log("> ProcessStateSearchTarget end");
        return;
    }
     
    ProcessStateEscape() {
        console.log("> ProcessStateEscape begin");
        const BFSGen = this.BFS(this.playerPosition, (path) => this.IsWorthlyTarget(path));
        this.path = BFSGen.next().value;
        if (this.path === null) {
            const BFSGen2 = this.BFS(this.playerPosition, (path) => {
                const last = path.slice(-1)[0];
                const st = Math.min(CALCULATE_STATES_COUNT, path.length) - 1;
                return this.mapStates[st][last.col][last.row].type !== eMapObjType.FIRE
                    && this.mapStates[st][last.col][last.row].type !== eMapObjType.BOMB;
            });
            this.path = BFSGen2.next().value;
            if (this.path === null) {
                this.targetGoal = null;
                this.currState = eTurnState.IDLE;
                console.log("> ProcessStateEscape end");
                return;
            }
        }
        
        this.targetGoal = eTargetGoal.ESCAPE;
        this.currState = eTurnState.MOVE_TO_TARGET;
        console.log("> ProcessStateEscape end");
        return;
    }
    
    ProcessStateMoveToTarget() {
        console.log("> ProcessStateMoveToTarget begin");
        const nextPoint = this.path[1];
        const adjacent = Point.sub(nextPoint, this.playerPosition);
        // console.log("nextPoint: ", nextPoint);
        // console.log("adjacent: ", adjacent);
        const code = adjacents.findIndex((element) => Point.eq(element, adjacent));

        console.log("> ProcessStateMoveToTarget end");
        return { bombermanAction: code};
    }
    
    ProcessStatePlantBomb() {
        console.log("> ProcessStatePlantBomb begin");
        // check plant bomb is safe
        const BFSGen = this.BFS(this.playerPosition, (path) => {
            const last = path.slice(-1)[0];
            const adjacent = Point.sub(last, this.playerPosition);
            const isAdjacent = adjacents.findIndex((element) => Point.eq(element, adjacent)) !== -1;
            const st = Math.min(CALCULATE_STATES_COUNT, path.length) - 1;
            return this.mapStates[st][last.col][last.row].type !== eMapObjType.FIRE
                && this.mapStates[st][last.col][last.row].type !== eMapObjType.BOMB
                && !isAdjacent;
        });
        const path = BFSGen.next().value;
        if (path === null) {
            console.log("plant the bomb is not safe");
            this.targetGoal = null;
            this.path = null;
            console.log("> ProcessStatePlantBomb end");
            return { bombermanAction: 0 };
        }
        this.targetGoal = null;
        this.path = null;
        this.lastBombRestoreTurn = this.turnCounter + this.mapData.playerData.bombsRestoreTicks;
        console.log("> ProcessStatePlantBomb end");
        return { bombermanAction: 5 };
    }
    
    ProcessStateIdle() {
        console.log("> ProcessStateIdle begin");
        console.log("> ProcessStateIdle end");
        return { bombermanAction: 0 };
    }
    
    GetMapObjType(mapObj) {
        if (mapObj.hasOwnProperty("health")) {
            if (mapObj.hasOwnProperty("bombsCount")) {
                // we already knew player position
                // so place free on this cell to be able place fire in case of danger
                return eMapObjType.FREE;
            } else if (mapObj.health === undefined) {
                return eMapObjType.WALL;
            } else {
                return eMapObjType.ENEMY;
            }
        } else if (mapObj.hasOwnProperty("turnToExplosion")) {
            return eMapObjType.BOMB;
        }
        return eMapObjType.BEDROCK;
    }
    
    CalculateStates() {
        console.log("> CalculateStates begin");
        
        for (let st = 0; st < this.mapStates.length; ++st) {
            // console.log("calculate state #", st);
            // console.log("start: ", this.mapStates[st]);
            // parse map and init states
            for (let col = 0; col < this.mapCols; ++col) {
                for (let row = 0; row < this.mapRows; ++row) {
                    if (this.mapData.map[col][row].length === 0) {
                        this.mapStates[st][col][row].type = eMapObjType.FREE;
                    } else {
                        for (let idx in this.mapData.map[col][row]) {
                            const type = this.GetMapObjType(this.mapData.map[col][row][0]);
                            this.mapStates[st][col][row].type = type;
                            if (type === eMapObjType.BOMB) {
                                break;
                            }
                        }
                    }
                    this.mapStates[st][col][row].worth = 0;
                    // console.log("t", this.mapStates[st][col][row]);
                }
            }
            // console.log("inited: ", this.mapStates[st]);
            // add fire zones to avoid exploids
            for (let col = 0; col < this.mapCols; ++col) {
                for (let row = 0; row < this.mapRows; ++row) {
                    if (this.mapStates[st][col][row].type !== eMapObjType.BOMB) {
                        continue;
                    }
                    // in case if player/enemy stay on bomb
                    const bombObj = this.mapData.map[col][row].find((element) => element.hasOwnProperty("turnToExplosion"));
                    if (bombObj === null) {
                        console.log("ERROR: expected bomb is not found!");
                    }
                    if (bombObj.turnToExplosion !== this.turnCounter + st + 1) {
                        // console.log("skip fire ", this.mapData.map[col][row][0].turnToExplosion, this.turnCounter + st + 1);
                        continue;
                    }
                    // console.log("fire placed");
                    this.mapStates[st][col][row].type = eMapObjType.FIRE;
                    for (let idx in adjacents) {
                        const adjacent = adjacents[idx];
                        if (this.mapStates[st][col + adjacent.col][row + adjacent.row].type !== eMapObjType.FREE) {
                            continue;
                        }
                        this.mapStates[st][col + adjacent.col][row + adjacent.row].type = eMapObjType.FIRE;
                    }
                }
            }
            // console.log("init fire: ", this.mapStates);
            // calculate weights for target searching
            for (let col = 0; col < this.mapCols; ++col) {
                for (let row = 0; row < this.mapRows; ++row) {
                    if (this.mapStates[st][col][row].type !== eMapObjType.FREE) {
                        continue;
                    }
                    for (let idx in adjacents) {
                        const adjacent = adjacents[idx];
                        const worth = mapObjWorth[this.mapStates[st][col + adjacent.col][row + adjacent.row].type];
                        this.mapStates[st][col][row].worth += worth;
                    }
                }
            }
        }
        // console.log(this.mapStates);
        console.log("> CalculateStates end");
    }
    
    *BFS(startP, prd) {
        console.log("> BFS begin");
        const visited = create2DArray(this.mapCols, this.mapRows, false);
        // console.log(visited);
        const queue = [[startP]];
        visited[startP.col][startP.row] = true;
        let turn = 0;
        
        while(queue.length !== 0) {
            // console.log("queue: ", queue);
            // console.log("visited: ", visited);
            const path = queue.shift();
            const last = path.slice(-1)[0];
            // console.log(last);
            turn = Math.min(CALCULATE_STATES_COUNT - 1, turn) % CALCULATE_STATES_COUNT;
            const mapState = this.mapStates[turn];
            
            let adj = structuredClone(adjacents);
            if (getRndInteger(0, 2) === 0) {
                adj.reverse();
                // console.log("adjacents: ", adj);
            }
            
            for (let idx in adj) {
                const adjacent = adj[idx];
                // console.log("adjacents: ", adj);
                // console.log("last: ", last);
                // console.log("adjacent: ", adjacent);
                // console.log("last.col + adjacent.col: ", last.col + adjacent.col);
                const canMoveTo = !visited[last.col + adjacent.col][last.row + adjacent.row]
                    && mapState[last.col + adjacent.col][last.row + adjacent.row].type === eMapObjType.FREE;
                // console.log(`col = ${last.col + adjacent.col}, row = ${last.row + adjacent.row}, canMove = ${canMoveTo}`);
                if (canMoveTo) {
                    visited[last.col + adjacent.col][last.row + adjacent.row] = true;
                    let newPath = structuredClone(path);
                    newPath.push(new Point(last.col + adjacent.col, last.row + adjacent.row));
                    
                    if (prd(newPath)) {
                        console.log("> BFS yield");
                        yield newPath;
                    }
                    
                    queue.push(newPath);
                }
            }
            ++turn;
        }
        
        console.log("> BFS end");
        return null;
    }
}
