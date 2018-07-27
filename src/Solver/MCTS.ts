class MCTSNode{
    private _parent: MCTSNode;
    private _children: MCTSNode[];
    private _numVisits:number;
    private _totalValue:number;
    private _maxValue:number;
    private _depth:number;
    private _oldState:boolean;

    constructor(parent: MCTSNode, sokoban:any, visited:any){
        this._parent = parent;
        this._children = [];
        this._maxValue = 0;
        this._totalValue = 0;
        this._numVisits = 0;
        this._depth = 0;
        if(Global.stringfy(sokoban) in visited){
            this._oldState = true;
        }
        else{
            this._oldState = false;
            visited[Global.stringfy(sokoban)] = true;
        }
        if(parent != null){
            this._depth = this._parent._depth + 1;
        }
    }

    public get numVisits():number{
        return this._numVisits;
    }

    public get depth():number{
        return this._depth;
    }

    public get oldState():boolean{
        return this._oldState;
    }

    private isFullyExpanded(){
        return this._children.length >= 4;
    }

    private getUCBValue(C:number, Q:number):number{
        let averageValue:number = this._totalValue / this._numVisits;
        let maxValue:number = this._maxValue;
        let explorationValue:number = Math.sqrt(Math.log(this._parent._numVisits)/this._numVisits);
        return Q * maxValue + (1 - Q) * averageValue + C * explorationValue;
    }

    public getBestChild(C:number, Q:number):number{
        let bestChild:number = -1;
        let bestValue:number = -Number.MAX_VALUE;
        for(let i:number=0; i<this._children.length; i++){
            if(this._children[i]._oldState){
                continue;
            }
            let currentValue:number = this._children[i].getUCBValue(C, Q);
            if(currentValue > bestValue){
                bestValue = currentValue;
                bestChild = i;
            }
        }
        return bestChild;
    }

    public treepolicy(sokoban:any, C:number, Q:number, visited:any):MCTSNode{
        let currentNode:MCTSNode = this;
        while(!sokoban.checkWin() && currentNode.isFullyExpanded()){
            let action:number = currentNode.getBestChild(C, Q);
            if(action == -1){
                return currentNode;
            }
            currentNode = currentNode._children[action];
            let actionPair = Global.getDirection(action);
            sokoban.update(actionPair.x, actionPair.y , false);
        }
        if(sokoban.checkWin()){
            return currentNode;
        }
        return currentNode.expand(sokoban, visited);
    }

    private expand(sokoban:any, visited:any):MCTSNode{
        let action = this._children.length;
        let actionPair = Global.getDirection(action);
        sokoban.update(actionPair.x, actionPair.y, false);
        this._children.push(new MCTSNode(this, sokoban, visited));
        return this._children[action];
    }

    public rollout(sokoban:any, depth:number):void{
        for(let i:number=0; i<depth; i++){
            if(sokoban.checkWin()){
                break;
            }
            let actionPair = Global.getDirection(Math.randInt(4));
            sokoban.update(actionPair.x, actionPair.y, false);
        }
    }

    public backpropagate(value:number):void{
        let currentNode:MCTSNode = this;
        while(currentNode != null){
            currentNode._numVisits += 1;
            currentNode._totalValue += value;
            if(value > currentNode._maxValue){
                currentNode._maxValue = value;
            }
            if(currentNode.isFullyExpanded()){
                let oldState = true;
                for(let c of currentNode._children){
                    if(!c._oldState){
                        oldState = false;
                        break;
                    }
                }
                currentNode._oldState = oldState;
            }
            currentNode = currentNode._parent;
        }
    }

    public getActionSequence():number[]{
        let currentNode:MCTSNode = this;
        let answer:number[] = [];
        while(currentNode._parent != null){
            for(let i:number=0; i<currentNode._parent._children.length; i++){
                if(currentNode._parent._children[i] == currentNode){
                    answer.push(i);
                    break;
                }
            }
            currentNode = currentNode._parent;
        }
        return answer.reverse();
    }

    public getBestFrontierNode(): MCTSNode {
        let current: MCTSNode = this;
        let result: MCTSNode = null;
        let queue: MCTSNode[] = [current];
        while (queue.length > 0) {
            current = queue.splice(0, 1)[0];
            if (current._children.length < 4 && 
                (result == null || (result._totalValue / result._numVisits) < 
                (current._totalValue / current._numVisits))) {
                result = current
            }
            for (let c of current._children) {
                queue.push(c);
            }
        }
        return result;
    }
}

class MCTS{
    private C:number;
    private Q:number;
    private rolloutDepth:number;
    private heuristic:Function;

    constructor(args:any[]){
        this.C = args[0];
        this.Q = args[1];
        this.rolloutDepth = args[2];
        this.heuristic = args[3];
    }

    solve(sokoban, maxNodes:number):number[]{
        let visited:any = {};
        let root:MCTSNode = new MCTSNode(null, sokoban.clone(), visited);
        let numberOfExpandedNodes = 0;
        let anotherIteration:boolean = true;
        while(anotherIteration && numberOfExpandedNodes < maxNodes){
            let cloneGame = sokoban.clone();
            let currentNode = root.treepolicy(cloneGame, this.C, this.Q, visited);
            if(currentNode.numVisits == 0){
                numberOfExpandedNodes += 1;
            }
            if (cloneGame.checkWin()){
                return currentNode.getActionSequence();
            }
            currentNode.rollout(cloneGame, this.rolloutDepth);
            currentNode.backpropagate(this.heuristic(currentNode.depth, cloneGame));
            anotherIteration = !root.oldState;
        }
        
        return root.getBestFrontierNode().getActionSequence();
    }
}