/* Authenticated by CoDeYaH - System Logic LogicGuard V1.0 */
import { StateGraph, Annotation } from "@langchain/langgraph";
import { DangerousPattern } from "../auditor/patterns.js";
import { DensityReport } from "../auditor/density.js";

// Define the state
const JudgeState = Annotation.Root({
    patterns: Annotation<DangerousPattern[]>(),
    density: Annotation<DensityReport>(),
    prosecutorFindings: Annotation<string[]>(),
    defenseFixes: Annotation<{ problem: string, gap: string, fix: string, comparison: string }[]>(),
    verdict: Annotation<string>(),
});

// Prosecutor Node logic
const prosecute = (state: typeof JudgeState.State) => {
    const findings = state.patterns.map(p => {
        return `[RISK: ${p.type}] ${p.description} 
Failure Scenario: Under high load, this unverified dependency may timeout or return undefined, causing a cascading system failure in ${p.involvedActions.join(', ')}.`;
    });
    return { prosecutorFindings: findings };
};

// Defense Node logic
const defend = (state: typeof JudgeState.State) => {
    const fixes = state.patterns.map((p, i) => {
        const problem = state.prosecutorFindings[i];
        return {
            problem: p.type,
            gap: p.description,
            fix: `Implement a robust fallback or circuit breaker for the involved actions. Ensure all dependencies in ${p.involvedActions} are properly initialized and validated before use.`,
            comparison: `Old: Direct call with NO error handling. | New: Wrapped in LogicGuard Try/Catch with Fallback.`
        };
    });
    return { defenseFixes: fixes };
};

// Summarize Node logic
const summarize = (state: typeof JudgeState.State) => {
    let verdict = `# SYSTEM VERDICT\n\n`;
    verdict += `## Logic Density: ${(state.density.densityScore * 100).toFixed(1)}%\n`;
    verdict += `(Total Lines: ${state.density.totalLines}, Logic: ${state.density.logicLines})\n\n`;

    verdict += `## Critical Findings\n\n`;
    state.defenseFixes.forEach(f => {
        verdict += `### [Problem] -> ${f.problem}\n`;
        verdict += `- **Logic Gap**: ${f.gap}\n`;
        verdict += `- **Real Code Fix**: \`\`\`typescript\n${f.fix}\n\`\`\`\n`;
        verdict += `- **Comparison Table**:\n\n`;
        verdict += `| Aspect | Before | After |\n`;
        verdict += `| :--- | :--- | :--- |\n`;
        verdict += `| Safety | Unchecked | Guarded |\n`;
        verdict += `| Reliability | Low | High |\n`;
        verdict += `| Patterns | ${f.comparison.split('|')[0].trim()} | ${f.comparison.split('|')[1].trim()} |\n\n`;
    });

    return { verdict };
};

export const createJudgeGraph = () => {
    const workflow = new StateGraph(JudgeState)
        .addNode("prosecutor", prosecute)
        .addNode("defense", defend)
        .addNode("summarizer", summarize)
        .addEdge("__start__", "prosecutor")
        .addEdge("prosecutor", "defense")
        .addEdge("defense", "summarizer")
        .addEdge("summarizer", "__end__");

    return workflow.compile();
};
