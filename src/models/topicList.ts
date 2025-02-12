export class TopicList{

    public forumName:string;
    // 帖子id:
    public id:string="";

    // 板块id
    public fid:string="";

    public now:string="";
    //发帖人id:
    public userHash:string="";

    public cite:string="";
    // 帖子内容
    public content:string="";

    public replyCount: number=0;
    // 子板块列表
    public replies:TopicList[]=[];

    public sage:boolean=false;

    public hide:boolean=false;

    public img:string="";

    public ext:string="";

    constructor(name:string, id: string = "", fid: string = "", now: string="", userHash:string="",
        content:string, replyList: TopicList[], sage:boolean, hide:boolean, replyCount:number,
        img:string, ext:string, cite?: string) {
        this.forumName=name;
        this.id = id;
        this.fid= fid;
        this.now=now;
        this.userHash=userHash;
        this.content=content;
        this.replies=replyList;
        this.sage=sage;
        this.hide = hide;
        this.replyCount=replyCount;
        this.img=img;
        this.ext=ext;
        this.cite = cite || "";
    }
}


export class TopicState{
    public isOnlyAuthor:boolean=false;
    public page:number=1;
    public isCollect:boolean=false;
    public allPage:number=1;
    constructor(isOnlyAuthor:boolean, page:number, isCollect:boolean, allPage:number){
        this.isOnlyAuthor=isOnlyAuthor;
        this.page=page;
        this.isCollect=isCollect;
        this.allPage=allPage;
    }
}