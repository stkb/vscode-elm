import { join } from 'path';
import * as vscode from 'vscode';
import { CompletionItem, Position, Range } from 'vscode'

import * as oracle from './elmOracle'
import { detectProjectRoot } from './elmUtils'

export class ElmCompletionProvider implements vscode.CompletionItemProvider {

  public provideCompletionItems(
    document: vscode.TextDocument,
    position: Position,
    token: vscode.CancellationToken)
    : Thenable<vscode.CompletionItem[]>
  {
    const lineTextUpToCursor =
      document.lineAt(position).text.substr(0, position.character)
    let match: RegExpMatchArray

        
    if (match = lineTextUpToCursor.match(/^import\s+\S*$/)) {
      return Promise.resolve(
        getAvailableModulesToImport(document.fileName)
      );
    }
    else {
      return oracle.GetOracleResults(document, position)
        .then((result) => {
          var r = result.map((v, i, arr) => {
            var ci : vscode.CompletionItem = new CompletionItem(v.fullName);
            ci.kind = 0;
            ci.insertText = v.fullName;
            ci.detail = v.signature;
            ci.documentation = v.comment;
            return ci;
          });
          return r;
        });
      }
    }
    
}

interface Info {
  name: string;
  comment: string;
}

interface ModuleInfo extends Info {
  types: Info[]
  values: Info[]
}

function getAvailableModulesToImport(fileName: string): CompletionItem[]
{
  const packageDocFiles = getPackageDocFileNames(fileName);
  return packageDocFiles
    .map(require)
    .map((modules: any[]) => {
      return modules.map(m => {
        const item = new CompletionItem(m.name);
        item.kind = vscode.CompletionItemKind.Module;
        item.detail = m.comment;
        return item;
      })
    })
    .reduce((arr, acc) => acc.concat(arr), [] as CompletionItem[])
}

function getPackageDocFileNames(fileName: string): string[]
{
  const rootDir = detectProjectRoot(fileName);

  // If we're not in a project, no packages available, so return empty array
  if (!rootDir) {
    return []
  }

  else {
    const stuffDir = join(rootDir, 'elm-stuff')
    const depsObj = require(join(stuffDir, 'exact-dependencies.json'));

    return Object.keys(depsObj)
      .map(dep => join(stuffDir, 'packages', dep, depsObj[dep], 'documentation.json'))
  }  
}