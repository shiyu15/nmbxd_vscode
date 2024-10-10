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