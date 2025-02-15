import http from '../http';
import Global from "../global";
import { NMBXD } from "../nmbxd";
import { Forum, ForumData } from '../models/forum';
import { TopicList } from '../models/topicList';
import * as vscode from "vscode";
import {ForumItem} from "../provider/dataProvider";
import {TopicState} from "../models/topicList";
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
export async function createTopicItem(topicList: TopicList){
  // 如果panel已经存在，则直接激活
  let panel = panels[topicList.id];
  if (panel) {
    panel.reveal();
    return;
  }
  let topicState=new TopicState(false, 1, false, 1);
  let label=topicList.content.length>10?topicList.content.substring(0,10):topicList.content;
  panel = _createPanel(topicList.id, label);
  panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.command) {
      case "refresh":
        loadTopicInPanel(panel, topicList, topicState);
        break;
      // case "collect":
      //   collectPost(panel, topic);
      //   break;
      case "inputChangePage":
        let page:number=await changePage();
        if(page>0&&page<=topicState.allPage){
          topicState.page=page;
          loadTopicInPanel(panel, topicList, topicState);
        }else if(page===Global.INPUT_CANCEL){
          break;
        }else {
          vscode.window.showErrorMessage("页码范围不正确");
        }
        break;
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
      case "reply":
        const replyInput:string=message.input;
        NMBXD.reply(replyInput, topicList.id);
        loadTopicInPanel(panel, topicList, topicState);
        break;
      case 'requestTooltip':
        console.log(message);
        handleTooltipRequest(panel, message);
        break;
      case 'debug':
        console.log(message); // 输出到 VSCode 的调试控制台
        break;
      default:
        break;
    }
  });
  console.log(topicList.id);
  loadTopicInPanel(panel, topicList, topicState);
}

/**
 * 用vscode api输入跳转页码
 * @returns 跳转的页码
 */
async function changePage(): Promise<number> {
  let page:string | undefined = await vscode.window.showInputBox({
      placeHolder: '跳转页码',
      prompt: '请输入要跳转的页码',
      value: '1'
    });

  if (page === undefined) {
    vscode.window.showInformationMessage('操作已取消');
    return Global.INPUT_CANCEL; // 返回一个特殊值以指示取消
  }
  return parseInt(page || '1');
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
          topicState.allPage=Math.ceil((detail.replyCount)/19);
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

async function handleTooltipRequest(panel: vscode.WebviewPanel, message: any) {
    try {
        let tooltipContent = '';
        
        switch (message.type) {
            case 'topic':
                const topicDetail = await NMBXD.getReference(message.id);
                tooltipContent = `
                    <div class="tooltip-content">
                        <div class="tooltip-header">
                            <span class="tooltip-hash">${topicDetail.userHash}</span>
                            <span class="tooltip-id">No.${topicDetail.id}</span>
                            <span class="tooltip-time">${topicDetail.now}</span>
                        </div>
                        ${topicDetail.img ? 
                            `<div class="tooltip-img">
                                <img src="${NMBXD.getImageUrlBase()}thumb/${topicDetail.img}${topicDetail.ext}" />
                            </div>` : ''
                        }
                        <div class="tooltip-content-text">${topicDetail.content}</div>
                    </div>
                `;
                break;
        }
        console.log(tooltipContent);
        panel.webview.postMessage({
            command: 'showTooltip',
            content: tooltipContent,
            x: message.x,
            y: message.y
        });
    } catch (error) {
        console.error('获取提示信息失败:', error);
    }
}



