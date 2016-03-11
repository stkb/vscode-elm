import * as cp from 'child_process';
import * as path from 'path';
import {pluginPath, detectProjectRoot} from './elmUtils';
import * as vscode from 'vscode';

export interface OracleResult {
  name: string;
  fullName: string;
  href: string;
  signature: string;
  comment: string;
}

export function getOracleResults(document: vscode.TextDocument, position?: vscode.Position): Thenable<OracleResult[]> {
  return new Promise((resolve: Function, reject: Function) => {
      let p: cp.ChildProcess;
      let filename: string = document.fileName;
      let cwd = detectProjectRoot(document.fileName) || vscode.workspace.rootPath;
      let fn = path.relative(cwd, filename)
      let currentWord = position ?
        document.getText(document.getWordRangeAtPosition(position)) : '""';
      let oracle = pluginPath + path.sep + 'node_modules' + path.sep + 'elm-oracle' + path.sep + 'bin' + path.sep + 'elm-oracle \"' + fn + '\" ' + currentWord;
    
      p = cp.exec('node ' + oracle, { cwd: cwd }, (err: Error, stdout: Buffer, stderr: Buffer) => {
        try {
          if (err) {
            return resolve(null);
          }
          let result: OracleResult[] = JSON.parse(stdout.toString());
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
      p.stdin.end(document.getText());
    });
}