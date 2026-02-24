/* Authenticated by CoDeYaH - System Logic LogicGuard V1.0 */
import { ActionId, LogicMap, LogicNode, LogicGap } from '../../../core/src/domain/schema.js';

export interface DangerousPattern {
    type: 'CRITICAL_DEPENDENCY_FAILURE' | 'UNVERIFIED_ACTION_CHAIN' | 'CIRCULAR_LOGIC_RISK';
    description: string;
    involvedActions: ActionId[];
    severity: 'HIGH' | 'MEDIUM';
}

export class PatternDetector {
    constructor(private logicMap: LogicMap) { }

    public detect(): DangerousPattern[] {
        const patterns: DangerousPattern[] = [];
        const nodeMap = new Map<ActionId, LogicNode>();
        this.logicMap.nodes.forEach(n => nodeMap.set(n.action.id, n));

        for (const node of this.logicMap.nodes) {
            // Pattern 1: Critical Dependency Failure
            for (const callId of node.action.calls) {
                const dependency = nodeMap.get(callId);
                if (dependency && (dependency.result?.status === 'FAILURE' || dependency.result?.status === 'PENDING')) {
                    patterns.push({
                        type: 'CRITICAL_DEPENDENCY_FAILURE',
                        description: `Action '${node.action.name}' depends on '${dependency.action.name}' which has status '${dependency.result?.status}'.`,
                        involvedActions: [node.action.id, dependency.action.id],
                        severity: dependency.result?.status === 'FAILURE' ? 'HIGH' : 'MEDIUM'
                    });
                }
            }

            // Pattern 2: Unverified Action Chain (Gaps)
            const actionGaps = this.logicMap.gaps.filter(g => g.sourceActionId === node.action.id);
            if (actionGaps.length > 0) {
                patterns.push({
                    type: 'UNVERIFIED_ACTION_CHAIN',
                    description: `Action '${node.action.name}' calls non-existent or unanalyzed actions: ${actionGaps.map(g => g.missingActionName).join(', ')}.`,
                    involvedActions: [node.action.id],
                    severity: actionGaps.some(g => g.severity === 'CRITICAL') ? 'HIGH' : 'MEDIUM'
                });
            }
        }

        return patterns;
    }
}
