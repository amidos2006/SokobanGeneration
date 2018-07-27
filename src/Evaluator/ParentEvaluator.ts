/// <reference path="../Generation/Chromosome.ts"/>

class ParentEvaluator{
    private _batchSize:number;

    constructor(){
        this._batchSize = 0;
    }

    prepareForEvaluation(fs:any, path:string, chromosomes:Chromosome[]):void{
        this._batchSize = chromosomes.length;
        for (let i = 0; i < this._batchSize; i++) {
            let filePath: string = path + "Chromosome_" + i.toString() + ".txt";
            fs.writeFileSync(filePath, chromosomes[i].toString());
        }
    }

    checkIsDone(fs:any, path:string):boolean{
        for(let i=0; i<this._batchSize; i++){
            let filePath: string = path + "Chromosome_" + i.toString() + ".txt";
            if (!fs.existsSync(filePath)) {
                return false;
            }
        }
        return true;
    }

    setChromosomes(fs: any, path:string, chromosomes:Chromosome[]):void{
        for (let i = 0; i < this._batchSize; i++) {
            let filePath: string = path + "Chromosome_" + i.toString() + ".txt";
            let solution = fs.readFileSync(filePath, "utf8");
            chromosomes[i].solution = solution;
            fs.unlinkSync(filePath);
        }
    }
}