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
}
