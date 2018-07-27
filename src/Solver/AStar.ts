class AStarNode{
    private _parent:AStarNode;
    private _children:AStarNode[];
    private _depth:number;
    private _estimate:number;
    private _sokoban:any;

    constructor(parent:AStarNode, sokoban:any){
        this._parent = parent;
        this._children = [];
        this._depth = 0;
        this._estimate = 0;
        if(parent != null){
            this._depth = parent._depth + 1;
        }
        this._sokoban = sokoban;
    }

    public get stateString():string{
        return Global.stringfy(this._sokoban);
    }

    public get isTerminal():boolean{
        return this._sokoban.checkWin();
    }

    public get estimate():number{
        return this._estimate;
    }

    public get depth():number{
        return this._depth;
    }

    public expand(heuristic:Function):AStarNode[]{
        for(let i:number=0; i<4; i++){
            let newState = this._sokoban.clone();
            let actionPair = Global.getDirection(i);
            newState.update(actionPair.x, actionPair.y, false);
            this._children[i] = new AStarNode(this, newState);
            this._children[i]._estimate = heuristic(this._children[i]._depth, this._children[i]._sokoban);
        }
        return this._children;
    }

    public getActionSequence(): number[] {
        let currentNode: AStarNode = this;
        let answer: number[] = [];
        while (currentNode._parent != null) {
            for (let i: number = 0; i < currentNode._parent._children.length; i++) {
                if (currentNode._parent._children[i] == currentNode) {
                    answer.push(i);
                    break;
                }
            }
            currentNode = currentNode._parent;
        }
        return answer.reverse();
    }

    public getBestFrontierNode():AStarNode{
        let current:AStarNode = this;
        let result:AStarNode = null;
        let queue:AStarNode[] = [current];
        while(queue.length > 0){
            current = queue.splice(0, 1)[0];
            if(current._children.length < 4 && (result == null || result._estimate < current._estimate)){
                result = current
            }
            for (let c of current._children){
                queue.push(c);
            }
        }
        return result;
    }
}

class AStar{
    private _heuristic:Function;

    constructor(args:any[]){
        this._heuristic = args[0];
    }

    solve(sokoban, maxNodes:number):number[]{
        let root:AStarNode = new AStarNode(null, sokoban.clone());
        let queue:AStarNode[] = [root];
        let visited: any = {};
        let numberOfExpandedNodes = 0;
        visited[Global.stringfy(sokoban)] = true;
        while (queue.length > 0 && numberOfExpandedNodes < maxNodes) {
            queue.sort((a, b)=>{
                return b.estimate - a.estimate;
            });
            let currentNode = queue.splice(0, 1)[0];
            if(currentNode.isTerminal){
                return currentNode.getActionSequence();
            }
            let nodes: AStarNode[] = currentNode.expand(this._heuristic);
            for (let n of nodes) {
                let currentState: string = n.stateString;
                if (!(currentState in visited)) {
                    visited[currentState] = true;
                    queue.push(n);
                    numberOfExpandedNodes += 1;
                }
            }
        }

        return root.getBestFrontierNode().getActionSequence();
    }
}