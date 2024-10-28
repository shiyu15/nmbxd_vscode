import { TreeDataProvider, Event, TreeItem, TreeItemCollapsibleState, ProviderResult, EventEmitter } from "vscode";
import http from "../http";
import Global from "../global";
import { NMBXD } from "../nmbxd";
import { Forum, ForumData } from '../models/forum';

export class DataProvider implements TreeDataProvider<ForumItem> {
    private _onDidChangeTreeData: EventEmitter<ForumItem | undefined | null | void> = new EventEmitter<ForumItem | undefined | null | void>();
    readonly onDidChangeTreeData: Event<ForumItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private forumData: Forum[] = [];

    constructor() {
        this.refreshForumData();
    }

    async refreshForumData() {
        try {
            this.forumData = await NMBXD.getForumTree();
            
            this._onDidChangeTreeData.fire();
        } catch (error) {
            console.error("获取论坛数据失败:", error);
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
                let forum=new ForumItem(category.name, category.fid, TreeItemCollapsibleState.Collapsed,true);
                //处理所属版块
                forum.children = forum.children.concat(category.child.map(elementContent => {
                    const child=new ForumItem(elementContent.name, elementContent.fid, TreeItemCollapsibleState.None,true);
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
        // 版块的id和版块类别的id有重复，不用id，会不显示
        public readonly forumId: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly isDir:boolean
        
    ) {
        
        super(label, collapsibleState);
        this.tooltip = this.label;
    }
    public children: ForumItem[]=[];
    // 某个分论坛中的所有帖子数量
    public threadNumber:number=0;
}
