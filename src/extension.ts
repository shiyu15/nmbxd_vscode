// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import login from "./login";
import { DataProvider,ForumItem } from './provider/dataProvider';
import { TopicList } from './models/topicList';
import {createForumItem} from './commands/forumItemClick';
import {createTopicItem} from './commands/topicClick';
import Global from './global';
import addCollectId from './addCollectId';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	//初始化context
	Global.context = context;

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "nmbxd" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable1 = vscode.commands.registerCommand('nmbxd.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from nmbxd!');
	});

	let disposable2 = vscode.commands.registerCommand('nmbxd.login', () => {
		login();
	});

	let disposable3 = vscode.commands.registerCommand('nmbxd.forumItemClick', (item: ForumItem) => {
		console.log("打开分论坛");
		createForumItem(item);
	});

	let disposable4 = vscode.commands.registerCommand('nmbxd.topicClick', (item: TopicList) => {
		console.log("打开帖子");
		createTopicItem(item);
	});

	let disposable5 = vscode.commands.registerCommand('nmbxd.addCollectId', () => {
		console.log("添加订阅ID");
		addCollectId();
	});

	vscode.window.createTreeView("nmbxdForumList",{ 
		treeDataProvider: new DataProvider(),
		showCollapseAll: true}
	);

	// vscode.window.createTreeView("nmbxdFavorites",{ 
	// 	treeDataProvider: new DataProvider(),
	// 	showCollapseAll: true}
	// );


	context.subscriptions.push(disposable1,
		disposable2,
		disposable3,
		disposable4,
		disposable5,
	);

}

// This method is called when your extension is deactivated
export function deactivate() {}
