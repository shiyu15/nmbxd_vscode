export class Forum {
  // 板块id
  public fid: string = '';
  // 板块汉字名称
  public name: string = '';
  // 子板块列表
  public child: Forum[] = [];
  // 某个分论坛中的所有帖子数量
  public threadNumber: number = 0;

  // 板块类型，0为普通板块，1为时间线板块
  public type: number = 0;

  constructor(
    fid: string = '',
    name: string = '',
    child: Forum[] = [],
    threadNumber: number = 0,
    type: number = 0,
  ) {
    this.fid = fid;
    this.name = name;
    this.child = child;
    this.threadNumber = threadNumber;
    this.type = type;
  }
}

export interface ForumData {
  fid: string;
  name: string;
  forums?: ForumData[];
}

export class ForumState {
  public allPage: number;
  public page: number;
  constructor(allPage: number, page: number) {
    this.allPage = allPage;
    this.page = page;
  }
}
