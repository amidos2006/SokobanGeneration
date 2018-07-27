declare interface Math{
    randObj:any;
    setRandomObject(randObj:any):void;
    randInt(maxValue:number):number;
    sign(value:number):number;
}

Math.setRandomObject = function(randObj:any):void{
    Math.randObj = randObj;
}

Math.random = function (): number {
    return Math.randObj.real(0, 1, false);
}

Math.randInt = function(maxValue:number):number {
    return Math.randObj.integer(0, maxValue - 1);
}

Math.sign = function(value:number):number{
    if(value < 0){
        return -1;
    }
    if(value > 0){
        return 1;
    }
    return 0;
}

class Global{
    public static getDirection(input:number):any{
        switch(input){
            case 0:
            return {x:-1, y:0};
            case 1:
            return {x:1, y:0};
            case 2:
            return {x:0, y:-1};
            case 3:
            return {x:0, y:1};
        }
        return {x:0, y:0};
    }

    public static getInput(x:number, y:number):number{
        if(x == 0){
            if(y > 0){
                return 3;
            }
            else if(y < 0){
                return 2;
            }
        }
        else if(y == 0){
            if (x > 0) {
                return 1;
            }
            else if (x < 0) {
                return 0;
            }
        }
        return -1;
    }

    public static getDistance(p1, p2){
        return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
    }

    private static getNearestObject(box, Objects){
        let boxLoc = box.getTile();
        let index = 0;
        let minDistance = Global.getDistance(boxLoc, Objects[index].getTile());
        for(let i=1; i<Objects.length; i++){
            let currentDistance = Global.getDistance(boxLoc, Objects[i].getTile());
            if(currentDistance < minDistance){
                minDistance = currentDistance;
                index = i;
            }
        }
        return index;
    }

    public static stringfy(sokoban):string{
        let result:string = "";
        let p = sokoban.player.getTile();
        result += p.x + "," + p.y;
        for(let b of sokoban.boulders){
            p = b.getTile();
            result += "," + p.x + "," + p.y;
        }
        return result;
    }

    public static stepsHeuristic(depth, sokoban):number{
        let result = depth / 10 + Global.averageDistance(sokoban) * sokoban.boulders.length;
        return 1 / (Math.log(result + 1) + 1);
    }

    public static solutionDistance(sol1:number[], sol2:number[]){
        let short: number[] = sol1;
        let long: number[] = sol2;
        if (long.length < short.length) {
            let temp = short;
            short = long;
            long = temp;
        }
        let minValue: number = Number.MAX_VALUE;
        let currentValue: number = 0;
        for (let i: number = 0; i < long.length - short.length + 1; i++) {
            currentValue = 0;
            for (let j: number = 0; j < short.length; j++) {
                if (short[j] != long[j + i]) {
                    currentValue += 1;
                }
            }
            if (currentValue < minValue) {
                minValue = currentValue;
            }
        }
        return minValue;
    }

    public static averageDistance(sokoban:any):number{
        let targets: any[] = [];
        for (let t of sokoban.targets) {
            targets.push(t);
        }
        let boxes: any[] = [];
        for (let b of sokoban.boulders) {
            boxes.push(b);
        }
        let result: number = 0;
        boxes.sort((a, b) => {
            let i1 = Global.getNearestObject(a, targets);
            let i2 = Global.getNearestObject(b, targets);
            return Global.getDistance(a.getTile(), targets[i1].getTile()) -
                Global.getDistance(b.getTile(), targets[i2].getTile());
        });
        for (let b of boxes) {
            let index = Global.getNearestObject(b, targets);
            result += Global.getDistance(b.getTile(), targets[index].getTile());
            targets.splice(index, 1);
        }
        return result / boxes.length;
    }

    public static rotateInput(sol:number[], angle:number):number[] {
        let mirror:number[] = [];
        for(let input of sol){
            let p: any = Global.getDirection(input);
            let np: any = {x:0, y:0};
            np.x = p.x * Math.cos(angle * Math.PI / 180) - p.y * Math.sin(angle * Math.PI / 180);
            np.y = p.x * Math.sin(angle * Math.PI / 180) + p.y * Math.cos(angle * Math.PI / 180);
            if(Math.abs(np.x) < 0.1){
                np.x = 0;
            }
            else{
                np.x = Math.sign(np.x);
            }
            if(Math.abs(np.y) < 0.1){
                np.y = 0;
            }
            else{
                np.y = Math.sign(np.y);
            }
            mirror.push(Global.getInput(np.x, np.y));
        }
        return mirror;
    }

    public static mirrorInput(sol: number[], hor: boolean, ver:boolean):number[] {
        let mirror:number[] = [];
        for(let input of sol){
            let p:any = Global.getDirection(input);
            if(hor){
                if(p.y == 0){
                    p.x *= -1;
                }
            }
            if(ver){
                if(p.x == 0){
                    p.y *= -1;
                }
            }
            mirror.push(Global.getInput(p.x, p.y));
        }
        return mirror;
    }

    public static sleep(amount) {
        var start = new Date().getTime();
        while (new Date().getTime() - start < amount);
    }
}