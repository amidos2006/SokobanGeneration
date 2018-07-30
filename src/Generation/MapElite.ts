/// <reference path="Chromosome.ts"/>
class Cell{
    private _dimensions:string;
    private _maxSize:number;
    private _population:Chromosome[];

    constructor(maxSize:number, dimensions:string){
        this._dimensions = dimensions;
        this._maxSize = maxSize;
        this._population = [];
    }

    get dimensions():string{
        return this._dimensions;
    }

    assignChromosome(c:Chromosome):void{
        if(this._population.length >= this._maxSize){
            this._population.sort((a, b) => {
                if(a.constraint == b.constraint && a.constraint == 1){
                    return a.fitness - b.fitness;
                }
                return a.constraint - b.constraint;
            });
            this._population.splice(0, 1);
            
        }
        this._population.push(c);
    }

    getFeasibleChromosomes():Chromosome[]{
        let feasible:Chromosome[] = [];
        for(let c of this._population){
            if(c.constraint == 1){
                feasible.push(c);
            }
        }
        return feasible;
    }

    getInfeasibleChromosomes():Chromosome[]{
        let infeasible: Chromosome[] = [];
        for (let c of this._population) {
            if (c.constraint < 1) {
                infeasible.push(c);
            }
        }
        return infeasible;
    }

    private rankSelection(pop: Chromosome[]):Chromosome{
        let rank:number[] = [];
        let total:number = 0;
        for(let i:number=1; i<=rank.length; i++){
            rank.push(i);
            total += i;
        }
        rank[0] = rank[0] / total;
        for(let i:number=1; i<rank.length; i++){
            rank[i] = (rank[i] + rank[i - 1])/ total;
        }
        let prob:number = Math.random();
        for(let i:number=0; i<rank.length; i++){
            if(prob <= rank[i]){
                return pop[i];
            }
        }
        return pop[pop.length - 1];
    }

    getChromosome(type:number=0):Chromosome{
        let feasible:Chromosome[] = this.getFeasibleChromosomes();
        feasible.sort((a,b)=>{ return a.fitness - b.fitness; });
        let infeasible:Chromosome[] = this.getInfeasibleChromosomes();
        infeasible.sort((a,b)=>{return a.constraint - b.constraint; });
        switch(type){
            case 0:
                if(Math.random() < feasible.length / this._population.length){
                    return this.rankSelection(feasible);
                }
                return this.rankSelection(infeasible);
            case 1:
                return this.rankSelection(feasible);
            case 2:
                return this.rankSelection(infeasible);
        }
        return null;
    }
}

class MapElite{
    private _cells:any;
    private _popSize:number;
    private _dimSize:number[];

    constructor(popSize:number, dimSize:number[]){
        this._cells = {};
        this._popSize = popSize;
        this._dimSize = dimSize;
    }

    initializeMap(width:number, height:number, minLength:number, wallPercentage:number, boxPercentage:number, maxBoxes:number, initializeSize:number):Chromosome[]{
        let result:Chromosome[] = [];
        for(let i:number=0; i<initializeSize; i++){
            let c:Chromosome = new Chromosome(width, height, minLength, maxBoxes);
            c.randomInitialize(wallPercentage, boxPercentage, maxBoxes);
            result.push(c);
        }
        return result;
    }

    private getCellKey(c:Chromosome):string{
        let dimensions: number[] = [];
        for (let i: number = 0; i < this._dimSize.length; i++) {
            dimensions.push(Math.floor(c.dimensions[i] * this._dimSize[i]));
        }
        let key: string = "" + dimensions[0];
        for (let i: number = 1; i < this._dimSize.length; i++) {
            key += "," + dimensions[i];
        }
        return key;
    }

    private assignCell(c:Chromosome):void{
        let key:string = this.getCellKey(c);
        if(!this._cells.hasOwnProperty(key)){
            this._cells[key] = new Cell(this._popSize, key);
        }
        this._cells[key].assignChromosome(c);
    }

    getCells():Cell[]{
        let result:Cell[] = [];
        for(let key in this._cells){
            result.push(this._cells[key]);
        }
        return result;
    }

    updateMap(Sokoban:any, newPop:Chromosome[]):void{
        for(let c of newPop){
            c.calculateConstraints(Sokoban);
            c.calculateDimensions(Sokoban);
            let key: string = this.getCellKey(c);
            let pop: Chromosome[] = [];
            if(key in this._cells){
                pop = this._cells[key].getFeasibleChromosomes();
            }
            c.calculateFitness(pop);
            if(c.constraint < 1 || c.fitness != 0){
                this.assignCell(c);
            }
        }
    }

    nextGeneration(inbreeding:number, crossover:number, mutation:number, nextSize:number):Chromosome[]{
        let result:Chromosome[] = [];
        let cells:Cell[] = this.getCells();
        for(let i:number=0; i<nextSize; i++){
            let c1:Cell = cells[Math.randInt(cells.length)];
            let c2:Cell = cells[Math.randInt(cells.length)];
            if(Math.random() < inbreeding){
                c2 = c1;
            }
            let ch1:Chromosome = c1.getChromosome();
            if(Math.random() < crossover){
                let ch2:Chromosome = c2.getChromosome();
                ch1 = ch1.crossover(ch2);
                if(Math.random() < mutation){
                    ch1 = ch1.mutate();
                }
            }
            else{
                ch1 = ch1.mutate();
            }
            result.push(ch1);
        }
        return result;
    }
}