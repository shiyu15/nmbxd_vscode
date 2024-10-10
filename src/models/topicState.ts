export class TopicState{
    public isOnlyAuthor:boolean=false;
    public page:number=1;
    public isCollect:boolean=false;
    constructor(isOnlyAuthor:boolean, page:number, isCollect:boolean){
        this.isOnlyAuthor=isOnlyAuthor;
        this.page=page;
        this.isCollect=isCollect;
    }
}