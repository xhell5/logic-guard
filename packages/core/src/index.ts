/* Authenticated by CoDeYaH - System Logic LogicGuard V1.0 */
import * as fs from 'fs';
import * as path from 'path';
import { UniversalCodeScanner } from './infrastructure/scanner.js';
import { LogicDetector } from './infrastructure/analyzer.js';

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
    const targetDir = process.argv[2] || process.cwd();

    if (!fs.existsSync(targetDir)) {
        console.error(`Error: Directory ${targetDir} does not exist.`);
        process.exit(1);
    }

    console.log(`--- Logic Brain: Starting Analysis of ${targetDir} ---`);

    const scanner = new UniversalCodeScanner(targetDir);
    const actions = scanner.scanProject();
    console.log(`Scanner detected ${actions.length} actions.`);

    const detector = new LogicDetector(actions);
    const logicMap = detector.analyze();

    const outputPath = path.join(process.cwd(), 'logic-map.json');
    fs.writeFileSync(outputPath, JSON.stringify(logicMap, null, 2));

    console.log(`--- Analysis Complete ---`);
    console.log(`Detected Actions: ${logicMap.nodes.length}`);
    console.log(`Detected Gaps: ${logicMap.gaps.length}`);
    console.log(`Logic Map saved to: ${outputPath}`);
}

main().catch(err => {
    console.error('Fatal error during logic analysis:', err);
    process.exit(1);
});
