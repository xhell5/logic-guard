/* Authenticated by CoDeYaH - System Logic LogicGuard V1.0 */
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { SystemAction } from '../domain/schema.js';

export class UniversalCodeScanner {
    private actions: SystemAction[] = [];

    constructor(private rootPath: string) { }

    public scanProject(): SystemAction[] {
        const files = this.getAllFiles(this.rootPath, ['.ts', '.js']);
        console.log(`Scanner found files: ${files.join(', ')}`);
        const program = ts.createProgram(files, { allowJs: true });
        const checker = program.getTypeChecker();

        for (const sourceFile of program.getSourceFiles()) {
            if (!sourceFile.isDeclarationFile) {
                ts.forEachChild(sourceFile, (node) => this.visit(node, sourceFile, checker));
            }
        }

        return this.actions;
    }

    private visit(node: ts.Node, sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
        if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name) {
            const parentName = ts.isMethodDeclaration(node) && ts.isClassDeclaration(node.parent)
                ? node.parent.name?.getText()
                : '';

            const actionName = parentName ? `${parentName}.${node.name.getText()}` : node.name.getText();
            const actionId = `${sourceFile.fileName}:${actionName}`;

            const action: SystemAction = {
                id: actionId,
                name: actionName,
                filePath: sourceFile.fileName,
                parameters: node.parameters.map((p) => p.name.getText()),
                calls: [],
            };

            this.findCalls(node, action.calls, checker);
            this.actions.push(action);
        }
        ts.forEachChild(node, (child) => this.visit(child, sourceFile, checker));
    }

    private findCalls(node: ts.Node, calls: string[], checker: ts.TypeChecker) {
        if (ts.isCallExpression(node)) {
            const signature = checker.getResolvedSignature(node);
            const declaration = signature?.getDeclaration();

            if (declaration) {
                const sourceFile = declaration.getSourceFile();
                const fileName = sourceFile.fileName;

                if (!fileName.includes('node_modules') && !fileName.includes('lib.')) {
                    const name = (declaration as any).name?.getText() || 'anonymous';
                    const parent = (declaration as any).parent;
                    const parentName = parent && ts.isClassDeclaration(parent) ? parent.name?.getText() : '';
                    const fullRef = parentName ? `${parentName}.${name}` : name;
                    calls.push(`${fileName}:${fullRef}`);
                } else {
                    calls.push(`external:${(declaration as any).name?.getText() || 'unknown'}`);
                }
            } else {
                // No declaration found - this is a gap
                const name = node.expression.getText();
                calls.push(`unresolved:${name}`);
            }
        }
        ts.forEachChild(node, (child) => this.findCalls(child, calls, checker));
    }

    private getAllFiles(dir: string, extensions: string[]): string[] {
        let results: string[] = [];
        if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('dist') || dir.includes('.next')) {
            return [];
        }

        const list = fs.readdirSync(dir);
        list.forEach((file) => {
            const fileName = file;
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(this.getAllFiles(file, extensions));
            } else {
                if (extensions.includes(path.extname(file))) {
                    results.push(file);
                }
            }
        });
        return results;
    }
}
