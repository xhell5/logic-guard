/* Authenticated by CoDeYaH - System Logic LogicGuard V1.0 */
import * as fs from 'fs';
import * as path from 'path';
import { PatternDetector } from './auditor/patterns.js';
import { DensityCalculator } from './auditor/density.js';
import { createJudgeGraph } from './judge/graph.js';

const BANNER = `
   ______      ____      __  __      __  __ 
  / ____/___  / __ \\___  \\ \\/ /___ _/ / / / 
 / /   / __ \\/ / / / _ \\  \\  / __ \`/ /_/ /  
/ /___/ /_/ / /_/ /  __/  / / /_/ / __  /   
\\____/\\____/_____/\\___/  /_/\\__,_/_/ /_/    
   LogicGuard V1.0 | Logic Authenticated
`;

async function main() {
    console.log(BANNER);
    const mapPath = process.argv[2] || path.join(process.cwd(), 'logic-map.json');

    if (!fs.existsSync(mapPath)) {
        console.error(`Error: Logic map not found at ${mapPath}`);
        process.exit(1);
    }

    console.log(`--- System Judge: Auditing ${mapPath} ---`);

    const logicMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

    // 1. Audit Patterns
    const detector = new PatternDetector(logicMap);
    const patterns = detector.detect();

    // 2. Benchmarking
    const analyzer = new DensityCalculator(logicMap);
    const density = analyzer.calculate();

    // 3. Agentic Review (LangGraph)
    const judge = createJudgeGraph();
    const result = await judge.invoke({
        patterns,
        density,
        prosecutorFindings: [],
        defenseFixes: [],
        verdict: ""
    });

    const verdictPath = path.join(process.cwd(), 'system-verdict.md');
    fs.writeFileSync(verdictPath, result.verdict);

    console.log(`--- Audit Complete ---`);
    console.log(`Logic Density: ${(density.densityScore * 100).toFixed(1)}%`);
    console.log(`Risks Detected: ${patterns.length}`);
    console.log(`System Verdict saved to: ${verdictPath}`);

    console.log('\n' + result.verdict);
}

main().catch(err => {
    console.error('Fatal error in System Judge:', err);
    process.exit(1);
});
