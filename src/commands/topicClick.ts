import http from '../http';
import Global from "../global";
import { NMBXD } from "../nmbxd";
import { Forum, ForumData } from '../models/forum';
import { TopicList } from '../models/topicList';
import * as vscode from "vscode";
import {ForumItem} from "../provider/dataProvider";

const panels: { [key: string]: vscode.WebviewPanel } = {};


/**
 * 创建webview面板
 * @param id 面板id
 * @param label 面板标题
 */
function _createPanel(id: string, label: string): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
      id,
      label,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
      }
    );
    panels[id] = panel;
  
    panel.onDidDispose(() => {
      delete panels[id];
    });
    return panel;
  }


/**
 * 点击子节点打开详情页面
 * @param item 话题的子节点
 */
export function createTopicItem(topicList: TopicList){
  // 如果panel已经存在，则直接激活
  let panel = panels[topicList.id];
  if (panel) {
    panel.reveal();
    return;
  }
  let label=topicList.content.length>10?topicList.content.substring(0,10):topicList.content;
  panel = _createPanel(topicList.id, label);
  console.log(topicList.id);
  loadTopicInPanel(panel, topicList, 1);
}

/**
 * 在Panel中加载话题列表
 * @param panel panel
 * @param topicLink 话题链接
 * @param page 页码
 */
function loadTopicInPanel(
    panel: vscode.WebviewPanel,
    topicList: TopicList,
    page: number
  ) {
    panel.webview.html = NMBXD.renderPage("loading.html", {
      contextPath: Global.getWebViewContextPath(panel.webview),
    });
    const pageString=page.toString();
    // 获取详情数据
    NMBXD.getTopic(topicList.id, topicList.forumName, pageString)
      .then((detail) => {
          panel.webview.html = NMBXD.renderPage("topic.html", {
            topicList: detail,
            contextPath: Global.getWebViewContextPath(panel.webview),
            imageUrlBase: NMBXD.getImageUrlBase(),
          });
        }
        // } else {
        //   panel.webview.html = NGA.renderPage("topic.html", {
        //     topic: detail,
        //     contextPath: Global.getWebViewContextPath(panel.webview),
        //   });
        // }
        )
      .catch((err: Error) => {
        console.error(err);
        // if (err instanceof LoginRequiredError) {
        //   panel.webview.html = NGA.renderPage("error.html", {
        //     contextPath: Global.getWebViewContextPath(panel.webview),
        //     message: err.message,
        //     showLogin: true,
        //     showRefresh: true,
        //   });
        // } else if (err instanceof AccountRestrictedError) {
        //   panel.webview.html = NGA.renderPage("error.html", {
        //     contextPath: Global.getWebViewContextPath(panel.webview),
        //     message: err.message,
        //     showRefresh: false,
        //   });
        // } else {
          panel.webview.html = NMBXD.renderPage("error.html", {
            contextPath: Global.getWebViewContextPath(panel.webview),
            message: err.message,
            showRefresh: true,
          });
      });
  }
