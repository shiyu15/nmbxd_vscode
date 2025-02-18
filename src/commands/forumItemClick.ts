import http from '../http';
import Global from "../global";
import { NMBXD } from "../nmbxd";
import { Forum, ForumData, ForumState } from '../models/forum';
import { TopicList } from '../models/topicList';
import * as vscode from "vscode";
import {ForumItem} from "../provider/dataProvider";
import {createTopicItem} from "./topicClick";

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
export async function createForumItem(item: ForumItem){
  // 如果panel已经存在，则直接激活
  let panel = panels[item.forumId];
  if (panel) {
    panel.reveal();
    return;
  }
  let forumState=new ForumState(Math.ceil(item.threadNumber/20), 1);
  panel = _createPanel(item.forumId, item.label as string);
  panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.command) {

      case "inputChangePage":
        let page:number=await changePage(); 
        if(page>0&&page<=forumState.allPage&&Number.isInteger(page)){
          forumState.page=page;
          loadTopicListInPanel(panel, item, forumState);
        }else if(page===Global.INPUT_CANCEL){
          break;
        }else {
          vscode.window.showErrorMessage("页码范围不正确");
        }
        break;
      case "pageTurn":
        forumState.page=message.page;
        loadTopicListInPanel(panel, item, forumState);
        break;
      case "topicOpen":
        createTopicItem(message.topic);
        break;
      case "refresh":
        loadTopicListInPanel(panel, item, forumState);
        break;
      case "post":
        NMBXD.postThread(item.forumId);
        break;
      case 'requestTooltip':
        console.log(message);
        handleTooltipRequest(panel, message);
        break;
      case 'topicIdJump':
        console.log(message);
        let topicId=await getTopicId();
        if(topicId!==""){
          let topic=await NMBXD.getTopic(topicId, "", "1", false);
          createTopicItem(topic);
        }
        break;
      case 'collect':
        NMBXD.addCollect(message.input);
        break;
      case 'uncollect':
        NMBXD.deleteCollect(message.input);
        break;
      case 'debug':
        console.log(message); // 输出到 VSCode 的调试控制台
        break;
      default:
        break;
    }
  });

  console.log(item.forumId);
  loadTopicListInPanel(panel, item, forumState);
}

async function getTopicId(): Promise<string> {
  let topicId = await vscode.window.showInputBox({
      placeHolder: `请输入串号`,
      prompt: '',
      value: ''
    });
  const topicIdRegex = /(\d+)$/;
  if (topicId === undefined || topicId === "") {
      vscode.window.showErrorMessage('串号不能为空');
      return '';  
  }
  if (!topicIdRegex.test(topicId)) {
      vscode.window.showErrorMessage('串号格式不正确，应为12345678');
      return '';
  }
  return topicId;
}


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
function loadTopicListInPanel(
    panel: vscode.WebviewPanel,
    item: ForumItem,
    forumState: ForumState
  ) {
    panel.webview.html = NMBXD.renderPage("loading.html", {
      contextPath: Global.getWebViewContextPath(panel.webview),
    });
    const pageString=forumState.page.toString();
    if(!item.isCollect){//访问普通分论坛
      NMBXD.getTopicList(item.forumId,pageString, item.isTimeLine)
        .then((detail) => {
            panel.webview.html = NMBXD.renderPage("topicList.html", {
              title:item.label,
              topicList: detail,
              contextPath: Global.getWebViewContextPath(panel.webview),
              imageUrlBase: NMBXD.getImageUrlBase(),
              forumState:forumState,
            });
          }
          )
        .catch((err: Error) => {
          console.error(err);
            panel.webview.html = NMBXD.renderPage("error.html", {
              contextPath: Global.getWebViewContextPath(panel.webview),
              message: err.message,
              showRefresh: true,
            });
        });
    }else{//访问收藏列表
      NMBXD.getCollectList(pageString)
      .then((detail) => {
          panel.webview.html = NMBXD.renderPage("topicList.html", {
            title:item.label,
            topicList: detail,
            contextPath: Global.getWebViewContextPath(panel.webview),
            imageUrlBase: NMBXD.getImageUrlBase(),
            forumState:forumState,
          });
        }
        )
      .catch((err: Error) => {
        console.error(err);
          panel.webview.html = NMBXD.renderPage("error.html", {
            contextPath: Global.getWebViewContextPath(panel.webview),
            message: err.message,
            showRefresh: true,
          });
      });
    }
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
