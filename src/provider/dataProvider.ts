import { TreeDataProvider, Event, TreeItem, TreeItemCollapsibleState, ProviderResult, EventEmitter } from "vscode";
import http from "../http";
import Global from "../global";
import { NMBXD } from "../nmbxd";
import { Forum, ForumData } from '../models/forum';
import * as vscode from 'vscode';

export class DataProvider implements TreeDataProvider<ForumItem> {
    private _onDidChangeTreeData: EventEmitter<ForumItem | undefined | null | void> = new EventEmitter<ForumItem | undefined | null | void>();
    readonly onDidChangeTreeData: Event<ForumItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private forumData: Forum[] = [];
    
    // 添加缓存相关的方法
    private async getCachedForumData(): Promise<Forum[]> {
        return await Global.context?.globalState.get('cachedForumData') || [];
    }

    private async setCachedForumData(data: Forum[]) {
        await Global.context?.globalState.update('cachedForumData', data);
    }

    constructor() {
        this.refreshForumData();
    }

    async refreshForumData() {
        try {
            // 获取新数据
            this.forumData = await NMBXD.getForumTree();
            // 更新缓存
            await this.setCachedForumData(this.forumData);
            
            this._onDidChangeTreeData.fire();
        } catch (error) {
            // 从缓存获取数据
            this.forumData = await this.getCachedForumData();
            if (this.forumData.length > 0) {
                console.log("获取论坛数据失败，使用缓存数据");
            } else {
                console.log("获取论坛数据失败，且无可用缓存");
                vscode.window.showErrorMessage("获取论坛数据失败，且无可用缓存");
            }
            console.error("获取论坛数据失败:", error);
            this._onDidChangeTreeData.fire();
        }
    }

    getTreeItem(element: ForumItem): TreeItem | Thenable<TreeItem> {
        return element;
    }


    getChildren(element?: ForumItem): ProviderResult<ForumItem[]> {
        if (element === undefined) {
            // 返回顶层类别
            return this.forumData.map(category =>{
                //处理版块列表
                let forum=new ForumItem(category.name, category.fid, TreeItemCollapsibleState.Collapsed,true,category.type===1,false);
                //处理所属版块
                forum.children = forum.children.concat(category.child.map(elementContent => {
                    const child=new ForumItem(elementContent.name, elementContent.fid, TreeItemCollapsibleState.None,true,elementContent.type===1,false);
                    child.threadNumber=elementContent.threadNumber;
                    child.command={
                        command:"nmbxd.forumItemClick",
                        title:"点击",
                        arguments:[child]
                    };
                    return child;
                }));
                return forum;
            } 
                
            );
        } 
        if(element.children){
            return element.children;
        }
        return [];
    }
}

export class ForumItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly forumId: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly isDir:boolean,
        public readonly isTimeLine:boolean,
        public readonly isCollect:boolean
        
    ) {
        
        super(label, collapsibleState);
        this.tooltip = this.label;
    }
    public children: ForumItem[]=[];
    // 某个分论坛中的所有帖子数量
    public threadNumber:number=0;
}
