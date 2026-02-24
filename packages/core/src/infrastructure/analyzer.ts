/* Authenticated by CoDeYaH - System Logic LogicGuard V1.0 */
import { SystemAction, LogicMap, LogicNode, LogicGap, SystemResult, ActionId } from '../domain/schema.js';

export class LogicDetector {
    constructor(private actions: SystemAction[]) { }

    public analyze(): LogicMap {
        const nodes: LogicNode[] = [];
        const gaps: LogicGap[] = [];
        const actionMap = new Map<ActionId, SystemAction>();

        // Index actions
        this.actions.forEach((a) => actionMap.set(a.id, a));

        for (const action of this.actions) {
            const result: SystemResult = {
                actionId: action.id,
                status: 'SUCCESS',
                probabilityOfFailure: 0,
                dependenciesMet: true,
            };

            for (const callId of action.calls) {
                if (!actionMap.has(callId)) {
                    // If it's unresolved or not in our map, it's a potential gap
                    const name = callId.split(':').pop() || 'unknown';

                    if (callId.startsWith('unresolved:')) {
                        gaps.push({
                            sourceActionId: action.id,
                            missingActionName: name,
                            severity: 'WARNING',
                        });
                        result.dependenciesMet = false;
                        result.probabilityOfFailure += 0.2; // Increase failure probability for each unresolved call
                    } else {
                        // Technically defined in some file but maybe not "properly" if it's external?
                        // For this system, we consider internal gaps as CRITICAL
                    }
                }
            }

            // Final failure probability heuristic
            if (result.probabilityOfFailure > 0.8) {
                result.status = 'FAILURE';
            } else if (result.probabilityOfFailure > 0) {
                result.status = 'PENDING';
            }

            nodes.push({ action, result });
        }

        // Secondary pass to find calls to explicitly missing nodes (CRITICAL GAPS)
        this.findCriticalGaps(nodes, gaps);

        return { nodes, gaps };
    }

    private findCriticalGaps(nodes: LogicNode[], gaps: LogicGap[]) {
        const validIds = new Set(nodes.map(n => n.action.id));

        for (const node of nodes) {
            for (const callId of node.action.calls) {
                if (!callId.startsWith('unresolved:') && !callId.startsWith('external:') && !validIds.has(callId)) {
                    gaps.push({
                        sourceActionId: node.action.id,
                        missingActionName: callId.split(':').pop() || 'unknown',
                        severity: 'CRITICAL',
                    });
                    if (node.result) {
                        node.result.dependenciesMet = false;
                        node.result.probabilityOfFailure = 1.0;
                        node.result.status = 'FAILURE';
                    }
                }
            }
        }
    }
}
