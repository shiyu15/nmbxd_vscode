import http from '../http';
import Global from "../global";
import { NMBXD } from "../nmbxd";
import { Forum, ForumData } from '../models/forum';
import { TopicList } from '../models/topicList';
import * as vscode from "vscode";
import {ForumItem} from "../provider/dataProvider";
import {TopicState} from "../models/topicState";
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
  let topicState=new TopicState(false, 1, false, 1);
  let label=topicList.content.length>10?topicList.content.substring(0,10):topicList.content;
  panel = _createPanel(topicList.id, label);
  panel.webview.onDidReceiveMessage((message) => {
    switch (message.command) {
      // case "setTitle":
      //   panel.title = _getTitle(message.title);
      //   break;
      // case "refresh":
      //   loadTopicInPanel(panel, item.link, message.page);
      //   break;
      // case "pageTurning":
      //   loadTopicInPanel(panel, item.link, message.page);
      //   break;
      // case "collect":
      //   collectPost(panel, topic);
      //   break;
      case "pageTurn":
        topicState.page=message.page;
        loadTopicInPanel(panel, topicList, topicState);
        break;
      case "onlyAuthor":
        topicState.isOnlyAuthor=true;
        topicState.page=1;
        loadTopicInPanel(panel, topicList, topicState);
        break;
      case "cancelOnlyAuthor":
        topicState.isOnlyAuthor=false;
        topicState.page=1;
        loadTopicInPanel(panel, topicList, topicState);
        break;
      default:
        break;
    }
  });
  console.log(topicList.id);
  loadTopicInPanel(panel, topicList, topicState);
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
    topicState: TopicState
  ) {
    panel.webview.html = NMBXD.renderPage("loading.html", {
      contextPath: Global.getWebViewContextPath(panel.webview),
    });
    const pageString=topicState.page.toString();
    // 获取详情数据
    NMBXD.getTopic(topicList.id, topicList.forumName, pageString, topicState.isOnlyAuthor)
      .then((detail) => {
          topicState.allPage=Math.ceil(detail.replyCount/20);
          panel.webview.html = NMBXD.renderPage("topic.html", {
            topicList: detail,
            contextPath: Global.getWebViewContextPath(panel.webview),
            imageUrlBase: NMBXD.getImageUrlBase(),
            topicState: topicState
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
