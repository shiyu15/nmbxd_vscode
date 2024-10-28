import * as vscode from 'vscode';
import Global from './global'; 
import {NMBXD} from './nmbxd';

/**
 * @description: 
 * @return {*}
 */
export default async function login(): Promise<LoginResult> {
    let userHash = await vscode.window.showInputBox({
      placeHolder: 'x岛 UserHash',
      prompt: '在此处粘贴从x岛用户系统中扫描二维码得到的coocie\
               如%B8H%1E5B%F6%F1%3B%08%98%C7Z%930X%H0%25a%0E',
      value: Global.getUserHash()
    });


    // 如果用户撤销输入，如ESC，则为undefined
    if (userHash === undefined) {
      return LoginResult.cancel;
    }
    userHash = (userHash || '').trim();
    // 容错处理：如果用户把前面的键也复制进去了，则手动去掉前面的cookie:
    userHash = userHash.replace(/^"|"$/g, '');
  
    // 清除cookie
    if (!userHash) {
      await Global.setUserHash('');
      return LoginResult.logout;
    }
    
    const isLoginSuccess = await vscode.window.withProgress(
      {
        title: '正在登录',
        location: vscode.ProgressLocation.Notification
      },
      async () => {
        const isCookieValid = await NMBXD.checkUserHash(userHash!);
        console.log('userhash是否有效：', isCookieValid);
        if (isCookieValid) {
          await Global.setUserHash(userHash!);
          vscode.window.showInformationMessage('登录成功');
        } else {
          vscode.window.showErrorMessage('登录失败，userhash无效');
        }
        return isCookieValid;
      }
    );
    return isLoginSuccess ? LoginResult.success : LoginResult.failed;
  }
  

  export enum LoginResult {
    /** 登录成功 */
    success,
    /** 登录失败 */
    failed,
    /** 退出登录 */
    logout,
    /** 取消登录 */
    cancel
  }
  