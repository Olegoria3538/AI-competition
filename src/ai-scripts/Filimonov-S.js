class Vector2 {
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }
}

class Controller {
    Init(info) {}

    GetCommand(info) {
        const mapData = info.mapData;
        this.updateMapGrid(mapData);
        
        const start = mapData.playerData.position;

        if (this.grid[start._x][start._y] === 3) {
            this.ignoreBobmsOnPath = true
            const safeCell = this.findNearestSafeCell(mapData, start);
    
            if (safeCell) {
                const path = this.aStarPathfinding(mapData, start, safeCell);
        
                if (path.length > 1) {
                    const nextStep = path[1];
                    return { bombermanAction: this.getDirection(start, nextStep) };
                }
            }
        } else {
            this.ignoreBobmsOnPath = false
            const target = this.findClosestEnemy(mapData.enemiesData, start);
    
            if (target) {
                const path = this.aStarPathfinding(mapData, start, target.position);
    
                if (path.length > 1) {
                    const nextStep = path[1];
                    // Check if the next cell contains an enemy
                    if (target.position._x === nextStep._x && target.position._y === nextStep._y) {
                        // Place a bomb
                        return { bombermanAction: 5 };
                    }
                    // Check if the next cell contains a destructible wall
                    if (this.grid[nextStep._x][nextStep._y] === 1) {
                        // Place a bomb
                        return { bombermanAction: 5 };
                    }
                    return { bombermanAction: this.getDirection(start, nextStep) };
                }
            }
        }
        return { bombermanAction: 0 }; // Do nothing if no path found or no enemies
    }

    updateMapGrid(mapData) {
        this.grid = [];
        const simpleWallsPositions = mapData.simpleWallsData.map((wall) => wall.position);
        const destructibleWallsPositions = mapData.destructibleWallsData.map((wall) => wall.position);
        const bombsPositions = mapData.bombsData.map((bomb) => bomb.position);

        function hasBombNeighbor(x, y) {
            const neighbors = [
                { _x: x - 1, _y: y },
                { _x: x + 1, _y: y },
                { _x: x, _y: y - 1 },
                { _x: x, _y: y + 1 },
            ];
    
            return neighbors.some((neighbor) => bombsPositions.some((bombPos) => bombPos._x === neighbor._x && bombPos._y === neighbor._y));
        }
        
        for (let x = 0; x < mapData.map.length; x++) {
            this.grid[x] = [];
            for (let y = 0; y < mapData.map[0].length; y++) {
                const currentPosition = new Vector2(x, y);
            
                if (destructibleWallsPositions.some((wallPos) => wallPos._x === currentPosition._x && wallPos._y === currentPosition._y)) {
                    this.grid[x][y] = 1;
                } else if (simpleWallsPositions.some((wallPos) => wallPos._x === currentPosition._x && wallPos._y === currentPosition._y)) {
                    this.grid[x][y] = 2;
                } else if (bombsPositions.some((bombPos) => bombPos._x === currentPosition._x && bombPos._y === currentPosition._y) || hasBombNeighbor(x, y)) {
                    this.grid[x][y] = 3;
                } else {
                    this.grid[x][y] = 0;
                }
            }
        }
    }

    findNearestSafeCell(mapData, start) {
        let minDistance = Infinity;
        let nearestSafeCell = null;

        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[0].length; y++) {
                if (this.grid[x][y] === 0) {
                    const distance = Math.pow(start._x - x, 2) + Math.pow(start._y - y, 2);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestSafeCell = new Vector2(x, y);
                    }
                }
            }
        }
        
        return nearestSafeCell;
    }

    findClosestEnemy(enemies, start) {
        let closestEnemy = null;
        let minDistance = Infinity;

        enemies.forEach((enemy) => {
            const distance = Math.pow(start._x - enemy.position._x, 2) + Math.pow(start._y - enemy.position._y, 2);
            if (distance < minDistance) {
                closestEnemy = enemy;
                minDistance = distance;
            }
        });

        return closestEnemy;
    }

    getDirection(current, next) {
        if (next._y < current._y) {
            return 3; // top
        } else if (next._y > current._y) {
            return 1; // down
        } else if (next._x > current._x) {
            return 2; // right
        } else if (next._x < current._x) {
            return 4; // left
        } else {
            return 0; // nothing
        }
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            path.unshift(current);
        }
        return path;
    }

    heuristicCostEstimate(a, b) {
        return Math.abs(a._x - b._x) + Math.abs(a._y - b._y);
    }

    canStepOn(x, y) {
        if (this.grid[x][y] === 2) {
            return false;
        }
        if (!this.ignoreBobmsOnPath && this.grid[x][y] === 3) {
            return false;
        }
        return true;
    }

    getNeighbors(pos) {
        const neighbors = [];
        const dirs = [
            { _x: 0, _y: -1 },
            { _x: 1, _y: 0 },
            { _x: 0, _y: 1 },
            { _x: -1, _y: 0 },
        ];

        dirs.forEach((dir) => {
            const x = pos._x + dir._x;
            const y = pos._y + dir._y;

            if (x >= 0 && x < this.grid.length && y >= 0 && y < this.grid[0].length) {
                if (this.canStepOn(x,y)) {
                    neighbors.push(new Vector2(x, y));
                }
            }
        });

        return neighbors;
    }

    aStarPathfinding(mapData, start, end) {
        const openSet = [];
        const closedSet = [];
        const cameFrom = new Map();

        const gScore = new Map();
        const fScore = new Map();

        openSet.push(start);
        gScore.set(start, 0);
        fScore.set(start, this.heuristicCostEstimate(start, end));

        while (openSet.length > 0) {
            const current = openSet.reduce((lowest, node) => {
                if (fScore.get(node) < fScore.get(lowest)) {
                    return node;
                } else {
                    return lowest;
                }
            }, openSet[0]);

            if (current._x === end._x && current._y === end._y) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.splice(openSet.indexOf(current), 1);
            closedSet.push(current);

            this.getNeighbors(current).forEach((neighbor) => {
                if (closedSet.some((closedNode) => closedNode._x === neighbor._x && closedNode._y === neighbor._y)) {
                    return;
                }

                const cost = this.grid[neighbor._x][neighbor._y] === 1 ? 5 : 1;
                const tentativeGScore = gScore.get(current) + cost;

                if (!openSet.some((openNode) => openNode._x === neighbor._x && openNode._y === neighbor._y)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore.get(neighbor)) {
                    return;
                }

                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, gScore.get(neighbor) + this.heuristicCostEstimate(neighbor, end));
            });
        }

        return []; // No path found
    }
}
