import * as vscode from 'vscode';
import * as cp from 'child_process';
import { execCmd } from './elmUtils';

let oc: vscode.OutputChannel = vscode.window.createOutputChannel('Elm Package');

function runInstall(): Thenable<void> {
  return execCmd('elm-package install --yes', {
    onStdout: (data) => oc.append(data),
    onStderr: (data) => oc.append(data),
    onStart: () => oc.show(vscode.ViewColumn.Three),
    showMessageOnError: true
  }).then(() => { })
}

export function activatePackage(): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('elm.install', runInstall)];
}