/*
Example random bot

Purpose of codes:
0 - nothing
1 - down
2 - right
3 - top
4 - left
5 - plant the bomb
*/

class Controller { 
    Init(info) {}
    
    GetRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    calculateDistance(first, second){
         return Math.abs(first._x - second._x) + Math.abs(first._y - second._y)
    }
    
    findNearestEnemy(a, b, player, enemies){
        const playerStep = {_x: player._x + a, _y: player._y + b}
        let isFound = null
        if (enemies.length) isFound = isFound || this.findWallWithTheSameCoord(enemies, playerStep)
        return isFound 
    }
    
    findDestructibleWall(a, b, player, dWall){
        const playerStep = {_x: player._x + a, _y: player._y + b}
        let isFound = null
        if (dWall.length) isFound = isFound || this.findWallWithTheSameCoord(dWall, playerStep)
        return isFound 
    }
    findWallWithTheSameCoord(wall, coord){
        for(let i = 0; i<wall.length; i++ ){
            if (wall[i].position._x === coord._x && wall[i].position._y === coord._y) return wall[i]
        }
        return null
    }
    findFreeCage(a, b, player, dWall, bomb, sWall){
        const playerStep = {_x: player._x + a, _y: player._y + b}
        let isFound = null
        if (dWall.length) isFound = isFound || this.findWallWithTheSameCoord(dWall, playerStep)
        if (bomb.length) isFound = isFound || this.findWallWithTheSameCoord(bomb, playerStep)
        if (sWall.length) isFound = isFound || this.findWallWithTheSameCoord(sWall, playerStep)
        return isFound 
    }
   
    goToFreeCage(player, wall){
        let isFoundWall = []
        isFoundWall.push(this.findFreeCage(0, 1, player, wall))
        isFoundWall.push(this.findFreeCage(1, 0, player, wall))
        isFoundWall.push(this.findFreeCage(0, -1, player, wall))
        isFoundWall.push(this.findFreeCage(-1, 0, player, wall))
        
        for (let i=0; i<isFoundWall.length; i++){
            if(!isFoundWall[i]) return { bombermanAction: i+1}
            
        }
    }
    GetCommand(info) { 
        console.log(info)
        const mapData = info.mapData
        const playerPosition = mapData.playerData.position
        const bombs = mapData.bombsData;
        const enemies = mapData.enemiesData;
        const destructibleWalls = mapData.destructibleWallsData
        const simpleWall = mapData.simpleWallsData
        //learning to run away from bombs
        if (bombs.length){
            for(let i=0; i<bombs.length; i++){
                let distanceToBomb = this.calculateDistance(bombs[i].position, playerPosition)
                if (distanceToBomb<3){
                        //learning to walk in free cages
                        if(!(this.findFreeCage(0, 1, playerPosition, destructibleWalls, bombs, simpleWall))) 
                            { console.log("down")
                            return { bombermanAction: 1 }}
                        if(!(this.findFreeCage(1, 0, playerPosition, destructibleWalls, bombs, simpleWall))) 
                            {console.log("right")
                            return { bombermanAction: 2 }}
                        if(!(this.findFreeCage(0, -1, playerPosition, destructibleWalls, bombs, simpleWall))) 
                            {console.log("top")
                            return { bombermanAction: 3 }}
                        if(!(this.findFreeCage(-1, 0, playerPosition, destructibleWalls, bombs, simpleWall))) 
                            {console.log("left")
                            return { bombermanAction: 4 }
                            }
                        return { bombermanAction: this.GetRandomInt(1, 4)}
                }
               return { bombermanAction: this.GetRandomInt(1, 4)}
            }
        }else {
           if (
                this.findNearestEnemy(0, 1, playerPosition, enemies) ||
                this.findNearestEnemy(1, 0, playerPosition, enemies) ||
                this.findNearestEnemy(0, -1, playerPosition, enemies) ||
                this.findNearestEnemy(-1, 0, playerPosition, enemies)
           ) 
                return { bombermanAction: 5}
           if (
                this.findDestructibleWall(0, 1, playerPosition, destructibleWalls) ||
                this.findDestructibleWall(1, 0, playerPosition, destructibleWalls) ||
                this.findDestructibleWall(0, -1, playerPosition, destructibleWalls) ||
                this.findDestructibleWall(-1, 0, playerPosition, destructibleWalls)
            ) 
                return { bombermanAction: 5}
            return { bombermanAction: this.GetRandomInt(1, 4)}
            
        }
    }
}