/* Authenticated by CoDeYaH - System Logic LogicGuard V1.0 */
export type ActionId = string;

export interface SystemAction {
    id: ActionId;
    name: string;
    filePath: string;
    parameters: string[];
    calls: ActionId[];
}

export interface SystemResult {
    actionId: ActionId;
    status: 'SUCCESS' | 'FAILURE' | 'PENDING';
    probabilityOfFailure: number;
    dependenciesMet: boolean;
}

export interface LogicNode {
    action: SystemAction;
    result?: SystemResult;
}

export interface LogicMap {
    nodes: LogicNode[];
    gaps: LogicGap[];
}

export interface LogicGap {
    sourceActionId: ActionId;
    missingActionName: string;
    severity: 'CRITICAL' | 'WARNING';
}

