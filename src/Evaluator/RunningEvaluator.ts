/// <reference path="../Generation/Chromosome.ts"/>

class RunningEvaluator{
    private _id:number;
    private _size:number;

    constructor(id, size){
        this._id = id;
        this._size = size;
    }

    checkFiles(fs:any, path:string, width:number, height:number, minLength:number, maxBoxes:number):Chromosome[]{
        let result:Chromosome[] = [];
        let startIndex:number = this._id * this._size;
        for(let i=0; i<this._size; i++){
            let filePath: string = path + "Chromosome_" + (startIndex + i).toString() + ".txt";
            if(fs.existsSync(filePath)){
                Global.sleep(1000);
                let lines: string[] = fs.readFileSync(filePath, "utf8").split("\n");
                let temp:Chromosome = new Chromosome(width, height, minLength, maxBoxes);
                temp.stringInitialize(lines);
                fs.unlinkSync(filePath);
                result.push(temp);
            }
        }
        return result;
    }

    evaluateChromosomes(fs:any, path:string, chromosomes: Chromosome[], Sokoban:any, agent:any, maxNodes:number):void{
        let startIndex: number = this._id * this._size;
        for(let i:number=0; i<this._size; i++){
            let filePath: string = path + "Chromosome_" + (startIndex + i).toString() + ".txt";
            chromosomes[i].calculateSolution(Sokoban, agent, maxNodes);
            fs.writeFileSync(filePath, chromosomes[i].solution);
        }
    }
}