/* Authenticated by CoDeYaH - System Logic LogicGuard V1.0 */
import { ActionId, LogicMap, LogicNode } from '../../../core/src/domain/schema.js';
import * as fs from 'fs';
import * as path from 'path';

export interface SelfAuditFinding {
    type: 'CIRCULAR_DEPENDENCY' | 'DEAD_LOGIC' | 'STATIC_WEAKNESS' | 'ASYNC_RISK';
    description: string;
    location: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class SelfAuditor {
    constructor(private logicMap: LogicMap) { }

    public performAudit(): SelfAuditFinding[] {
        const findings: SelfAuditFinding[] = [];

        findings.push(...this.detectCircularDependencies());
        findings.push(...this.detectDeadLogic());
        findings.push(...this.detectStaticWeaknesses());
        findings.push(...this.detectAsyncRisks());

        return findings;
    }

    private detectCircularDependencies(): SelfAuditFinding[] {
        const findings: SelfAuditFinding[] = [];
        const adj = new Map<ActionId, ActionId[]>();
        this.logicMap.nodes.forEach(n => adj.set(n.action.id, n.action.calls));

        const visited = new Set<ActionId>();
        const recStack = new Set<ActionId>();

        const checkCycle = (u: ActionId, path: ActionId[]) => {
            visited.add(u);
            recStack.add(u);

            for (const v of adj.get(u) || []) {
                if (v === u) continue; // Skip direct recursion - it's intended

                if (!visited.has(v)) {
                    if (checkCycle(v, [...path, v])) return true;
                } else if (recStack.has(v)) {
                    // Only flag if it crosses function boundaries in a non-trivial way
                    findings.push({
                        type: 'CIRCULAR_DEPENDENCY',
                        description: `Inter-function cycle detected: ${path.join(' -> ')} -> ${v}`,
                        location: u,
                        severity: 'HIGH'
                    });
                    return true;
                }
            }
            recStack.delete(u);
            return false;
        };

        for (const node of this.logicMap.nodes) {
            if (!visited.has(node.action.id)) {
                checkCycle(node.action.id, [node.action.id]);
            }
        }

        return findings;
    }

    private detectDeadLogic(): SelfAuditFinding[] {
        const findings: SelfAuditFinding[] = [];
        const incomingCount = new Map<ActionId, number>();

        this.logicMap.nodes.forEach(n => incomingCount.set(n.action.id, 0));

        for (const node of this.logicMap.nodes) {
            for (const callId of node.action.calls) {
                incomingCount.set(callId, (incomingCount.get(callId) || 0) + 1);
            }
        }

        for (const [id, count] of incomingCount.entries()) {
            if (count === 0 && !id.includes(':main')) { // Exclude entry points
                findings.push({
                    type: 'DEAD_LOGIC',
                    description: `Function defined but never called internally: ${id.split(':').pop()}`,
                    location: id,
                    severity: 'MEDIUM'
                });
            }
        }

        return findings;
    }

    private detectStaticWeaknesses(): SelfAuditFinding[] {
        const findings: SelfAuditFinding[] = [];
        // Regex for absolute paths that look like system paths (e.g. C:\Users or /home/)
        const pathRegex = /(["'])(?:[a-zA-Z]:\\|\/Users\/|\/home\/)(?:[^"'\n]+)\1/g;

        const uniqueFiles = new Set(this.logicMap.nodes.map(n => n.action.filePath));
        for (const file of uniqueFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (line.includes('//') || line.includes('/*')) return; // Simple comment skip

                    let match;
                    while ((match = pathRegex.exec(line)) !== null) {
                        findings.push({
                            type: 'STATIC_WEAKNESS',
                            description: `Hardcoded system path: ${match[0]}`,
                            location: `${file}:${index + 1}`,
                            severity: 'MEDIUM'
                        });
                    }
                });
            }
        }
        return findings;
    }

    private detectAsyncRisks(): SelfAuditFinding[] {
        const findings: SelfAuditFinding[] = [];
        // Identify functions that call async methods but don't seem to await them (heuristic)
        for (const node of this.logicMap.nodes) {
            const content = fs.readFileSync(node.action.filePath, 'utf-8');
            const functionLines = content.split('\n'); // Simplified, should really use AST

            // Look for .catch or unawaited promises in the vicinity of calls
            // For this audit, we flag complex loops and recursion as performance risk
            if (node.action.calls.length > 10) {
                findings.push({
                    type: 'ASYNC_RISK',
                    description: `High complexity action (${node.action.calls.length} calls). Potential bottleneck under load.`,
                    location: node.action.id,
                    severity: 'LOW'
                });
            }
        }
        return findings;
    }
}
