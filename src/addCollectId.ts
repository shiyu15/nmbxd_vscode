import * as vscode from 'vscode';
import Global from './global';
import { NMBXD } from './nmbxd';

/**
 * @description:
 * @return {*}
 */
export default async function addCollectId(): Promise<boolean> {
  let userHash = await vscode.window.showInputBox({
    placeHolder: 'x岛 订阅uuidid',
    prompt: '可以从手机客户端复制导入，网页端没有，直接确认会随机生成一个uuid',
    value: Global.getCollectId(),
  });

  // 如果用户撤销输入，如ESC，则为undefined
  if (userHash === undefined) {
    return false;
  }
  // 如果输入为空，则随机生成一个uuid
  if (userHash === '') {
    userHash = crypto.randomUUID();
  }

  // 如果输入的不是uuid，则报错
  if (
    !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userHash)
  ) {
    vscode.window.showErrorMessage('输入的不是uuid');
    return false;
  }
  Global.setCollectId(userHash);
  return true;
}
