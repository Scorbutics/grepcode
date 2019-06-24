import { ExtensionContext, Memento, Disposable, WorkspaceConfiguration } from "vscode";

import * as vscode from 'vscode';

export class ExtensionBuilder {

  private static lazyGetRegexps(globalState: Memento): Array<string> {
    const key = "regexps";
    if(globalState.get<Array<string>>(key) == null) {
      globalState.update(key, new Array<string>());
    }
    let result = globalState.get<Array<string> | undefined>(key);
    return <Array<string>> result;
  }

  private static buildParameterAddCommand(configuration: WorkspaceConfiguration, parameters: Array<string>) {
    let disposable = vscode.commands.registerCommand('extension.grepcode.parameter.add', function () {     
      const editor = vscode.window.activeTextEditor;
      if(editor == undefined) {
        return;
      }
      let cursor = editor.selection;
      let selected = editor.document.getText(cursor);
  
      parameters.push(selected);
      configuration.update("hasParameters", parameters.length > 0);
      vscode.window.showInformationMessage("\"" + selected + "\" saved as parameter number " + parameters.length);
    });

    return disposable;
  }

  private static buildParameterRemoveCommand(configuration: WorkspaceConfiguration, parameters: Array<string>) {
    let disposable = vscode.commands.registerCommand('extension.grepcode.parameter.remove', function () {     
      vscode.window.showQuickPick(parameters).then((value: string | undefined) => {
        if(value != undefined) {
          parameters.splice(parameters.indexOf(value));
          configuration.update("hasParameters", parameters.length > 0);
          vscode.window.showInformationMessage("\"" + value + "\" parameter removed");
        }
      });
    });
    return disposable;
  }

  private static buildPatternAddCommand(configuration: WorkspaceConfiguration, regexps: Array<string>) {
    let disposable = vscode.commands.registerCommand('extension.grepcode.pattern.add', function () {     
      vscode.window.showInputBox({}).then((value: string | undefined) => {
        if(value != undefined) {
          regexps.push(value);
          configuration.update("hasPatterns", regexps.length > 0);
        }
      });
    });
    return disposable;
  }

  private static buildPatternRemoveCommand(configuration: WorkspaceConfiguration, regexps: Array<string>) {
    let disposable = vscode.commands.registerCommand('extension.grepcode.pattern.remove', function () {     
      vscode.window.showQuickPick(regexps).then((value: string | undefined) => {
        if(value != undefined) {
          regexps.splice(regexps.indexOf(value));
          vscode.window.showInformationMessage("\"" + value + "\" pattern removed");
          configuration.update("hasPatterns", regexps.length > 0);
        }
      });
    });
    return disposable;
  }

  private static buildPatternSearchCommand(configuration: WorkspaceConfiguration, parameters: Array<string>, regexps: Array<string>) {
    let disposable = vscode.commands.registerCommand('extension.grepcode.pattern.search', function () {      
      vscode.window.showQuickPick(regexps).then((item: string|undefined) => {
        if(item == undefined) {
          return;
        }
        let index = 0;
        let finalStr = item;
        for(let s of parameters) {
          finalStr = finalStr.split("(" + index + ")").join(s);
          index++;
        }
        vscode.env.clipboard.writeText(finalStr);
        vscode.window.showInformationMessage("\"" + finalStr + "\" copied in clipboard !");
        parameters.splice(0, parameters.length);
        configuration.update("hasParameters", parameters.length > 0);
      });
    });
    return disposable;
  }


  public static build(context: ExtensionContext) {
    let configuration = vscode.workspace.getConfiguration("grepcode");

    let parameters = new Array<string>();
    let regexps = ExtensionBuilder.lazyGetRegexps(context.globalState);
    configuration.update("hasPatterns", regexps.length > 0);

    // (0)::(0)\W*\(
    context.subscriptions.push(ExtensionBuilder.buildPatternSearchCommand(configuration, parameters, regexps));
    context.subscriptions.push(ExtensionBuilder.buildPatternAddCommand(configuration, regexps));
    context.subscriptions.push(ExtensionBuilder.buildPatternRemoveCommand(configuration, regexps));

    context.subscriptions.push(ExtensionBuilder.buildParameterRemoveCommand(configuration, parameters));
    context.subscriptions.push(ExtensionBuilder.buildParameterAddCommand(configuration, parameters));
  }

}