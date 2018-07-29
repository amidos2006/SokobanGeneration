class Chromosome{
    private BOX:number = 0;
    private TARGET:number = 1;
    private BOX_TARGET:number = 2;
    private WALL:number = 3;
    private PLAYER: number = 4;
    private EMPTY:number = 9;

    private _genes: number[][];
    private _solution: number[];
    private _minLength:number;
    private _fitness:number;
    private _constraint:number;
    private _dimensions:number[];
    private _maxBoxes:number;

    constructor(width:number, height:number, minLength:number, maxBoxes:number){
        this._genes = [];
        for(let y:number=0; y<height; y++){
            this._genes.push([]);
            for(let x:number=0; x<width; x++){
                this._genes[y].push(9);
            }
        }
        this._minLength = minLength;
        this._maxBoxes = maxBoxes;
        this._solution = [];
    }

    get fitness():number{
        return this._fitness;
    }

    get constraint():number{
        return this._constraint;
    }

    get dimensions():number[]{
        return this._dimensions;
    }

    private getLocations(type):any[]{
        let results:any[] = [];
        for (let y: number = 0; y < this._genes.length; y++) {
            for (let x: number = 0; x < this._genes[y].length; x++) {
                if(this._genes[y][x] == type){
                    results.push({ x: x, y: y });
                }
            }
        }
        return results;
    }

    randomInitialize(wallPercentage:number, boxPercentage:number, maxBoxes:number):void{
        let numberOfWalls:number = 0;
        let targetBoxes:number = Math.randInt(maxBoxes) + 1;
        let targetTargets = targetBoxes;
        let currentBoxes:number = 0;
        let currentTargets:number = 0;
        for(let y:number=0; y<this._genes.length; y++){
            for(let x:number=0; x<this._genes[y].length; x++){
                if(this._genes.length * this._genes[y].length - numberOfWalls - currentBoxes < Math.abs(currentBoxes - currentTargets) + 2){
                    break;
                }
                if(Math.random() < wallPercentage){
                    this._genes[y][x] = this.WALL;
                    numberOfWalls += 1;
                }
                else if (targetBoxes - currentBoxes > 0 && Math.random() < boxPercentage){
                    if (Math.random() < 0.5) {
                        this._genes[y][x] = this.BOX;
                    }
                    else {
                        this._genes[y][x] = this.BOX_TARGET;
                        currentTargets += 1;
                    }
                    currentBoxes += 1;
                }
                else if (targetTargets - currentTargets > 0 && Math.random() < boxPercentage){
                    if (Math.random() < 0.5) {
                        this._genes[y][x] = this.TARGET;
                    }
                    else {
                        this._genes[y][x] = this.BOX_TARGET;
                        currentBoxes += 1;
                    }
                    currentTargets += 1;
                }
            }
        }
        let emptyTiles:any[] = this.getLocations(this.EMPTY);
        let location = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
        this._genes[location.y][location.x] = this.PLAYER;
        let difference:number = Math.abs(currentBoxes - currentTargets);
        for(let i:number =0; i<difference; i++){
            let location = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
            if(currentBoxes > currentTargets){
                this._genes[location.y][location.x] = this.TARGET;
            }
            else{
                this._genes[location.y][location.x] = this.BOX;
            }
        }
        this.fixChromosome();
    }

    stringInitialize(lines:string[]):void{
        for(let y:number=0; y<this._genes.length; y++){
            for(let x:number=0; x<this._genes[y].length; x++){
                switch(lines[y].charAt(x)){
                    case "o":
                        this._genes[y][x] = this.BOX;
                    break;
                    case "@":
                        this._genes[y][x] = this.BOX_TARGET;
                    break;
                    case "P":
                        this._genes[y][x] = this.PLAYER;
                    break;
                    case "x":
                        this._genes[y][x] = this.TARGET;
                    break;
                    case "#":
                        this._genes[y][x] = this.WALL;
                    break;
                    default:
                        this._genes[y][x] = this.EMPTY;
                    break;
                }
            }
        }
    }

    set solution(value:string){
        let values:string[] = value.split(",");
        this._solution = [];
        for(let v of values){
            this._solution.push(parseInt(v));
        }
    }

    get solution():string{
        if(this._solution.length <= 0){
            return "";
        }
        let result:string = this._solution[0].toString();
        for(let i=1; i<this._solution.length; i++){
            result += "," + this._solution[i];
        }
        return result;
    }

    private stateInitialize(state:any):void{
        let result:number[][] = [];
        for (let y: number = 0; y < this._genes.length + 2; y++) {
            result.push([]);
            for (let x: number = 0; x < this._genes[0].length + 2; x++) {
                if(x == 0 || y == 0 || y == this._genes.length + 1 || x == this._genes[0].length + 1){
                    result[y].push(3);
                    continue;
                }
                result[y].push(this._genes[y - 1][x - 1]);
            }
        }
        state.initialize(result);
    }

    clone():Chromosome{
        let clone:Chromosome = new Chromosome(this._genes[0].length, 
            this._genes.length, this._minLength, this._maxBoxes);
        for(let y:number=0; y<this._genes.length; y++){
            for(let x:number=0; x<this._genes[y].length; x++){
                clone._genes[y][x] = this._genes[y][x];
            }
        }
        return clone;
    }

    private fixChromosome(): void {
        let emptyTiles = this.getLocations(this.EMPTY).concat(this.getLocations(this.WALL));
        let playerTiles = this.getLocations(this.PLAYER);
        if(playerTiles.length == 0){
            let tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
            if(tile != null){
                tile = { x: Math.randInt(this._genes[0].length), y: Math.randInt(this._genes.length)};
            }
            this._genes[tile.y][tile.x] = this.PLAYER;
        }
        if(playerTiles.length > 1){
            while(playerTiles.length > 1){
                let tile = playerTiles.splice(Math.randInt(playerTiles.length), 1)[0];
                this._genes[tile.y][tile.x] = this.EMPTY;
            }
        }
        emptyTiles = this.getLocations(this.EMPTY).concat(this.getLocations(this.WALL));
        let boxTiles = this.getLocations(this.BOX);
        let targetTiles = this.getLocations(this.TARGET);
        if (boxTiles.length == 0) {
            let tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
            if(tile == null){
                tile = targetTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
            }
            this._genes[tile.y][tile.x] = this.BOX;
        }
        if (targetTiles.length == 0) {
            let tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
            if(tile == null){
                tile = targetTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
                
            }
            this._genes[tile.y][tile.x] = this.TARGET;
        }
        boxTiles = this.getLocations(this.BOX);
        targetTiles = this.getLocations(this.TARGET);
        let boxNumber = boxTiles.length;
        let targetNumber = targetTiles.length;
        if(Math.abs(boxNumber - targetNumber) > 0){
            for (let i = 0; i < Math.abs(boxNumber - targetNumber); i++){
                if(boxNumber > targetNumber){
                    let tile = boxTiles.splice(Math.randInt(boxTiles.length), 1)[0];
                    this._genes[tile.y][tile.x] = this.EMPTY;
                }
                else{
                    let tile = targetTiles.splice(Math.randInt(targetTiles.length), 1)[0];
                    this._genes[tile.y][tile.x] = this.EMPTY;
                }
            }
        }
    }

    crossover(c:Chromosome):Chromosome{
        let child:Chromosome = this.clone();
        let p1 = { x: Math.randInt(child._genes[0].length), y: Math.randInt(child._genes.length) };
        let p2 = { x: Math.randInt(child._genes[0].length), y: Math.randInt(child._genes.length) };
        if(p1.x > p2.x){
            let temp = p1.x;
            p1.x = p2.x;
            p2.x = temp;
        }
        if (p1.y > p2.y) {
            let temp = p1.y;
            p1.y = p2.y;
            p2.y = temp;
        }
        for(let y = p1.y; y <= p2.y; y++){
            for (let x = p1.x; x <= p2.x; x++) {
                child._genes[y][x] = c._genes[y][x];
            }
        }
        child.fixChromosome();
        return child;
    }

    mutate(layout:number = 1, player:number = 1, boxTarget:number = 1, swap:number = 1):Chromosome{
        let c:Chromosome = this.clone();
        let prob:number = Math.random();
        let total: number = layout + player + boxTarget + swap;
        if(prob < layout / total){
            let emptyTiles = c.getLocations(c.EMPTY);
            let solidTiles = c.getLocations(c.WALL);
            let randomValue = Math.random();
            if((randomValue < 0.5 || solidTiles.length > 0) && emptyTiles.length > 2){
                let tile = emptyTiles[Math.randInt(emptyTiles.length)];
                c._genes[tile.y][tile.x] = c.WALL;
            }
            else if(solidTiles.length > 0){
                let tile = solidTiles[Math.randInt(solidTiles.length)];
                c._genes[tile.y][tile.x] = c.EMPTY;
            }
        }
        else if(prob < (layout + player) / total){
            let playerTile = c.getLocations(c.PLAYER)[0];
            let emptyTiles = c.getLocations(c.EMPTY);
            if(emptyTiles.length > 0){
                c._genes[playerTile.y][playerTile.x] = c.EMPTY;
                playerTile = emptyTiles[Math.randInt(emptyTiles.length)];
                c._genes[playerTile.y][playerTile.x] = c.PLAYER;
            }
        }
        else if (prob < (layout + player + boxTarget) / total) {
            let emptyTiles = c.getLocations(c.EMPTY);
            let boxTiles = c.getLocations(c.BOX);
            let targetTiles = c.getLocations(c.TARGET);
            let boxTargetTiles = c.getLocations(c.BOX_TARGET);
            let randomValue = Math.random();
            if(emptyTiles.length > 2 && randomValue < 0.5){
                if(Math.random() < 0.5){
                    let tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.BOX;
                    tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.TARGET;
                }
                else{
                    let tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.BOX_TARGET;
                }
            }
            else if(boxTiles.length > 1){
                if (boxTargetTiles.length > 0 && Math.random() < 0.5) {
                    let tile = boxTargetTiles.splice(Math.randInt(boxTargetTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.EMPTY;
                }
                else{
                    let tile = boxTiles.splice(Math.randInt(boxTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.EMPTY;
                    tile = targetTiles.splice(Math.randInt(targetTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.EMPTY;
                }
            }
        }
        else{
            let tile1 = { x: Math.randInt(c._genes[0].length), y: Math.randInt(c._genes.length) };
            let tile2 = { x: Math.randInt(c._genes[0].length), y: Math.randInt(c._genes.length) };
            let temp = c._genes[tile1.y][tile1.x]
            c._genes[tile1.y][tile1.x] = c._genes[tile2.y][tile2.x];
            c._genes[tile2.y][tile2.x] = temp;
        }

        return c;
    }

    calculateSolution(Sokoban:any, agent:any, maxNodes:number):void{
        let state:any = new Sokoban(null);
        this.stateInitialize(state);
        this._solution = agent.solve(state, maxNodes);
    }

    private averageBranching(state:any):number{
        let visited:any = {};
        visited[Global.stringfy(state)] = true;
        let result:number = 0;
        for (let i of this._solution) {
            let possibleDir:number = 0;
            for(let i:number=0; i<4; i++){
                let dir:any = Global.getDirection(i);
                let tempState:any = state.clone();
                tempState.update(dir.x, dir.y, false);
                if(!(Global.stringfy(tempState) in visited)){
                    visited[Global.stringfy(tempState)] = true;
                    possibleDir += 1;
                }
            }
            result += possibleDir;
            let dir: any = Global.getDirection(i);
            state.update(dir.x, dir.y, false);
        }
        return result / (4 * this._solution.length);
    }

    private averagePushes(state:any):number{
        let prevState = state.clone();
        let movedIndex = {};
        let result:number = 0;
        for (let i of this._solution) {
            let dir: any = Global.getDirection(i);
            state.update(dir.x, dir.y, false);
            for(let i=0; i<state.boulders.length; i++){
                let b1 = state.boulders[i];
                let b2 = prevState.boulders[i];
                if(b1.x != b2.x || b1.y != b2.y){
                    result += 1;
                    if(!(i.toString() in movedIndex)){
                        movedIndex[i.toString()] = true;
                    }
                    continue;
                }
            }
            prevState = state.clone();
        }
        return Math.min(1, (Object.keys(movedIndex).length) / (this._maxBoxes));
    }

    private calculateBoxFreedom(box:any, boxes:any[], walls:any[]):number{
        let solids:any[] = boxes.concat(walls);
        let result:number = 4;
        for(let s of solids){
            if(s == box){
                continue;
            }
            let p1:any = box.getTile();
            let p2:any = s.getTile();
            let dist:number = Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
            if(dist == 1){
                result -= 1;
            }
        }
        return result;
    }

    private averageBoxFreedom(state:any):number{
        let result: number = 0;
        for (let i of this._solution) {
            let currentFreedom:number = 0;
            for(let b of state.boulders){
                currentFreedom += this.calculateBoxFreedom(b, state.boulders, state.walls);
            }
            result += currentFreedom / state.boulders.length;
            let dir: any = Global.getDirection(i);
            state.update(dir.x, dir.y, false);
        }
        return result / (4 * this._solution.length);
    }

    private numberOfBoxes():number{
        let result: number = 0;
        for(let y:number=0; y<this._genes.length; y++){
            for(let x:number=0; x<this._genes[y].length; x++){
                if(this._genes[y][x] == 0 || this._genes[y][x] == 2){
                    result += 1;
                }
            }
        }
        return result;
    }

    private numberOfTargets():number{
        let result: number = 0;
        for (let y: number = 0; y < this._genes.length; y++) {
            for (let x: number = 0; x < this._genes[y].length; x++) {
                if (this._genes[y][x] == 1 || this._genes[y][x] == 2) {
                    result += 1;
                }
            }
        }
        return result;
    }

    private calculateNumberOfGoals():number{
        return Math.min(1, (this.numberOfBoxes() + this.numberOfTargets()) / (2 * this._maxBoxes));
    }

    calculateDimensions(Sokoban:any):void{
        let state: any = new Sokoban(null);
        this.stateInitialize(state);
        this._dimensions = [
            this.averageBranching(state.clone()), 
            this.averagePushes(state.clone()), 
            this.averageBoxFreedom(state.clone())
        ];
    }

    calculateConstraints(Sokoban:any):void{
        let state:any = new Sokoban(null);
        this.stateInitialize(state);
        for (let i of this._solution) {
            let dir: any = Global.getDirection(i);
            state.update(dir.x, dir.y, false);
        }
        let solutionFitness = 1 - Global.averageDistance(state) / (this._genes.length + this._genes[0].length);
        this._constraint = solutionFitness * Math.min(1, this._solution.length / this._minLength);
    }

    calculateFitness(pop:Chromosome[]):void{
        if(pop.length < 1){
            this._fitness = 1;
            return;
        }

        let alternation: number[][] = [
            this._solution,
            Global.mirrorInput(this._solution, true, false), 
            Global.mirrorInput(this._solution, false, true),
            Global.mirrorInput(this._solution, true, true),
            Global.rotateInput(this._solution, 90),
            Global.rotateInput(this._solution, -90)
        ];
        let finalMin:number = Number.MAX_VALUE;
        for(let p of pop){
            if(this == p){
                continue;
            }
            let minValue: number = Number.MAX_VALUE;
            for(let s of alternation){
                let currentValue: number = Global.solutionDistance(s, p._solution);
                if (currentValue < minValue) {
                    minValue = currentValue;
                }
            }
            if(minValue < finalMin){
                finalMin = minValue;
            }
        }

        this._fitness = finalMin / this._solution.length;
    }

    toString():string{
        let result:string = "";
        for(let y:number=0; y<this._genes.length; y++){
            let line:string = "";
            for(let x:number=0; x<this._genes[y].length; x++){
                switch(this._genes[y][x]){
                    case this.BOX:
                    line += "o";
                    break;
                    case this.TARGET:
                    line += "x";
                    break;
                    case this.BOX_TARGET:
                    line += "@";
                    break;
                    case this.WALL:
                    line += "#";
                    break;
                    case this.PLAYER:
                    line += "P";
                    break;
                    default:
                    line += ".";
                    break;
                }
            }
            result += line + "\n";
        }
        return result;
    }
}