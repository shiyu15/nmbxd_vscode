import { ExtensionContext, Webview, Uri } from "vscode";
import { JSDOM } from 'jsdom';
export default class Global {
  static INPUT_CANCEL = -1;
  static context: ExtensionContext | undefined;
  static getBaseUrl(): string {
    return "www.nmbxd1.com";
  }
  static getApiUrl(): string {
    return "api.nmb.best/api";
  }
  static async setUserHash(userHash: string) {
    await this.context?.globalState.update("userHash", userHash);
  }
  static getUserHash(): string | undefined {
    return this.context?.globalState.get("userHash");
  }
  static getCollectId(): string | undefined {
    return this.context?.globalState.get("collectId");
  }
  static setCollectId(collectId: string) {
    this.context?.globalState.update("collectId", collectId);
  }
  static getWebViewContextPath(webview: Webview): string {
    // console.log(webview
    //   .asWebviewUri(Uri.file(this.context!.extensionPath))
    //   .toString());
    console.log(this.context!.extensionPath);

    return webview
      .asWebviewUri(Uri.file(this.context!.extensionPath))
      .toString();
  }
  static extractErrorMessage(html: string): string | null {
    // 使用 JSDOM 创建一个 DOM 实例
    const dom = new JSDOM(html);
    // 获取文档对象
    const doc = dom.window.document;
    // 查找 <p class="error"> 元素
    const errorElement = doc.querySelector('p.error');
    // 返回元素的文本内容
    return errorElement ? errorElement.textContent : null;
  }
  static getFnameByFid(fid: string): string {
    const forumMap: { [key: string]: string } = {
        '-1': '时间线',
        '53': '婆罗门一',
        '12': '漫画',
        '14': '动画综合',
        '31': '影视',
        '116': '主播管人',
        '45': '卡牌桌游',
        '9': '特摄',
        '102': '战锤',
        '39': '胶佬',
        '94': '铁道厨',
        '6': 'VOCALOID',
        '90': '小马',
        '5': '东方Project',
        '93': '舰娘',
        '4': '综合版1',
        '98': 'DANGER_U',
        '20': '欢乐恶搞',
        '121': '速报2',
        '17': '绘画',
        '110': '社畜',
        '19': '故事',
        '81': '都市怪谈',
        '37': '军武',
        '30': '技术宅',
        '75': '数码',
        '118': '宠物',
        '97': '女装2',
        '106': '买买买',
        '111': '跑团',
        '57': '创作茶水间',
        '91': '规则怪谈',
        '11': '海龟汤',
        '15': '科学',
        '103': '文学',
        '35': '音乐',
        '27': 'AI',
        '115': '摄影',
        '112': 'ROLL点',
        '2': '游戏综合',
        '3': '手游专楼',
        '25': '任天堂',
        '22': '腾讯游戏',
        '23': '暴雪游戏',
        '124': 'SE',
        '70': 'V社',
        '28': '怪物猎人',
        '68': '鹰角游戏',
        '47': '米哈游',
        '34': '音游打卡',
        '10': '联机',
        '62': '露营',
        '113': '育儿',
        '120': '自救互助',
        '32': '料理',
        '33': '体育',
        '56': '学业打卡',
        '89': '日记',
        '18': '值班室',
        '117': '技术支持',
        '96': '版务',
        '60': '百脑汇'
    };

    return forumMap[fid] || '';
  }
}
