var MCTSNode = (function () {
    function MCTSNode(parent, sokoban, visited) {
        this._parent = parent;
        this._children = [];
        this._maxValue = 0;
        this._totalValue = 0;
        this._numVisits = 0;
        this._depth = 0;
        if (Global.stringfy(sokoban) in visited) {
            this._oldState = true;
        }
        else {
            this._oldState = false;
            visited[Global.stringfy(sokoban)] = true;
        }
        if (parent != null) {
            this._depth = this._parent._depth + 1;
        }
    }
    Object.defineProperty(MCTSNode.prototype, "numVisits", {
        get: function () {
            return this._numVisits;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MCTSNode.prototype, "depth", {
        get: function () {
            return this._depth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MCTSNode.prototype, "oldState", {
        get: function () {
            return this._oldState;
        },
        enumerable: true,
        configurable: true
    });
    MCTSNode.prototype.isFullyExpanded = function () {
        return this._children.length >= 4;
    };
    MCTSNode.prototype.getUCBValue = function (C, Q) {
        var averageValue = this._totalValue / this._numVisits;
        var maxValue = this._maxValue;
        var explorationValue = Math.sqrt(Math.log(this._parent._numVisits) / this._numVisits);
        return Q * maxValue + (1 - Q) * averageValue + C * explorationValue;
    };
    MCTSNode.prototype.getBestChild = function (C, Q) {
        var bestChild = -1;
        var bestValue = -Number.MAX_VALUE;
        for (var i = 0; i < this._children.length; i++) {
            if (this._children[i]._oldState) {
                continue;
            }
            var currentValue = this._children[i].getUCBValue(C, Q);
            if (currentValue > bestValue) {
                bestValue = currentValue;
                bestChild = i;
            }
        }
        return bestChild;
    };
    MCTSNode.prototype.treepolicy = function (sokoban, C, Q, visited) {
        var currentNode = this;
        while (!sokoban.checkWin() && currentNode.isFullyExpanded()) {
            var action = currentNode.getBestChild(C, Q);
            if (action == -1) {
                return currentNode;
            }
            currentNode = currentNode._children[action];
            var actionPair = Global.getDirection(action);
            sokoban.update(actionPair.x, actionPair.y, false);
        }
        if (sokoban.checkWin()) {
            return currentNode;
        }
        return currentNode.expand(sokoban, visited);
    };
    MCTSNode.prototype.expand = function (sokoban, visited) {
        var action = this._children.length;
        var actionPair = Global.getDirection(action);
        sokoban.update(actionPair.x, actionPair.y, false);
        this._children.push(new MCTSNode(this, sokoban, visited));
        return this._children[action];
    };
    MCTSNode.prototype.rollout = function (sokoban, depth) {
        for (var i = 0; i < depth; i++) {
            if (sokoban.checkWin()) {
                break;
            }
            var actionPair = Global.getDirection(Math.randInt(4));
            sokoban.update(actionPair.x, actionPair.y, false);
        }
    };
    MCTSNode.prototype.backpropagate = function (value) {
        var currentNode = this;
        while (currentNode != null) {
            currentNode._numVisits += 1;
            currentNode._totalValue += value;
            if (value > currentNode._maxValue) {
                currentNode._maxValue = value;
            }
            if (currentNode.isFullyExpanded()) {
                var oldState = true;
                for (var _i = 0, _a = currentNode._children; _i < _a.length; _i++) {
                    var c = _a[_i];
                    if (!c._oldState) {
                        oldState = false;
                        break;
                    }
                }
                currentNode._oldState = oldState;
            }
            currentNode = currentNode._parent;
        }
    };
    MCTSNode.prototype.getActionSequence = function () {
        var currentNode = this;
        var answer = [];
        while (currentNode._parent != null) {
            for (var i = 0; i < currentNode._parent._children.length; i++) {
                if (currentNode._parent._children[i] == currentNode) {
                    answer.push(i);
                    break;
                }
            }
            currentNode = currentNode._parent;
        }
        return answer.reverse();
    };
    MCTSNode.prototype.getBestFrontierNode = function () {
        var current = this;
        var result = null;
        var queue = [current];
        while (queue.length > 0) {
            current = queue.splice(0, 1)[0];
            if (current._children.length < 4 &&
                (result == null || (result._totalValue / result._numVisits) <
                    (current._totalValue / current._numVisits))) {
                result = current;
            }
            for (var _i = 0, _a = current._children; _i < _a.length; _i++) {
                var c = _a[_i];
                queue.push(c);
            }
        }
        return result;
    };
    return MCTSNode;
}());
var MCTS = (function () {
    function MCTS(args) {
        this.C = args[0];
        this.Q = args[1];
        this.rolloutDepth = args[2];
        this.heuristic = args[3];
    }
    MCTS.prototype.solve = function (sokoban, maxNodes) {
        var visited = {};
        var root = new MCTSNode(null, sokoban.clone(), visited);
        var numberOfExpandedNodes = 0;
        var anotherIteration = true;
        while (anotherIteration && numberOfExpandedNodes < maxNodes) {
            var cloneGame = sokoban.clone();
            var currentNode = root.treepolicy(cloneGame, this.C, this.Q, visited);
            if (currentNode.numVisits == 0) {
                numberOfExpandedNodes += 1;
            }
            if (cloneGame.checkWin()) {
                return currentNode.getActionSequence();
            }
            currentNode.rollout(cloneGame, this.rolloutDepth);
            currentNode.backpropagate(this.heuristic(currentNode.depth, cloneGame));
            anotherIteration = !root.oldState;
        }
        return root.getBestFrontierNode().getActionSequence();
    };
    return MCTS;
}());
var AStarNode = (function () {
    function AStarNode(parent, sokoban) {
        this._parent = parent;
        this._children = [];
        this._depth = 0;
        this._estimate = 0;
        if (parent != null) {
            this._depth = parent._depth + 1;
        }
        this._sokoban = sokoban;
    }
    Object.defineProperty(AStarNode.prototype, "stateString", {
        get: function () {
            return Global.stringfy(this._sokoban);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AStarNode.prototype, "isTerminal", {
        get: function () {
            return this._sokoban.checkWin();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AStarNode.prototype, "estimate", {
        get: function () {
            return this._estimate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AStarNode.prototype, "depth", {
        get: function () {
            return this._depth;
        },
        enumerable: true,
        configurable: true
    });
    AStarNode.prototype.expand = function (heuristic) {
        for (var i = 0; i < 4; i++) {
            var newState = this._sokoban.clone();
            var actionPair = Global.getDirection(i);
            newState.update(actionPair.x, actionPair.y, false);
            this._children[i] = new AStarNode(this, newState);
            this._children[i]._estimate = heuristic(this._children[i]._depth, this._children[i]._sokoban);
        }
        return this._children;
    };
    AStarNode.prototype.getActionSequence = function () {
        var currentNode = this;
        var answer = [];
        while (currentNode._parent != null) {
            for (var i = 0; i < currentNode._parent._children.length; i++) {
                if (currentNode._parent._children[i] == currentNode) {
                    answer.push(i);
                    break;
                }
            }
            currentNode = currentNode._parent;
        }
        return answer.reverse();
    };
    AStarNode.prototype.getBestFrontierNode = function () {
        var current = this;
        var result = null;
        var queue = [current];
        while (queue.length > 0) {
            current = queue.splice(0, 1)[0];
            if (current._children.length < 4 && (result == null || result._estimate < current._estimate)) {
                result = current;
            }
            for (var _i = 0, _a = current._children; _i < _a.length; _i++) {
                var c = _a[_i];
                queue.push(c);
            }
        }
        return result;
    };
    return AStarNode;
}());
var AStar = (function () {
    function AStar(args) {
        this._heuristic = args[0];
    }
    AStar.prototype.solve = function (sokoban, maxNodes) {
        var root = new AStarNode(null, sokoban.clone());
        var queue = [root];
        var visited = {};
        var numberOfExpandedNodes = 0;
        visited[Global.stringfy(sokoban)] = true;
        while (queue.length > 0 && numberOfExpandedNodes < maxNodes) {
            queue.sort(function (a, b) {
                return b.estimate - a.estimate;
            });
            var currentNode = queue.splice(0, 1)[0];
            if (currentNode.isTerminal) {
                return currentNode.getActionSequence();
            }
            var nodes = currentNode.expand(this._heuristic);
            for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                var n = nodes_1[_i];
                var currentState = n.stateString;
                if (!(currentState in visited)) {
                    visited[currentState] = true;
                    queue.push(n);
                    numberOfExpandedNodes += 1;
                }
            }
        }
        return root.getBestFrontierNode().getActionSequence();
    };
    return AStar;
}());
var BFSNode = (function () {
    function BFSNode(parent, sokoban) {
        this._parent = parent;
        this._children = [];
        this._depth = 0;
        if (parent != null) {
            this._depth = parent._depth + 1;
        }
        this._sokoban = sokoban;
    }
    Object.defineProperty(BFSNode.prototype, "stateString", {
        get: function () {
            return Global.stringfy(this._sokoban);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BFSNode.prototype, "isTerminal", {
        get: function () {
            return this._sokoban.checkWin();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BFSNode.prototype, "depth", {
        get: function () {
            return this._depth;
        },
        enumerable: true,
        configurable: true
    });
    BFSNode.prototype.expand = function (heuristic) {
        for (var i = 0; i < 4; i++) {
            var newState = this._sokoban.clone();
            var actionPair = Global.getDirection(i);
            newState.update(actionPair.x, actionPair.y, false);
            this._children[i] = new BFSNode(this, newState);
            this._children[i]._estimate = heuristic(this._children[i]._depth, this._children[i]._sokoban);
        }
        return this._children;
    };
    BFSNode.prototype.getActionSequence = function () {
        var currentNode = this;
        var answer = [];
        while (currentNode._parent != null) {
            for (var i = 0; i < currentNode._parent._children.length; i++) {
                if (currentNode._parent._children[i] == currentNode) {
                    answer.push(i);
                    break;
                }
            }
            currentNode = currentNode._parent;
        }
        return answer.reverse();
    };
    BFSNode.prototype.getBestFrontierNode = function () {
        var current = this;
        var result = null;
        var queue = [current];
        while (queue.length > 0) {
            current = queue.splice(0, 1)[0];
            if (current._children.length < 4 && (result == null || result._estimate < current._estimate)) {
                result = current;
            }
            for (var _i = 0, _a = current._children; _i < _a.length; _i++) {
                var c = _a[_i];
                queue.push(c);
            }
        }
        return result;
    };
    return BFSNode;
}());
var BFS = (function () {
    function BFS(args) {
        this._heuristic = args[0];
    }
    BFS.prototype.solve = function (sokoban, maxNodes) {
        var root = new BFSNode(null, sokoban.clone());
        var queue = [root];
        var visited = {};
        var numberOfExpandedNodes = 0;
        visited[Global.stringfy(sokoban)] = true;
        while (queue.length > 0 && numberOfExpandedNodes < maxNodes) {
            var currentNode = queue.splice(0, 1)[0];
            if (currentNode.isTerminal) {
                return currentNode.getActionSequence();
            }
            var nodes = currentNode.expand(this._heuristic);
            for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
                var n = nodes_2[_i];
                var currentState = n.stateString;
                if (!(currentState in visited)) {
                    visited[currentState] = true;
                    queue.push(n);
                    numberOfExpandedNodes += 1;
                }
            }
        }
        return root.getBestFrontierNode().getActionSequence();
    };
    return BFS;
}());
Math.setRandomObject = function (randObj) {
    Math.randObj = randObj;
};
Math.random = function () {
    return Math.randObj.real(0, 1, false);
};
Math.randInt = function (maxValue) {
    return Math.randObj.integer(0, maxValue - 1);
};
Math.sign = function (value) {
    if (value < 0) {
        return -1;
    }
    if (value > 0) {
        return 1;
    }
    return 0;
};
var Global = (function () {
    function Global() {
    }
    Global.getDirection = function (input) {
        switch (input) {
            case 0:
                return { x: -1, y: 0 };
            case 1:
                return { x: 1, y: 0 };
            case 2:
                return { x: 0, y: -1 };
            case 3:
                return { x: 0, y: 1 };
        }
        return { x: 0, y: 0 };
    };
    Global.getInput = function (x, y) {
        if (x == 0) {
            if (y > 0) {
                return 3;
            }
            else if (y < 0) {
                return 2;
            }
        }
        else if (y == 0) {
            if (x > 0) {
                return 1;
            }
            else if (x < 0) {
                return 0;
            }
        }
        return -1;
    };
    Global.getDistance = function (p1, p2) {
        return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
    };
    Global.getNearestObject = function (box, Objects) {
        var boxLoc = box.getTile();
        var index = 0;
        var minDistance = Global.getDistance(boxLoc, Objects[index].getTile());
        for (var i = 1; i < Objects.length; i++) {
            var currentDistance = Global.getDistance(boxLoc, Objects[i].getTile());
            if (currentDistance < minDistance) {
                minDistance = currentDistance;
                index = i;
            }
        }
        return index;
    };
    Global.stringfy = function (sokoban) {
        var result = "";
        var p = sokoban.player.getTile();
        result += p.x + "," + p.y;
        for (var _i = 0, _a = sokoban.boulders; _i < _a.length; _i++) {
            var b = _a[_i];
            p = b.getTile();
            result += "," + p.x + "," + p.y;
        }
        return result;
    };
    Global.stepsHeuristic = function (depth, sokoban) {
        var result = depth / 10 + Global.averageDistance(sokoban) * sokoban.boulders.length;
        return 1 / (Math.log(result + 1) + 1);
    };
    Global.solutionDistance = function (sol1, sol2) {
        var short = sol1;
        var long = sol2;
        if (long.length < short.length) {
            var temp = short;
            short = long;
            long = temp;
        }
        var minValue = Number.MAX_VALUE;
        var currentValue = 0;
        for (var i = 0; i < long.length - short.length + 1; i++) {
            currentValue = 0;
            for (var j = 0; j < short.length; j++) {
                if (short[j] != long[j + i]) {
                    currentValue += 1;
                }
            }
            if (currentValue < minValue) {
                minValue = currentValue;
            }
        }
        return minValue;
    };
    Global.averageDistance = function (sokoban) {
        var targets = [];
        for (var _i = 0, _a = sokoban.targets; _i < _a.length; _i++) {
            var t = _a[_i];
            targets.push(t);
        }
        var boxes = [];
        for (var _b = 0, _c = sokoban.boulders; _b < _c.length; _b++) {
            var b = _c[_b];
            boxes.push(b);
        }
        var result = 0;
        boxes.sort(function (a, b) {
            var i1 = Global.getNearestObject(a, targets);
            var i2 = Global.getNearestObject(b, targets);
            return Global.getDistance(a.getTile(), targets[i1].getTile()) -
                Global.getDistance(b.getTile(), targets[i2].getTile());
        });
        for (var _d = 0, boxes_1 = boxes; _d < boxes_1.length; _d++) {
            var b = boxes_1[_d];
            var index = Global.getNearestObject(b, targets);
            result += Global.getDistance(b.getTile(), targets[index].getTile());
            targets.splice(index, 1);
        }
        return result / boxes.length;
    };
    Global.rotateInput = function (sol, angle) {
        var mirror = [];
        for (var _i = 0, sol_1 = sol; _i < sol_1.length; _i++) {
            var input = sol_1[_i];
            var p = Global.getDirection(input);
            var np = { x: 0, y: 0 };
            np.x = p.x * Math.cos(angle * Math.PI / 180) - p.y * Math.sin(angle * Math.PI / 180);
            np.y = p.x * Math.sin(angle * Math.PI / 180) + p.y * Math.cos(angle * Math.PI / 180);
            if (Math.abs(np.x) < 0.1) {
                np.x = 0;
            }
            else {
                np.x = Math.sign(np.x);
            }
            if (Math.abs(np.y) < 0.1) {
                np.y = 0;
            }
            else {
                np.y = Math.sign(np.y);
            }
            mirror.push(Global.getInput(np.x, np.y));
        }
        return mirror;
    };
    Global.mirrorInput = function (sol, hor, ver) {
        var mirror = [];
        for (var _i = 0, sol_2 = sol; _i < sol_2.length; _i++) {
            var input = sol_2[_i];
            var p = Global.getDirection(input);
            if (hor) {
                if (p.y == 0) {
                    p.x *= -1;
                }
            }
            if (ver) {
                if (p.x == 0) {
                    p.y *= -1;
                }
            }
            mirror.push(Global.getInput(p.x, p.y));
        }
        return mirror;
    };
    Global.sleep = function (amount) {
        var start = new Date().getTime();
        while (new Date().getTime() - start < amount)
            ;
    };
    return Global;
}());
var Chromosome = (function () {
    function Chromosome(width, height, minLength, maxBoxes) {
        this.BOX = 0;
        this.TARGET = 1;
        this.BOX_TARGET = 2;
        this.WALL = 3;
        this.PLAYER = 4;
        this.EMPTY = 9;
        this._genes = [];
        for (var y = 0; y < height; y++) {
            this._genes.push([]);
            for (var x = 0; x < width; x++) {
                this._genes[y].push(9);
            }
        }
        this._minLength = minLength;
        this._maxBoxes = maxBoxes;
        this._solution = [];
    }
    Object.defineProperty(Chromosome.prototype, "fitness", {
        get: function () {
            return this._fitness;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Chromosome.prototype, "constraint", {
        get: function () {
            return this._constraint;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Chromosome.prototype, "dimensions", {
        get: function () {
            return this._dimensions;
        },
        enumerable: true,
        configurable: true
    });
    Chromosome.prototype.getLocations = function (type) {
        var results = [];
        for (var y = 0; y < this._genes.length; y++) {
            for (var x = 0; x < this._genes[y].length; x++) {
                if (this._genes[y][x] == type) {
                    results.push({ x: x, y: y });
                }
            }
        }
        return results;
    };
    Chromosome.prototype.randomInitialize = function (wallPercentage, boxPercentage, maxBoxes) {
        var numberOfWalls = 0;
        var targetBoxes = Math.randInt(maxBoxes) + 1;
        var targetTargets = targetBoxes;
        var currentBoxes = 0;
        var currentTargets = 0;
        for (var y = 0; y < this._genes.length; y++) {
            for (var x = 0; x < this._genes[y].length; x++) {
                if (this._genes.length * this._genes[y].length - numberOfWalls - currentBoxes < Math.abs(currentBoxes - currentTargets) + 2) {
                    break;
                }
                if (Math.random() < wallPercentage) {
                    this._genes[y][x] = this.WALL;
                    numberOfWalls += 1;
                }
                else if (targetBoxes - currentBoxes > 0 && Math.random() < boxPercentage) {
                    if (Math.random() < 0.5) {
                        this._genes[y][x] = this.BOX;
                    }
                    else {
                        this._genes[y][x] = this.BOX_TARGET;
                        currentTargets += 1;
                    }
                    currentBoxes += 1;
                }
                else if (targetTargets - currentTargets > 0 && Math.random() < boxPercentage) {
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
        var emptyTiles = this.getLocations(this.EMPTY);
        var location = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
        this._genes[location.y][location.x] = this.PLAYER;
        var difference = Math.abs(currentBoxes - currentTargets);
        for (var i = 0; i < difference; i++) {
            var location_1 = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
            if (currentBoxes > currentTargets) {
                this._genes[location_1.y][location_1.x] = this.TARGET;
            }
            else {
                this._genes[location_1.y][location_1.x] = this.BOX;
            }
        }
        this.fixChromosome();
    };
    Chromosome.prototype.stringInitialize = function (lines) {
        for (var y = 0; y < this._genes.length; y++) {
            for (var x = 0; x < this._genes[y].length; x++) {
                switch (lines[y].charAt(x)) {
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
    };
    Object.defineProperty(Chromosome.prototype, "solution", {
        get: function () {
            if (this._solution.length <= 0) {
                return "";
            }
            var result = this._solution[0].toString();
            for (var i = 1; i < this._solution.length; i++) {
                result += "," + this._solution[i];
            }
            return result;
        },
        set: function (value) {
            var values = value.split(",");
            this._solution = [];
            for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
                var v = values_1[_i];
                this._solution.push(parseInt(v));
            }
        },
        enumerable: true,
        configurable: true
    });
    Chromosome.prototype.stateInitialize = function (state) {
        var result = [];
        for (var y = 0; y < this._genes.length + 2; y++) {
            result.push([]);
            for (var x = 0; x < this._genes[0].length + 2; x++) {
                if (x == 0 || y == 0 || y == this._genes.length + 1 || x == this._genes[0].length + 1) {
                    result[y].push(3);
                    continue;
                }
                result[y].push(this._genes[y - 1][x - 1]);
            }
        }
        state.initialize(result);
    };
    Chromosome.prototype.clone = function () {
        var clone = new Chromosome(this._genes[0].length, this._genes.length, this._minLength, this._maxBoxes);
        for (var y = 0; y < this._genes.length; y++) {
            for (var x = 0; x < this._genes[y].length; x++) {
                clone._genes[y][x] = this._genes[y][x];
            }
        }
        return clone;
    };
    Chromosome.prototype.fixChromosome = function () {
        var emptyTiles = this.getLocations(this.EMPTY).concat(this.getLocations(this.WALL));
        var playerTiles = this.getLocations(this.PLAYER);
        if (playerTiles.length == 0) {
            var tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
            this._genes[tile.y][tile.x] = this.PLAYER;
        }
        if (playerTiles.length > 1) {
            while (playerTiles.length > 1) {
                var tile = playerTiles.splice(Math.randInt(playerTiles.length), 1)[0];
                this._genes[tile.y][tile.x] = this.EMPTY;
            }
        }
        emptyTiles = this.getLocations(this.EMPTY).concat(this.getLocations(this.WALL));
        var boxTiles = this.getLocations(this.BOX);
        var targetTiles = this.getLocations(this.TARGET);
        if (boxTiles.length == 0) {
            var tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
            this._genes[tile.y][tile.x] = this.BOX;
        }
        if (targetTiles.length == 0) {
            var tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
            this._genes[tile.y][tile.x] = this.TARGET;
        }
        boxTiles = this.getLocations(this.BOX);
        targetTiles = this.getLocations(this.TARGET);
        var boxNumber = boxTiles.length;
        var targetNumber = targetTiles.length;
        if (Math.abs(boxNumber - targetNumber) > 0) {
            for (var i = 0; i < Math.abs(boxNumber - targetNumber); i++) {
                if (boxNumber > targetNumber) {
                    var tile = boxTiles.splice(Math.randInt(boxTiles.length), 1)[0];
                    this._genes[tile.y][tile.x] = this.EMPTY;
                }
                else {
                    var tile = targetTiles.splice(Math.randInt(targetTiles.length), 1)[0];
                    this._genes[tile.y][tile.x] = this.EMPTY;
                }
            }
        }
    };
    Chromosome.prototype.crossover = function (c) {
        var child = this.clone();
        var p1 = { x: Math.randInt(child._genes[0].length), y: Math.randInt(child._genes.length) };
        var p2 = { x: Math.randInt(child._genes[0].length), y: Math.randInt(child._genes.length) };
        if (p1.x > p2.x) {
            var temp = p1.x;
            p1.x = p2.x;
            p2.x = temp;
        }
        if (p1.y > p2.y) {
            var temp = p1.y;
            p1.y = p2.y;
            p2.y = temp;
        }
        for (var y = p1.y; y <= p2.y; y++) {
            for (var x = p1.x; x <= p2.x; x++) {
                child._genes[y][x] = c._genes[y][x];
            }
        }
        child.fixChromosome();
        return child;
    };
    Chromosome.prototype.mutate = function (layout, player, boxTarget, swap) {
        if (layout === void 0) { layout = 1; }
        if (player === void 0) { player = 1; }
        if (boxTarget === void 0) { boxTarget = 1; }
        if (swap === void 0) { swap = 1; }
        var c = this.clone();
        var prob = Math.random();
        var total = layout + player + boxTarget + swap;
        if (prob < layout / total) {
            var emptyTiles = c.getLocations(c.EMPTY);
            var solidTiles = c.getLocations(c.WALL);
            var randomValue = Math.random();
            if ((randomValue < 0.5 || solidTiles.length > 0) && emptyTiles.length > 2) {
                var tile = emptyTiles[Math.randInt(emptyTiles.length)];
                c._genes[tile.y][tile.x] = c.WALL;
            }
            else if (solidTiles.length > 0) {
                var tile = solidTiles[Math.randInt(solidTiles.length)];
                c._genes[tile.y][tile.x] = c.EMPTY;
            }
        }
        else if (prob < (layout + player) / total) {
            var playerTile = c.getLocations(c.PLAYER)[0];
            var emptyTiles = c.getLocations(c.EMPTY);
            if (emptyTiles.length > 0) {
                c._genes[playerTile.y][playerTile.x] = c.EMPTY;
                playerTile = emptyTiles[Math.randInt(emptyTiles.length)];
                c._genes[playerTile.y][playerTile.x] = c.PLAYER;
            }
        }
        else if (prob < (layout + player + boxTarget) / total) {
            var emptyTiles = c.getLocations(c.EMPTY);
            var boxTiles = c.getLocations(c.BOX);
            var targetTiles = c.getLocations(c.TARGET);
            var boxTargetTiles = c.getLocations(c.BOX_TARGET);
            var randomValue = Math.random();
            if (emptyTiles.length > 2 && randomValue < 0.5) {
                if (Math.random() < 0.5) {
                    var tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.BOX;
                    tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.TARGET;
                }
                else {
                    var tile = emptyTiles.splice(Math.randInt(emptyTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.BOX_TARGET;
                }
            }
            else if (boxTiles.length > 1) {
                if (boxTargetTiles.length > 0 && Math.random() < 0.5) {
                    var tile = boxTargetTiles.splice(Math.randInt(boxTargetTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.EMPTY;
                }
                else {
                    var tile = boxTiles.splice(Math.randInt(boxTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.EMPTY;
                    tile = targetTiles.splice(Math.randInt(targetTiles.length), 1)[0];
                    c._genes[tile.y][tile.x] = c.EMPTY;
                }
            }
        }
        else {
            var tile1 = { x: Math.randInt(c._genes[0].length), y: Math.randInt(c._genes.length) };
            var tile2 = { x: Math.randInt(c._genes[0].length), y: Math.randInt(c._genes.length) };
            var temp = c._genes[tile1.y][tile1.x];
            c._genes[tile1.y][tile1.x] = c._genes[tile2.y][tile2.x];
            c._genes[tile2.y][tile2.x] = temp;
        }
        return c;
    };
    Chromosome.prototype.calculateSolution = function (Sokoban, agent, maxNodes) {
        var state = new Sokoban(null);
        this.stateInitialize(state);
        this._solution = agent.solve(state, maxNodes);
    };
    Chromosome.prototype.averageBranching = function (state) {
        var visited = {};
        visited[Global.stringfy(state)] = true;
        var result = 0;
        for (var _i = 0, _a = this._solution; _i < _a.length; _i++) {
            var i = _a[_i];
            var possibleDir = 0;
            for (var i_1 = 0; i_1 < 4; i_1++) {
                var dir_1 = Global.getDirection(i_1);
                var tempState = state.clone();
                tempState.update(dir_1.x, dir_1.y, false);
                if (!(Global.stringfy(tempState) in visited)) {
                    visited[Global.stringfy(tempState)] = true;
                    possibleDir += 1;
                }
            }
            result += possibleDir;
            var dir = Global.getDirection(i);
            state.update(dir.x, dir.y, false);
        }
        return result / (4 * this._solution.length);
    };
    Chromosome.prototype.averagePushes = function (state) {
        var prevState = state.clone();
        var movedIndex = {};
        var result = 0;
        for (var _i = 0, _a = this._solution; _i < _a.length; _i++) {
            var i = _a[_i];
            var dir = Global.getDirection(i);
            state.update(dir.x, dir.y, false);
            for (var i_2 = 0; i_2 < state.boulders.length; i_2++) {
                var b1 = state.boulders[i_2];
                var b2 = prevState.boulders[i_2];
                if (b1.x != b2.x || b1.y != b2.y) {
                    result += 1;
                    if (!(i_2.toString() in movedIndex)) {
                        movedIndex[i_2.toString()] = true;
                    }
                    continue;
                }
            }
            prevState = state.clone();
        }
        return Math.min(1, (Object.keys(movedIndex).length) / (this._maxBoxes));
    };
    Chromosome.prototype.calculateBoxFreedom = function (box, boxes, walls) {
        var solids = boxes.concat(walls);
        var result = 4;
        for (var _i = 0, solids_1 = solids; _i < solids_1.length; _i++) {
            var s = solids_1[_i];
            if (s == box) {
                continue;
            }
            var p1 = box.getTile();
            var p2 = s.getTile();
            var dist = Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
            if (dist == 1) {
                result -= 1;
            }
        }
        return result;
    };
    Chromosome.prototype.averageBoxFreedom = function (state) {
        var result = 0;
        for (var _i = 0, _a = this._solution; _i < _a.length; _i++) {
            var i = _a[_i];
            var currentFreedom = 0;
            for (var _b = 0, _c = state.boulders; _b < _c.length; _b++) {
                var b = _c[_b];
                currentFreedom += this.calculateBoxFreedom(b, state.boulders, state.walls);
            }
            result += currentFreedom / state.boulders.length;
            var dir = Global.getDirection(i);
            state.update(dir.x, dir.y, false);
        }
        return result / (4 * this._solution.length);
    };
    Chromosome.prototype.numberOfBoxes = function () {
        var result = 0;
        for (var y = 0; y < this._genes.length; y++) {
            for (var x = 0; x < this._genes[y].length; x++) {
                if (this._genes[y][x] == 0 || this._genes[y][x] == 2) {
                    result += 1;
                }
            }
        }
        return result;
    };
    Chromosome.prototype.numberOfTargets = function () {
        var result = 0;
        for (var y = 0; y < this._genes.length; y++) {
            for (var x = 0; x < this._genes[y].length; x++) {
                if (this._genes[y][x] == 1 || this._genes[y][x] == 2) {
                    result += 1;
                }
            }
        }
        return result;
    };
    Chromosome.prototype.calculateNumberOfGoals = function () {
        return Math.min(1, (this.numberOfBoxes() + this.numberOfTargets()) / (2 * this._maxBoxes));
    };
    Chromosome.prototype.calculateDimensions = function (Sokoban) {
        var state = new Sokoban(null);
        this.stateInitialize(state);
        this._dimensions = [
            this.averageBranching(state.clone()),
            this.averagePushes(state.clone()),
            this.averageBoxFreedom(state.clone())
        ];
    };
    Chromosome.prototype.calculateConstraints = function (Sokoban) {
        var state = new Sokoban(null);
        this.stateInitialize(state);
        for (var _i = 0, _a = this._solution; _i < _a.length; _i++) {
            var i = _a[_i];
            var dir = Global.getDirection(i);
            state.update(dir.x, dir.y, false);
        }
        var solutionFitness = 1 - Global.averageDistance(state) / (this._genes.length + this._genes[0].length);
        this._constraint = solutionFitness * Math.min(1, this._solution.length / this._minLength);
    };
    Chromosome.prototype.calculateFitness = function (pop) {
        if (pop.length < 1) {
            this._fitness = 1;
            return;
        }
        var alternation = [
            this._solution,
            Global.mirrorInput(this._solution, true, false),
            Global.mirrorInput(this._solution, false, true),
            Global.mirrorInput(this._solution, true, true),
            Global.rotateInput(this._solution, 90),
            Global.rotateInput(this._solution, -90)
        ];
        var finalMin = Number.MAX_VALUE;
        for (var _i = 0, pop_1 = pop; _i < pop_1.length; _i++) {
            var p = pop_1[_i];
            if (this == p) {
                continue;
            }
            var minValue = Number.MAX_VALUE;
            for (var _a = 0, alternation_1 = alternation; _a < alternation_1.length; _a++) {
                var s = alternation_1[_a];
                var currentValue = Global.solutionDistance(s, p._solution);
                if (currentValue < minValue) {
                    minValue = currentValue;
                }
            }
            if (minValue < finalMin) {
                finalMin = minValue;
            }
        }
        this._fitness = finalMin / this._solution.length;
    };
    Chromosome.prototype.toString = function () {
        var result = "";
        for (var y = 0; y < this._genes.length; y++) {
            var line = "";
            for (var x = 0; x < this._genes[y].length; x++) {
                switch (this._genes[y][x]) {
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
    };
    return Chromosome;
}());
/// <reference path="Chromosome.ts"/>
var Cell = (function () {
    function Cell(maxSize, dimensions) {
        this._dimensions = dimensions;
        this._maxSize = maxSize;
        this._population = [];
    }
    Object.defineProperty(Cell.prototype, "dimensions", {
        get: function () {
            return this._dimensions;
        },
        enumerable: true,
        configurable: true
    });
    Cell.prototype.assignChromosome = function (c) {
        if (this._population.length >= this._maxSize) {
            this._population.sort(function (a, b) {
                if (a.constraint == b.constraint && a.constraint == 1) {
                    return a.fitness - b.fitness;
                }
                return a.constraint - b.constraint;
            });
            this._population.splice(0, 1);
        }
        this._population.push(c);
    };
    Cell.prototype.getFeasibleChromosomes = function () {
        var feasible = [];
        for (var _i = 0, _a = this._population; _i < _a.length; _i++) {
            var c = _a[_i];
            if (c.constraint == 1) {
                feasible.push(c);
            }
        }
        return feasible;
    };
    Cell.prototype.getInfeasibleChromosome = function () {
        var infeasible = [];
        for (var _i = 0, _a = this._population; _i < _a.length; _i++) {
            var c = _a[_i];
            if (c.constraint < 1) {
                infeasible.push(c);
            }
        }
        return infeasible;
    };
    Cell.prototype.rankSelection = function (pop) {
        var rank = [];
        var total = 0;
        for (var i = 1; i <= rank.length; i++) {
            rank.push(i);
            total += i;
        }
        rank[0] = rank[0] / total;
        for (var i = 1; i < rank.length; i++) {
            rank[i] = (rank[i] + rank[i - 1]) / total;
        }
        var prob = Math.random();
        for (var i = 0; i < rank.length; i++) {
            if (prob <= rank[i]) {
                return pop[i];
            }
        }
        return pop[pop.length - 1];
    };
    Cell.prototype.getChromosome = function (type) {
        if (type === void 0) { type = 0; }
        var feasible = this.getFeasibleChromosomes();
        feasible.sort(function (a, b) { return a.fitness - b.fitness; });
        var infeasible = this.getInfeasibleChromosome();
        infeasible.sort(function (a, b) { return a.constraint - b.constraint; });
        switch (type) {
            case 0:
                if (Math.random() < feasible.length / this._population.length) {
                    return this.rankSelection(feasible);
                }
                return this.rankSelection(infeasible);
            case 1:
                return this.rankSelection(feasible);
            case 2:
                return this.rankSelection(infeasible);
        }
        return null;
    };
    return Cell;
}());
var MapElite = (function () {
    function MapElite(popSize, dimSize) {
        this._cells = {};
        this._popSize = popSize;
        this._dimSize = dimSize;
    }
    MapElite.prototype.initializeMap = function (width, height, minLength, wallPercentage, boxPercentage, maxBoxes, initializeSize) {
        var result = [];
        for (var i = 0; i < initializeSize; i++) {
            var c = new Chromosome(width, height, minLength, maxBoxes);
            c.randomInitialize(wallPercentage, boxPercentage, maxBoxes);
            result.push(c);
        }
        return result;
    };
    MapElite.prototype.getCellKey = function (c) {
        var dimensions = [];
        for (var i = 0; i < this._dimSize.length; i++) {
            dimensions.push(Math.floor(c.dimensions[i] * this._dimSize[i]));
        }
        var key = "" + dimensions[0];
        for (var i = 1; i < this._dimSize.length; i++) {
            key += "," + dimensions[i];
        }
        return key;
    };
    MapElite.prototype.assignCell = function (c) {
        var key = this.getCellKey(c);
        if (!this._cells.hasOwnProperty(key)) {
            this._cells[key] = new Cell(this._popSize, key);
        }
        this._cells[key].assignChromosome(c);
    };
    MapElite.prototype.getCells = function () {
        var result = [];
        for (var key in this._cells) {
            result.push(this._cells[key]);
        }
        return result;
    };
    MapElite.prototype.updateMap = function (Sokoban, newPop) {
        for (var _i = 0, newPop_1 = newPop; _i < newPop_1.length; _i++) {
            var c = newPop_1[_i];
            c.calculateConstraints(Sokoban);
            c.calculateDimensions(Sokoban);
            var key = this.getCellKey(c);
            var pop = [];
            if (key in this._cells) {
                pop = this._cells[key].getFeasibleChromosomes();
            }
            c.calculateFitness(pop);
            if (c.constraint < 1 || c.fitness != 0) {
                this.assignCell(c);
            }
        }
    };
    MapElite.prototype.nextGeneration = function (inbreeding, crossover, mutation, nextSize) {
        var result = [];
        var cells = this.getCells();
        for (var i = 0; i < nextSize; i++) {
            var c1 = cells[Math.randInt(cells.length)];
            var c2 = cells[Math.randInt(cells.length)];
            if (Math.random() < inbreeding) {
                c2 = c1;
            }
            var ch1 = c1.getChromosome();
            if (Math.random() < crossover) {
                var ch2 = c2.getChromosome();
                ch1 = ch1.crossover(ch2);
                if (Math.random() < mutation) {
                    ch1 = ch1.mutate();
                }
            }
            else {
                ch1 = ch1.mutate();
            }
            result.push(ch1);
        }
        return result;
    };
    return MapElite;
}());
/// <reference path="../Generation/Chromosome.ts"/>
var ParentEvaluator = (function () {
    function ParentEvaluator() {
        this._batchSize = 0;
    }
    ParentEvaluator.prototype.prepareForEvaluation = function (fs, path, chromosomes) {
        this._batchSize = chromosomes.length;
        for (var i = 0; i < this._batchSize; i++) {
            var filePath = path + "Chromosome_" + i.toString() + ".txt";
            fs.writeFileSync(filePath, chromosomes[i].toString());
        }
    };
    ParentEvaluator.prototype.checkIsDone = function (fs, path) {
        for (var i = 0; i < this._batchSize; i++) {
            var filePath = path + "Chromosome_" + i.toString() + ".txt";
            if (!fs.existsSync(filePath)) {
                return false;
            }
        }
        return true;
    };
    ParentEvaluator.prototype.setChromosomes = function (fs, path, chromosomes) {
        for (var i = 0; i < this._batchSize; i++) {
            var filePath = path + "Chromosome_" + i.toString() + ".txt";
            var solution = fs.readFileSync(filePath, "utf8");
            chromosomes[i].solution = solution;
            fs.unlinkSync(filePath);
        }
    };
    return ParentEvaluator;
}());
/// <reference path="../Generation/Chromosome.ts"/>
var RunningEvaluator = (function () {
    function RunningEvaluator(id, size) {
        this._id = id;
        this._size = size;
    }
    RunningEvaluator.prototype.checkFiles = function (fs, path, width, height, minLength, maxBoxes) {
        var result = [];
        for (var i = 0; i < this._size; i++) {
            result.push(null);
        }
        var startIndex = this._id * this._size;
        while (result.length < this._size) {
            for (var i = 0; i < this._size; i++) {
                var filePath = path + "Chromosome_" + (startIndex + i).toString() + ".txt";
                if (fs.existsSync(filePath)) {
                    Global.sleep(2000);
                    var lines = fs.readFileSync(filePath, "utf8").split("\n");
                    // Safety precaution
                    if (lines.length >= height) {
                        var temp = new Chromosome(width, height, minLength, maxBoxes);
                        temp.stringInitialize(lines);
                        fs.unlinkSync(filePath);
                        result[i] = temp;
                    }
                }
            }
        }
        return result;
    };
    RunningEvaluator.prototype.evaluateChromosomes = function (fs, path, chromosomes, Sokoban, agent, maxNodes) {
        var startIndex = this._id * this._size;
        for (var i = 0; i < this._size; i++) {
            var filePath = path + "Chromosome_" + (startIndex + i).toString() + ".txt";
            chromosomes[i].calculateSolution(Sokoban, agent, maxNodes);
            fs.writeFileSync(filePath, chromosomes[i].solution);
        }
    };
    return RunningEvaluator;
}());
/// <reference path="Solver/MCTS.ts"/>
/// <reference path="Solver/AStar.ts"/>
/// <reference path="Solver/BFS.ts"/>
/// <reference path="Global.ts"/>
/// <reference path="Generation/Chromosome.ts"/>
/// <reference path="Generation/MapElite.ts"/>
/// <reference path="Evaluator/ParentEvaluator.ts"/>
/// <reference path="Evaluator/RunningEvaluator.ts"/>
// let SokobanGame = require('./sokoban.js');
// let sokoban = new SokobanGame(null);
// sokoban.initialize(
//     [
//         [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
//         [9, 9, 3, 3, 3, 3, 9, 9, 9, 9],
//         [9, 9, 3, 4, 9, 3, 9, 9, 9, 9],
//         [9, 9, 3, 0, 0, 3, 9, 9, 9, 9],
//         [9, 9, 3, 9, 9, 3, 9, 9, 9, 9],
//         [9, 9, 3, 3, 3, 3, 9, 9, 9, 9],
//         [9, 9, 3, 1, 1, 3, 9, 9, 9, 9],
//         [9, 9, 3, 3, 3, 3, 9, 9, 9, 9],
//         [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
//         [9, 9, 9, 9, 9, 9, 9, 9, 9, 9]
//     ], false
// );
// let seed: number = new Date().getTime();
// Math.setSeed(seed);
// let mcts:MCTS = new MCTS(0.2, 0, 10, Global.stepsHeuristic);
// console.log(mcts.solve(sokoban, 1000));
// Math.setSeed(seed);
// let astar:AStar = new AStar(Global.stepsHeuristic);
// console.log(astar.solve(sokoban, 1000));
// Math.setSeed(seed);
// let bfs:BFS = new BFS(Global.stepsHeuristic);
// console.log(bfs.solve(sokoban, 1000));
// let c1:Chromosome = new Chromosome(5, 5, 2);
// c1.randomInitialize(0.2, 0.1, 5);
// let c2:Chromosome = new Chromosome(5, 5, 2);
// c2.randomInitialize(0.2, 0.1, 5);
// console.log(c1.toString());
// console.log(c2.toString());
// console.log(c1.mutate().toString());
// console.log(c1.crossover(c2).toString());
if (typeof module !== 'undefined') {
    module.exports = {
        Chromosome: Chromosome,
        MapElite: MapElite,
        Global: Global,
        ParentEvaluator: ParentEvaluator,
        RunningEvaluator: RunningEvaluator,
        AStar: AStar,
        MCTS: MCTS,
        BFS: BFS,
        Math: Math
    };
}
