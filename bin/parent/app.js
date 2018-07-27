let SokobanGame = require('./../libraries/sokoban.js');
let SokobanGeneration = require('./../libraries/sokobanGeneration.js');
let Random = require('./../libraries/random.js');
let fs = require('fs');
let parameters = JSON.parse(fs.readFileSync("../assets/parameters.json", "utf8"));

let random = new Random(Random.engines.mt19937().seed(parameters.seed));
SokobanGeneration.Math.setRandomObject(random);
let batchSize = parseInt(process.argv[2]);
let maximumGeneration = 0;
if(process.argv.length > 3){
    maximumGeneration = parseInt(process.argv[3]);
}
let evaluator = new SokobanGeneration.ParentEvaluator();
let mapElite = new SokobanGeneration.MapElite(parameters.popSize, parameters.dimSize);

function writeGeneration(genNumber){
    let folderPath = parameters.resultPath + genNumber.toString() + "/"
    fs.mkdirSync(folderPath);
    let cells = mapElite.getCells();
    let result = "";
    for(let c of cells){
        let feasible = c.getFeasibleChromosomes();
        if (feasible.length > 0){
            let cellPath = folderPath + c.dimensions + "/";
            fs.mkdirSync(cellPath);
            let maxIndex = 0;
            let cellResult = "";
            for (let i = 0; i < feasible.length; i++){
                fs.writeFileSync(cellPath + i.toString() + ".txt", feasible[i].toString());
                if (feasible[i].fitness > feasible[maxIndex].fitness){
                    maxIndex = i;
                }
                cellResult += "Chromosome " + i.toString() + ": " + feasible[i].fitness + "\n";
                cellResult += "    Solution: " + feasible[i].solution + "\n";
            }
            fs.writeFileSync(cellPath + "results.txt", cellResult);
            result += c.dimensions + ": " + maxIndex + " " + feasible[maxIndex].fitness + "\n";
        }
    }
    fs.writeFileSync(folderPath + "results.txt", result);
}


let genNumber = 0;
console.log("Initializing map");
let chromosomes = mapElite.initializeMap(parameters.width, parameters.height, parameters.minLength, 
    parameters.wallPercentage, parameters.boxPercentage, parameters.maxBoxes, batchSize);
while(true){
    console.log("Generation " + genNumber);
    evaluator.prepareForEvaluation(fs, parameters.inPath, chromosomes);
    console.log("   Writing new Batch");
    console.log("   Waiting to be evaluated");
    while(!evaluator.checkIsDone(fs, parameters.outPath)){
        SokobanGeneration.Global.sleep(1000);
    }
    console.log("   Set the chromosomes' solution");
    evaluator.setChromosomes(fs, parameters.outPath, chromosomes);
    console.log("   Updating map");
    mapElite.updateMap(SokobanGame, chromosomes);
    console.log("   Writing the result of the generation");
    writeGeneration(genNumber);
    if(maximumGeneration > 0 && genNumber == maximumGeneration){
        break;
    }
    genNumber += 1;
    console.log("   Get new batch for the next generation");
    chromosomes = mapElite.nextGeneration(parameters.inbreeding, parameters.crossover, parameters.mutation, batchSize);
}