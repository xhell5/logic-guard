/* Authenticated by CoDeYaH - System Logic LogicGuard V1.0 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { UniversalCodeScanner } from '../../core/src/infrastructure/scanner.js';
import { SelfAuditor, SelfAuditFinding } from './auditor/self-audit.js';
import { DensityCalculator } from './auditor/density.js';

const BANNER = `
   ______      ____      __  __      __  __ 
  / ____/___  / __ \\___  \\ \\/ /___ _/ / / / 
 / /   / __ \\/ / / / _ \\  \\  / __ \`/ /_/ /  
/ /___/ /_/ / /_/ /  __/  / / /_/ / __  /   
\\____/\\____/_____/\\___/  /_/\\__,_/_/ /_/    
   LogicGuard V1.0 | Logic Authenticated
`;

async function runFullAudit() {
    console.log(BANNER);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const rootDir = path.resolve(__dirname, '../../..');
    console.log(`--- System Logic Auditor: FULL SCALE STRESS TEST ---`);
    console.log(`Scanning Monorepo Root: ${rootDir}`);

    // 1. Extraction & Mapping
    const scanner = new UniversalCodeScanner(rootDir);
    const actions = scanner.scanProject();

    // 2. Perform Self-Audit
    const auditor = new SelfAuditor({ nodes: actions.map(a => ({ action: a })), gaps: [] });
    const findings = auditor.performAudit();

    // 3. Density & Package Analysis
    const densityCalc = new DensityCalculator({ nodes: actions.map(a => ({ action: a })), gaps: [] });
    const density = densityCalc.calculate();

    // 4. Generate Report
    generateReport(findings, density, rootDir);
}

function generateReport(findings: SelfAuditFinding[], density: any, rootDir: string) {
    const integrityScore = Math.max(0, 100 - (findings.length * 5));

    let report = `# System Self-Audit Report (V1 Stress Test)\n\n`;
    report += `## Integrity Score: ${integrityScore}%\n`;
    report += `Audit Date: ${new Date().toISOString()}\n\n`;

    report += `## Logic Density Analysis\n`;
    report += `- **Total Lines**: ${density.totalLines}\n`;
    report += `- **Core Logic**: ${density.logicLines} lines\n`;
    report += `- **UI/Boilerplate**: ${density.boilerplateLines} lines\n`;
    report += `- **Density**: ${(density.densityScore * 100).toFixed(1)}%\n\n`;

    report += `## Top 5 Critical Impurities\n\n`;
    const highSeverity = findings.filter(f => f.severity === 'HIGH').slice(0, 5);
    highSeverity.forEach(f => {
        report += `### [${f.type}] - ${f.severity}\n`;
        report += `- **Description**: ${f.description}\n`;
        report += `- **Location**: \`${f.location}\`\n\n`;
    });

    if (highSeverity.length === 0) report += "No high-severity impurities detected. System structure is stable.\n\n";

    report += `## Performance Bottlenecks\n`;
    const bottlenecks = findings.filter(f => f.type === 'ASYNC_RISK');
    bottlenecks.forEach(f => {
        report += `- **${f.location}**: ${f.description}\n`;
    });

    report += `\n## Static Weaknesses\n`;
    const staticW = findings.filter(f => f.type === 'STATIC_WEAKNESS');
    staticW.forEach(f => {
        report += `- **${f.location}**: ${f.description}\n`;
    });

    report += `\n## Refactoring Roadmap (V2.0)\n`;
    report += `1. **Move to Environment Variables**: Resolve ${staticW.length} static path weaknesses.\n`;
    report += `2. **Dependency Optimization**: Clean up dead logic functions (${findings.filter(f => f.type === 'DEAD_LOGIC').length} identified).\n`;
    report += `3. **Async Hardening**: Implement strict timeout/retry for high-complexity nodes.\n`;

    const reportPath = path.join(process.cwd(), 'system-self-audit-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`--- Stress Test Complete ---`);
    console.log(`Integrity Score: ${integrityScore}%`);
    console.log(`Report saved to: ${reportPath}`);
}

runFullAudit().catch(err => {
    console.error('Stress test failed:', err);
});
