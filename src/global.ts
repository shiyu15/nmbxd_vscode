import { ExtensionContext, Webview, Uri } from "vscode";
export default class Global {
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
}