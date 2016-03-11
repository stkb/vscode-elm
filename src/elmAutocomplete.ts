import { join } from 'path';
import * as vscode from 'vscode';
import { CompletionItem, Position, Range } from 'vscode'

import { OracleResult, getOracleResults } from './elmOracle'
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
      return getOracleResults(document)
        .then(processOracleResults);
      }
    }
    
}

interface Info {
  name: string;
  comment: string;
}

interface ModuleInfo extends Info {
  types: Info[];
  values: Info[];
}

function getAvailableModulesToImport(fileName: string): CompletionItem[]
{
  const packageDocFiles = getPackageDocFileNames(fileName);
  return packageDocFiles
    .map(require)
    .map((modules: ModuleInfo[]) => {
      return modules.map(m => {
        const item = new CompletionItem(m.name);
        item.kind = vscode.CompletionItemKind.Module;
        item.detail = m.comment;
        return item;
      })
    })
    .reduce((arr, acc) => acc.concat(arr), [] as CompletionItem[]);
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

function processOracleResults(results: OracleResult[]): CompletionItem[] {
  
  // Oracle gives us little indication that a module member is available without
  // a fully-qualified name, eg `constant` in:
  //   import Signal exposing (constant)
  // The only way to tell is that that result appears twice in the list of
  // results, though both results are identical.
  const resultsMap = new Map() as Map<string, CompletionItem>
  results.forEach(result => {
    const fullName = result.fullName;
    let item: CompletionItem
    
    // If already in the map, it's an exposed member. Adjust the label to put
    // the short name first, and the insertText.
    if(item = resultsMap.get(result.fullName)) {
      item.insertText = result.name;
      item.label = `${result.name} (${result.fullName.match(/.+(?=\.)/)[0]})`
    }
    
    else {
      item = new CompletionItem(result.fullName);
      item.insertText = result.fullName;
      // Should this be this way round?
      item.detail = result.signature;
      item.documentation = result.comment;
      resultsMap.set(result.fullName, item);
    }
  });
  
  return Array.from(resultsMap.values());
}