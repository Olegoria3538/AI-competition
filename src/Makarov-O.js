class Controller {
    putBombDistance = 2
    dangerBombDistance = 2
    lastStepType = null
    stepType = Object.freeze({
        placeBomb: 1,
        destroyWall: 2,
        runToWall: 3,
        runFromBomb: 4,
        runToEnemies: 5,
        nothing: 6,
    })
    directions = Object.freeze({
        down: 1,
        right: 2,
        top: 3,
        left: 4,
    })
    bombermanAction = Object.freeze({
        nothing: 0,
        down: this.directions.down,
        right: this.directions.right,
        top: this.directions.top,
        left: this.directions.left,
        bomb: 5
    })
    mapUnitTypes = Object.freeze({        
        empty: 0, 
        simpleWall: 1,
        destructibleWall: 2,
        bomb: 3,
        player: 4,
        enemies: 5
    });

    Init(info) {}
    
    PositionEqual(position1, position2) {
        return position1.x === position2.x && position1.y === position2.y
    }
    
    GetUnitPosition({position}) {
        return { x: position._x, y: position._y }
    }
    
    GetDistancePoint(aPoint, bPoint) {
        return Math.sqrt(Math.pow(bPoint.x - aPoint.x, 2) + Math.pow(bPoint.y - aPoint.y, 2))
    }
    
    GetNearestUnit(arrayUnit, start) {
        const distances = arrayUnit.map(unitData => this.GetDistancePoint(this.GetUnitPosition(unitData), start))
        const minDistance = Math.min(...distances)
        const indexMin = distances.findIndex(x => x === minDistance)
        return { unit: arrayUnit[indexMin], distance: minDistance }
    }
    
    MapFormate(mapData) {
        const map = []
        
        for (let index = 0; index < mapData.map.length; index++) {
	        const row = mapData.map[index];
	        map.push(Array.from({length: row.length}, () => ({
	            type: this.mapUnitTypes.empty,
	            weight: null,
	            data: null,
	        })))
        }
        
        const setMapUnits = (unitsArray, type) => {
            unitsArray.forEach(data => {
                map[data.position._x][data.position._y] = {
                    ...map[data.position._x][data.position._y],
                    type,
                    data
                }
            })
        }
        
        setMapUnits(mapData.enemiesData, this.mapUnitTypes.enemies)
        setMapUnits(mapData.destructibleWallsData, this.mapUnitTypes.destructibleWall)
        setMapUnits(mapData.simpleWallsData, this.mapUnitTypes.simpleWall)
        setMapUnits(mapData.bombsData, this.mapUnitTypes.bomb)
        
        return map
    }
    
    FindCell({ mapData, predicat, start, ignore }) {
        const map = this.MapFormate(mapData)
        let complete = false
        let findCell = null
        const kv = {}
        const loop = (point) => {
            if(kv[`${point.x}-${point.y}`]) return            
            kv[`${point.x}-${point.y}`] = true

            if(complete) return
            if(!map?.[point.x]?.[point.y]) return
            if(ignore({ cell: map[point.x][point.y], position: point, map })) return
            const res = predicat({ cell: map[point.x][point.y], position: point, map })
            if(res) {
                complete = true
                findCell = { cell: map[point.x][point.y], position: point }
            } else {
                loop({ y: point.y + 1, x: point.x })
                loop({ y: point.y - 1, x: point.x })
                loop({ y: point.y, x: point.x + 1 })
                loop({ y: point.y, x: point.x - 1})
            }
        }
        loop(start)
        return findCell
    }
    
    GetPath({ mapData, start, end, walls }) {
        if(this.PositionEqual(start, end)) return null
        const map = this.MapFormate(mapData)

        let currentWeight = 0
        let canLee = true
        
        map[start.x][start.y].weight = currentWeight
        
        while(canLee && map[end.x][end.y].weight === null) {
            const nextWeight = currentWeight + 1
            let can = false
            map.forEach((row, i) => row.forEach((cell, j) => {
                if(cell.weight === currentWeight) {
                    if(map?.[i+1]?.[j] && map[i+1][j].weight === null && !walls.includes(map[i+1][j].type)) {
                        map[i+1][j].weight = nextWeight
                        can = true
                    }
                    if(map?.[i-1]?.[j] && map[i-1][j].weight === null && !walls.includes(map[i-1][j].type)) {
                        map[i-1][j].weight = nextWeight
                        can = true
                    }
                    if(map?.[i]?.[j+1] && map[i][j+1].weight === null && !walls.includes(map[i][j+1].type)) {
                        map[i][j+1].weight = nextWeight
                        can = true
                    }
                    if(map?.[i]?.[j-1] && map[i][j-1].weight === null && !walls.includes(map[i][j-1].type)) {
                        map[i][j-1].weight = nextWeight
                        can = true
                    }
                }
            }))
            canLee = can
            currentWeight = nextWeight
        }
        if(map[end.x][end.y].weight !== null) {
            let currentCell = end
            const reversePaths = []
            let count = 0
            while(!this.PositionEqual(start, currentCell)) {
                count = count + 1
                reversePaths.push(currentCell)
                const { x, y } = currentCell
                const weight = map[x][y].weight                
                const lastWeight = weight - 1
                if(map?.[x+1]?.[y] && map[x+1][y].weight === lastWeight) {
                    currentCell = { x: x + 1, y: y }
                } else if(map?.[x-1]?.[y] && map[x-1][y].weight === lastWeight) {
                    currentCell = { x: x - 1, y: y }
                } else if(map?.[x]?.[y+1] && map[x][y+1].weight === lastWeight) {
                   currentCell = { x: x, y: y + 1 }
                } else if(map?.[x]?.[y-1] && map[x][y-1].weight === lastWeight) {
                    currentCell = { x: x, y: y - 1 }
                }
            }
            
            const paths = [...reversePaths].reverse()
            
            const firstPath = paths[0]
            const direction = (() => {
                if(firstPath.y - start.y !== 0) {
                    if(firstPath.y - start.y === 1) return this.directions.down
                    return this.directions.top
                } else if(firstPath.x - start.x !== 0) {
                    if(firstPath.x - start.x === 1) return this.directions.right
                    return this.directions.left
                }
                return null
            })()
            
            
            return {
                paths,
                direction
            }
        } else {
            return null
        }
    }
    
    GetRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }
    
    GetCommand({ mapData }) {  
        try {

        const playerPosition = this.GetUnitPosition(mapData.playerData)
        
        
        const { unit: nearestBomb, distance: nearestBombDistance } = this.GetNearestUnit(mapData.bombsData, playerPosition)
        
        // если у нас бомба под боком то пытаемся от неё сбежать
        if(nearestBomb && nearestBombDistance < this.dangerBombDistance) {
            const bombPosition = this.GetUnitPosition(nearestBomb)
            const ignoreCells = [this.mapUnitTypes.simpleWall, this.mapUnitTypes.destructibleWall, this.mapUnitTypes.enemies, this.mapUnitTypes.bomb]
            const cell = this.FindCell({
                mapData,
                ignore: ({cell, position}) => {
                    if(cell.type === this.mapUnitTypes.bomb) {
                        return !this.PositionEqual(position, playerPosition)
                    }                    
                    if(ignoreCells.includes(cell.type)) return true
                },
                start: playerPosition,
                predicat: ({cell, position}) => {
                    return cell.type === this.mapUnitTypes.empty && this.GetDistancePoint(position, bombPosition) > this.dangerBombDistance
                }
            })
            if(cell) {
                const pathToEmpty = this.GetPath({ 
                    mapData, 
                    walls: ignoreCells,
                    start: playerPosition, 
                    end: cell.position,
                })
                if(pathToEmpty) {
                    this.lastStepType = this.stepType.runFromBomb
                    return { bombermanAction: pathToEmpty.direction }
                }
            }
        } 
        
        
        const { unit: nearestEnemy, distance: nearestEnemyDistance } = this.GetNearestUnit(mapData.enemiesData, playerPosition)
        
        
        // если мы близко к врагу то пытаемся поставить бомбу
        if(nearestEnemyDistance < this.putBombDistance) {
            this.lastStepType = this.stepType.placeBomb
            return { bombermanAction: this.bombermanAction.bomb }
        }
        
        
        // пытаемся придти к ближайшему врагу
        if(nearestEnemy) {
            const pathToEnemy = this.GetPath({ 
                    mapData, 
                    start: playerPosition, 
                    end: this.GetUnitPosition(nearestEnemy),
                    walls: [this.mapUnitTypes.simpleWall, this.mapUnitTypes.destructibleWall, this.mapUnitTypes.bomb]
                })
            if(pathToEnemy) {
                this.lastStepType = this.stepType.runToEnemies
                return { bombermanAction: pathToEnemy.direction }
            }
        }
        
        
        // если придти к врагу никак не получается, то идём ломать стены
        const { unit: nearestSimpleWall, distance: nearestSimpleWallDistance } = this.GetNearestUnit(mapData.simpleWallsData, playerPosition)
        if(nearestSimpleWall) {
            const ignoreCells = [this.mapUnitTypes.simpleWall, this.mapUnitTypes.destructibleWall, this.mapUnitTypes.enemies, this.mapUnitTypes.bomb]
            const cell =  this.lastStepType === this.stepType.runToWall && this.findDestroyWallCell
                ? this.findDestroyWallCell 
                : this.FindCell({
                    mapData,
                    start: playerPosition,                
                    ignore: ({cell, position}) => {
                        return ignoreCells.includes(cell.type)
                    },
                    predicat: ({cell, position, map}) => {
                        if(cell.type !== this.mapUnitTypes.empty) return false
                        const nearests = [
                            map?.[position.x + 1]?.[position.y]?.type,
                            map?.[position.x - 1]?.[position.y]?.type,
                            map?.[position.x]?.[position.y + 1]?.type,
                            map?.[position.x]?.[position.y - 1]?.type,
                        ]
                        return nearests.includes(this.mapUnitTypes.destructibleWall)
                    }
                })
            this.findDestroyWallCell = cell
            if(cell) {
                if(this.PositionEqual(cell.position, playerPosition)) {
                    this.lastStepType = this.stepType.destroyWall
                    return { bombermanAction: this.bombermanAction.bomb }
                } else {
                    const pathToWall = this.GetPath({ 
                        mapData, 
                        walls: ignoreCells,
                        start: playerPosition, 
                        end: cell.position,
                    })
                    if(pathToWall) {
                        this.lastStepType = this.stepType.runToWall
                        return { bombermanAction: pathToWall.direction }
                    }
                }
            }
        }
        
        } catch (e) {
            console.error(e)
        }
        // иначе не понятно, что делать то
        this.lastStepType = this.stepType.nothing
        return { bombermanAction: 0 }
    }
    
} 
