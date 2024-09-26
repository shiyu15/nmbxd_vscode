export class Forum{

    // 板块id
    public fid:string="";
    // 板块汉字名称
    public name:string="";
    // 子板块列表
    public child:Forum[]=[];
    constructor(fid: string = "", name: string = "", child: Forum[] = []) {
        this.fid = fid;
        this.name = name;
        this.child = child;
    }

}

export interface ForumData {
    fid: string;
    name: string;
    forums?: ForumData[];
}