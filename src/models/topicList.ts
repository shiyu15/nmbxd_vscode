export class TopicList{

    public name:string;
    // 帖子id:
    public id:string="";

    // 板块id
    public fid:string="";

    public now:string="";
    //发帖人id:
    public userHash:string="";
    // 帖子内容
    public content:string="";

    public replyCount: number=0;
    // 子板块列表
    public replies:TopicList[]=[];

    public sage:boolean=false;

    public hide:boolean=false;

    constructor(name:string, id: string = "", fid: string = "", now: string="", userHash:string="",
        content:string, replyList: TopicList[], sage:boolean, hide:boolean) {
        this.name=name;
        this.id = id;
        this.fid= fid;
        this.now=now;
        this.userHash=userHash;
        this.content=content;
        this.replies=replyList;
        this.sage=sage;
        this.hide = hide;
        this.replyCount=this.replies.length;
    }
}