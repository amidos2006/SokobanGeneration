let Entity = function (x, y, img, index) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.index = index;
};

Entity.prototype.clone = function(){
    return new Entity(this.x, this.y, this.img, this.index);
}

Entity.prototype.getTile = function () {
    return { x: Math.floor(this.x / 16), y: Math.floor(this.y / 16) };
};

Entity.prototype.collide = function (other, xTile, yTile) {
    if (xTile == undefined) {
        xTile = 0;
    }
    if (yTile == undefined) {
        yTile = 0;
    }
    let loc = this.getTile();
    let otherLoc = other.getTile();
    return loc.x + xTile == otherLoc.x && loc.y + yTile == otherLoc.y;
};

Entity.prototype.render = function (context) {
    context.save();
    context.translate(this.x, this.y);
    let xNum = Math.floor(this.img.width / 16);
    let yNum = Math.floor(this.img.height / 16);
    let sx = (this.index % xNum) * 16;
    let sy = (Math.floor(this.index / xNum) % yNum) * 16;
    context.drawImage(this.img, sx, sy, 16, 16, 0, 0, 16, 16);
    context.restore();
}

let SokobanGame = function (img) {
    this.player = new Entity(0, 0, img, 4);
    this.boulders = [];
    this.targets = [];
    this.walls = [];
    this.undo = [];
}

SokobanGame.prototype.initialize = function (map, useEntities) {
    this.player.x = 0;
    this.player.y = 0;
    this.boulders = [];
    this.targets = [];
    this.walls = [];
    this.undo = [];
    if(useEntities == undefined){
        useEntities = false;
    }
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            let index = map[y][x];
            if(useEntities){
                index = index.index;
            }
            switch (index) {
                case 3:
                    this.walls.push(new Entity(x * 16, y * 16, this.player.img, index));
                    break;
                case 4:
                    this.player.x = x * 16;
                    this.player.y = y * 16;
                    break;
                case 0:
                    this.boulders.push(new Entity(x * 16, y * 16, this.player.img, index));
                    break;
                case 1:
                    this.targets.push(new Entity(x * 16, y * 16, this.player.img, index));
                    break;
                case 2:
                    this.boulders.push(new Entity(x * 16, y * 16, this.player.img, 0));
                    this.targets.push(new Entity(x * 16, y * 16, this.player.img, 1));
                    break;
            }
        }
    }
}

SokobanGame.prototype.clone = function(){
    let clone = new SokobanGame(this.player.img);
    clone.player = this.player.clone();
    for(let b of this.boulders){
        clone.boulders.push(b.clone());
    }
    clone.targets = this.targets;
    clone.walls = this.walls;
    return clone;
}

SokobanGame.prototype.collide = function (obj, array, xDir, yDir) {
    for (let a of array) {
        if (obj.collide(a, xDir, yDir)) {
            return a;
        }
    }
    return null;
};

SokobanGame.prototype.tryMove = function (xDir, yDir) {
    if (this.collide(this.player, this.walls, xDir, yDir) != null) {
        return false;
    }
    let boulder = this.collide(this.player, this.boulders, xDir, yDir);
    if (boulder != null) {
        if (this.collide(boulder, this.boulders.concat(this.walls), xDir, yDir)) {
            return false;
        }
        else {
            boulder.x += xDir * 16;
            boulder.y += yDir * 16;
        }
    }
    this.player.x += xDir * 16;
    this.player.y += yDir * 16;
    if (xDir != 0 || yDir != 0) {
        return true;
    }
    return false;
}

SokobanGame.prototype.checkWin = function () {
    for (let b of this.boulders) {
        let covered = false;
        for (let t of this.targets) {
            if (b.collide(t)) {
                covered = true;
                break;
            }
        }
        if (!covered) {
            return false;
        }
    }
    return true;
}

SokobanGame.prototype.getUndoObject = function () {
    let undoObject = {
        player: { x: this.player.x, y: this.player.y },
        boulders: []
    };
    for (let b of this.boulders) {
        undoObject.boulders.push({ x: b.x, y: b.y });
    }
    return undoObject;
}

SokobanGame.prototype.undoMove = function () {
    if (this.undo.length == 0) {
        return;
    }
    let undoObject = this.undo.pop();
    this.player.x = undoObject.player.x;
    this.player.y = undoObject.player.y;
    for (let i = 0; i < this.boulders.length; i++) {
        this.boulders[i].x = undoObject.boulders[i].x;
        this.boulders[i].y = undoObject.boulders[i].y;
    }
}

SokobanGame.prototype.update = function (xDir, yDir, undo) {
    if(undo){
        this.undoMove();
    }
    let undoObject = this.getUndoObject();
    if (this.tryMove(xDir, yDir)) {
        this.undo.push(undoObject);
    }
};

SokobanGame.prototype.render = function (context) {
    for (let t of this.targets) {
        t.render(context);
    }
    for (let w of this.walls) {
        w.render(context);
    }
    for (let b of this.boulders) {
        b.render(context);
    }
    this.player.render(context);
};

if(typeof module !== 'undefined'){
    module.exports = SokobanGame;
}
