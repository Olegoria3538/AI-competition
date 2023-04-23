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

    class Point {
        constructor(x, y) {
            this._x = x;
            this._y = y;
        }
        
        static create(x, y) {
            return {_x: x, _y: y};
        }

        static equal(pointA, pointB) {
            return pointA._x === pointB._x && pointA._y === pointB._y;
        }
        
        static minDistant(pointA, pointB) {
            return Math.min(Math.abs(pointA.x - pointB.x), Math.abs(pointA.y - pointB.y));
        }

        static sum(pointA, pointB) {
            return {_x: pointA._x + pointB._x, _y: pointA._y + pointB._y};
        }

        static div(pointA, intB) {
            return {_x: parseInt(pointA._x / intB), _y: parseInt(pointA._y / intB)};
        }
    }

    function print(n, action) {
        switch(action) {
            case 1:
                console.log(n + ' ↓');
                break;
            case 2:
                console.log(n + ' →');
                break;
            case 3:
                console.log(n + ' ↑');
                break;
            case 4:
                console.log(n + ' ←');
                break;
        }
    }

    function shuffle(array) {
        array.sort(() => Math.random() - 0.5);
    }

    class Controller { 
        Init(info) {}

        IsMapCellFree(position) {
            return !this.map[position._x][position._y] || this.map[position._x][position._y].length === 0;
        }

        IsMapCellHasEnemy(position) {
            return !!this.map[position._x][position._y] && !!this.map[position._x][position._y][0].health;
        }
        
        GetDangerousBombIds(bombsData, playerData) {
            dangerousBombIds = Array();
            bombsData.forEach(function callback(currentValue, index) {
                if (currentValue.turnToExplosion < 5 && Point.getMinDistant(playerData.position, currentValue.position)) {
                    dangerousBombIds.push(index)
                }
            });
        }
        
        BFS(start, enemiesData, withBomb) {
            // console.log('BFS' + withBomb);
            let path = [];
            let queue = [[start, Point.create(0, 0), []]], seen = [...Array(this.x_length)].map(e => []), enemies = [...Array(this.x_length)].map(e => []);
            const directions = [Point.create(0, -1), Point.create(-1, 0), Point.create(1, 0), Point.create(0, 1)];
            enemiesData.forEach((currentValue, index) => {
                enemies[currentValue.position._x][currentValue.position._y] = true;
            });
        
            while (queue && queue.length > 0) {
                let [curVert, step, [...path]] = queue.shift();
                path.push(step);
                curVert = Point.sum(curVert, step);
                if (enemies[curVert._x][curVert._y]) {
                    path.shift();
                    return path;
                }
        
                if (!seen[curVert._x][curVert._y] && 
                    ((!withBomb && (this.IsMapCellFree(curVert) || Point.equal(start, curVert))) 
                        || (withBomb && !this.const_walls[curVert._x][curVert._y]))) {
                    for (let element of directions) {
                        queue.push([curVert, element, [...path]]);
                    }
                }
                seen[curVert._x][curVert._y] = true;
            }
        }
        
        GetRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        }

        RunFrom(player_position, infoBombsData, random=false) {
            let bombsData = [...Array(this.x_length)].map(e => []);
            infoBombsData.forEach(function callback(currentValue) {
                bombsData[currentValue.position._x][currentValue.position._y] = currentValue.turnToExplosion;
            });

            const shuffle_step2_and_type = [[Point.create(0, -2), 2], [Point.create(-2, 0), 2], [Point.create(2, 0), 2], [Point.create(0, 2), 2], [Point.create(-1,-1), 1], [Point.create(-1,1), 1], [Point.create(1,-1), 1], [Point.create(1,1), 1]];
            if (random) {
                shuffle(shuffle_step2_and_type);
            }
            for (const [step2, type] of shuffle_step2_and_type) {
                const after_step2 = Point.sum(player_position, step2);
                if (after_step2._x < 0 || after_step2._y < 0 || after_step2._x >= this.map.length  || after_step2.y >= this.map[0].length) {
                    continue;
                }
                // TODO: change see bomb data
                if (this.IsMapCellFree(after_step2)) {
                    if (type === 1) {
                        const w2f_p = [Point.create(step2._x, 0), Point.create(0, step2._y)];
                        for (const i in w2f_p) {
                            const as = Point.sum(player_position, w2f_p[i]);
                            if (this.IsMapCellFree(as)) {
                                this.precalculated_way = [w2f_p[i], w2f_p[1-i]];
                                return;
                            }
                        }
                    } else {
                        const s = Point.div(step2, 2);
                        const as = Point.sum(player_position, s);
                        if (this.IsMapCellFree(as)) {
                            this.precalculated_way = [s, s];
                            return;
                        }
                    }
                }
            }

            this.precalculated_way = [this.path[this.path.length - 1]];
        }

        GetActionFromStep(step) {
            if (step._x === 0) {
                if (step._y === -1) return 3;
                if (step._y === 1) return 1;
            }
            if (step._y === 0) {
                if (step._x === 1) return 2;
                if (step._x === -1) return 4;
            }
            return 0;
        }

        GetBomberManAction(info) {
            // RUN FROM BOMB
            
            if (this.precalculated_way && this.precalculated_way.length > 0) {
                if (this.precalculated_way.length === 2) {
                    this.walls = null;
                }
                return this.GetActionFromStep(this.precalculated_way.shift());
            }

            if (!this.path) {
                this.path = [];
            }
            if (!this.current_moment) {
                this.current_moment = 0;
            }
            if (!this.y_length) {
                this.x_length = info.mapData.map.length;
                this.y_length = info.mapData.map[0].length;
            }
            this.current_moment++;
            this.map = info.mapData.map;

            if (!this.walls || this.wall_save_moment + 10 < this.current_moment) {
                let walls = [...Array(this.x_length)].map(e => []);
                info.mapData.destructibleWallsData.forEach(function callback(currentValue) {
                    walls[currentValue.position._x][currentValue.position._y] = true;
                });
                this.walls = walls;
                this.wall_save_moment = this.current_moment;
            }

            if (!this.const_walls) {
                let const_walls = [...Array(this.x_length)].map(e => []);
                info.mapData.simpleWallsData.forEach(function callback(currentValue) {
                    const_walls[currentValue.position._x][currentValue.position._y] = true;
                });
                this.const_walls = const_walls;
            }
            
            // BFS

            if (!this.path || this.path.length === 0) {
                this.path = this.BFS(info.mapData.playerData.position, info.mapData.enemiesData, false);
                if (!this.path || !this.path.length) {
                    this.path = this.BFS(info.mapData.playerData.position, info.mapData.enemiesData, true);
                }
            }

            // PATH

            if (this.path && this.path.length > 0){
                const player_position = info.mapData.playerData.position;
                let next_point = Point.sum(player_position, this.path[0]);

                if (this.walls[next_point._x][next_point._y]) {
                    // console.log('next wall');
                    this.RunFrom(player_position, info.mapData.bombsData);
                    this.path = null;
                    return 5;
                }

                if (this.path.length == 1) {
                    this.path = null;
                    if (this.IsMapCellHasEnemy(next_point)) {
                        this.RunFrom(player_position, info.mapData.bombsData, true);
                        return 5;
                    } else {
                        return 0;
                    }
                }
                return this.GetActionFromStep(this.path.shift());
            }
            
            // console.log('random');
            return this.GetRandomInt(0, 5);
        }
        
        GetCommand(info) {

            let action = this.GetBomberManAction(info);
            
            return { bombermanAction: action };
        }
    } 
