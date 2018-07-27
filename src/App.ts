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
        Chromosome:Chromosome,
        MapElite: MapElite,
        Global:Global,
        ParentEvaluator:ParentEvaluator,
        RunningEvaluator:RunningEvaluator,
        AStar:AStar,
        MCTS:MCTS,
        BFS:BFS,
        Math: Math
    };
}