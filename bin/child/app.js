let SokobanGame = require('./../libraries/sokoban.js');
let SokobanGeneration = require('./../libraries/sokobanGeneration.js');
let Random = require('./../libraries/random.js');
let fs = require('fs');
let parameters = JSON.parse(fs.readFileSync("../assets/parameters.json", "utf8"));

let random = new Random(Random.engines.mt19937().seed(parameters.seed));
SokobanGeneration.Math.setRandomObject(random);
let runnerIndex = parseInt(process.argv[2]);
let runnerSize = parseInt(process.argv[3]);
let evaluator = new SokobanGeneration.RunningEvaluator(runnerIndex, runnerSize);
let agentArgs = parameters.agentParameters;
agentArgs.push(SokobanGeneration.Global.stepsHeuristic);
let agent = new SokobanGeneration[parameters.agent](agentArgs);

console.log("Waiting for chromosomes");
while(true){
    SokobanGeneration.Global.sleep(1000);
    let chromosomes = evaluator.checkFiles(fs, parameters.inPath, parameters.width,
        parameters.height, parameters.minLength, parameters.maxBoxes);
    try{
        if(chromosomes.length > 0){
            console.log("Found " + chromosomes.length + " chromosomes for evaluation");
            console.log("Running " + parameters.agent + " to solve all the chromosomes");
            evaluator.evaluateChromosomes(fs, parameters.outPath, chromosomes, SokobanGame,
                agent, parameters.allowedNodes);
            console.log("Waiting for chromosomes");
        }
    }
    catch(e){
        console.log("#######################################################");
        console.log("Error happened, Trying to overcome it in the next loop.");
        console.log("   " + e);
        for(let i=0; i<chromosomes.length; i++){
            if(chromosomes[i] != null){
                console.log(i.toString() + "\n" + chromosomes[i].toString());
            }
            else{
                console.log(i.toString() + " have problem.");
            }
        }
        console.log("#######################################################");
    }
}