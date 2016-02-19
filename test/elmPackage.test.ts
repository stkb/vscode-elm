import * as assert from 'assert'
import { statSync } from 'fs'
import { join, dirname } from 'path'
import { commands, workspace, Uri } from 'vscode';
import { execCmd, isWindows, detectProjectRoot } from '../src/elmUtils';

suite("ElmPackage", () => {
  const stuffPath = join(__dirname, '../../test/fixtures/elm-stuff');
  
  // Test that the command ran, in a crude way, by checking that the /elm-stuff
  // folder was created.
  test("Runs elm-package install command", function() {
    this.timeout(10000);
    
    // Check workspace.rootPath is what we're expecting
    assert.equal(workspace.rootPath, dirname(stuffPath));
    
    require('rimraf').sync(stuffPath);
    return commands.executeCommand('elm.install')
      .then(() => {
        // throws if path doesn't exist
        statSync(stuffPath);
        require('rimraf').sync(stuffPath);
      });
  });
});