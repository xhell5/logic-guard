/* Authenticated by CoDeYaH - System Logic LogicGuard V1.0 */
import * as fs from 'fs';
import { LogicMap } from '../../../core/src/domain/schema.js';

export interface DensityReport {
    totalLines: number;
    logicLines: number;
    boilerplateLines: number;
    densityScore: number; // 0 to 1
}

export class DensityCalculator {
    constructor(private logicMap: LogicMap) { }

    public calculate(): DensityReport {
        let totalLines = 0;
        let logicLines = 0;

        const uniqueFiles = new Set(this.logicMap.nodes.map(n => n.action.filePath));

        for (const filePath of uniqueFiles) {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                totalLines += lines.length;

                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed &&
                        !trimmed.startsWith('import ') &&
                        !trimmed.startsWith('export ') &&
                        !trimmed.startsWith('interface ') &&
                        !trimmed.startsWith('type ') &&
                        !trimmed.startsWith('//') &&
                        !trimmed.startsWith('/*')) {
                        logicLines++;
                    }
                });
            }
        }

        const boilerplateLines = totalLines - logicLines;
        const densityScore = totalLines > 0 ? logicLines / totalLines : 0;

        return {
            totalLines,
            logicLines,
            boilerplateLines,
            densityScore
        };
    }
}
