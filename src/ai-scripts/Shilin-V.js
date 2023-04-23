class Controller {
  Init(info) {
  }
  
  GetDistance(info) {
    let playerPos = info.mapData.playerData.position;
    let closestEnemy = null;
    let closestEnemyDist = Infinity;

    for (let enemy of Object.values(info.mapData.enemiesData)) {
      let dist = Math.hypot(
        playerPos._x - enemy.position._x,
        playerPos._y - enemy.position._y
      );

      if (dist < closestEnemyDist) {
        closestEnemy = enemy;
        closestEnemyDist = dist;
      }
    }

    return closestEnemy;
  }

  checkForMines(info) {
    let playerPos = info.mapData.playerData.position;
    
    if (console.log((info.mapData.bombsData).length === 0)) {
        return;
    }
    
    for (let bomb of Object.values(info.mapData.bombsData)) {
      let bombPos = bomb.position;

      if (Math.abs(playerPos._x - bombPos._x) <= 1 && Math.abs(playerPos._y - bombPos._y) <= 1) {
        return true;
      }
    }

    return false;
  }

  GetCommand(info) {
    let closestEnemy = this.GetDistance(info);

    if (closestEnemy) {
      let playerPos = info.mapData.playerData.position;
      let enemyPos = closestEnemy.position;
      let dx = playerPos._x - enemyPos._x;
      let dy = playerPos._y - enemyPos._y;

      if (this.checkForMines(info)) {
        let randomDirection = Math.floor(Math.random() * 4) + 1;
        return { bombermanAction: randomDirection };
      } else if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        return { bombermanAction: 5 }; // plant bomb
      } else if (Math.abs(dx) > Math.abs(dy)) {
        return { bombermanAction: dx > 0 ? 4 : 2 }; // move left or right
      } else {
        return { bombermanAction: dy > 0 ? 3 : 1 }; // move up or down
      }
    }
    
    return { bombermanAction: 0 }; // do nothing
  }
}