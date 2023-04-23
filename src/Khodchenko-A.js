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
    GetDistancePoint(aPoint, bPoint) {
        return Math.abs(bPoint.x - aPoint.x) + Math.abs(bPoint.y - aPoint.y) //Manhattan Distance
    }
    GetCommand(info) { 
        //console.log(info);
        const mapData = info.mapData;
        const playerPosition = {x: mapData.playerData.position._x, y:  mapData.playerData.position._y}
        const destructibleWallsData = mapData.destructibleWallsData;
        const simpleWallsData = mapData.simpleWallsData;
        const bombsData = mapData.bombsData;
        const enemiesData = mapData.enemiesData;
        const destructibleWalls_count = destructibleWallsData.length
        const simpleWalls_count = simpleWallsData.length
        const bombs_count = bombsData.length
        const enemies_count = enemiesData.length
        
       if(enemies_count) {
            for (let i = 0; i < enemies_count; i++) {
                const Enime =  enemiesData[i]
                const position = { x: Enime.position._x, y:  Enime.position._y }
                const EnimeDistance = this.GetDistancePoint(position, playerPosition)
                if (EnimeDistance==1){
                    return { bombermanAction: 5 }
                }
            }
        }
        
        if(bombs_count) {
            for (let i = 0; i < bombs_count; i++) {
                let BombDistance = 0;
                while (BombDistance!=2){
                    const bomb =  bombsData[i]
                    const position = { x: bomb.position._x, y:  bomb.position._y }
                    BombDistance = this.GetDistancePoint(position, playerPosition)
                    return { bombermanAction: this.GetRandomInt(1, 4) }
                }
            }
        }
        if(destructibleWalls_count) {
            for (let i = 0; i < destructibleWalls_count; i++) {
                const Wall = destructibleWallsData[i]
                const position = { x: Wall.position._x, y:  Wall.position._y }
                const WallDistance = this.GetDistancePoint(position, playerPosition)
                if (WallDistance==1){
                    return { bombermanAction: 5 }
                }
            }
        }
        return { bombermanAction: this.GetRandomInt(1, 4) }
    }
    
}