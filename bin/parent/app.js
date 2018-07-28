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
let genNumber = 0;
if(process.argv.length > 4){
    genNumber = parseInt(process.argv[4]);
}
let evaluator = new SokobanGeneration.ParentEvaluator();
let mapElite = new SokobanGeneration.MapElite(parameters.popSize, parameters.dimSize);

function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

function appendStatistics(genNumber){
    let filePath = parameters.resultPath + "statistics.txt";
    let cells = mapElite.getCells();
    let numberOfElites = cells.length;
    let averageFeasible = 0;
    let averageInfeasible = 0;
    let maxFeasible = 0;
    let maxInfeasible = 0;
    for(let c of cells){
        let feasible = c.getFeasibleChromosomes();
        let infeasible = c.getInfeasibleChromosome();
        if(maxFeasible < feasible.length){
            maxFeasible = feasible.length;
        }
        if(maxInfeasible < infeasible.length){
            maxInfeasible = infeasible.length;
        }
        averageFeasible += feasible.length;
        averageInfeasible += infeasible.length;
    }
    averageFeasible /= cells.length;
    averageInfeasible /= cells.length;
    fs.appendFileSync(filePath, "Generation " + genNumber + ": " + numberOfElites + " " + 
        averageFeasible.toFixed(2) + " " + maxFeasible + " " + 
        averageInfeasible.toFixed(2) + " " + maxInfeasible + "\n");
}

function writeGeneration(genNumber){
    let folderPath = parameters.resultPath + genNumber.toString() + "/"
    fs.mkdirSync(folderPath);
    let cells = mapElite.getCells();
    let result = "";
    for(let c of cells){
        let feasible = c.getFeasibleChromosomes();
        let infeasible = c.getInfeasibleChromosome();
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
            result += c.dimensions + ": " + feasible.length + " " + infeasible.length + "\n";
        }
    }
    fs.writeFileSync(folderPath + "results.txt", result);
    let oldFolderPath = parameters.resultPath + (genNumber - 1).toString() + "/"
    if (parameters.deleteOldGen && fs.existsSync(oldFolderPath)){
        deleteFolderRecursive(oldFolderPath);
    }
}

function loadMapElites(genNumber){
//     let folderPath = parameters.resultPath + genNumber.toString() + "/"
//     let names = fs.readdirSync(folderPath);
//     for(let n of names){
//         if(fs.lstatSync(n).isDirectory()){
//             let c = new SokobanGeneration.Chromosome(parameters.width, parameters.height, 
//                 parameters.minLength, parameters.maxBoxes);
//             let dimString = n.split(",");
//             let dims = [];
//             for(let i=0; i<dimString.length; i++){
//                 dims.push(parseFloat(dimString[i]) / parameters.dimSize[i]);
//             }
//         }
//     }
}

if(genNumber == 0){
    console.log("Initializing map");
    let chromosomes = mapElite.initializeMap(parameters.width, parameters.height, parameters.minLength, 
        parameters.wallPercentage, parameters.boxPercentage, parameters.maxBoxes, batchSize);
    fs.writeFileSync(parameters.resultPath + "statistics.txt", "");
}
else{
    console.log("Loading map from generation " + genNumber)
    loadMapElites();
    genNumber += 1;
    console.log("   Get new batch for the next generation");
    chromosomes = mapElite.nextGeneration(parameters.inbreeding, parameters.crossover, parameters.mutation, batchSize);
}
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
    appendStatistics(genNumber);
    if(maximumGeneration > 0 && genNumber == maximumGeneration){
        break;
    }
    genNumber += 1;
    console.log("   Get new batch for the next generation");
    chromosomes = mapElite.nextGeneration(parameters.inbreeding, parameters.crossover, parameters.mutation, batchSize);
}