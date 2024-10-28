import http from './http';
import Global from "./global";
import { Forum, ForumData } from './models/forum';
import { TopicList } from './models/topicList';
import { Eta } from 'eta';
import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import FormData from 'form-data';
export class NMBXD {
    /**
     * @description: 用能不能访问某个串的99页之后来判断cookie是否正确
     * @param {string} userHash
     * @return {*} 是否成功登录
     */    
    static async checkUserHash(userHash: string): Promise<boolean> {
        if (!userHash) {
            return false;
        }
        const res = await http.get(`https://${Global.getApiUrl()}/thread?id=53913770`, {
            headers: {
                Cookie: `userhash=${userHash}`
            },
            // responseType: 'arraybuffer'
        });
        return ("fid" in res["data"]);
    }

    static async getForumTree(): Promise<Forum[]> {
        const responseForum = await http.get(`https://${Global.getApiUrl()}/getForumList`, {
            headers: {
                Cookie: `userhash=${Global.getUserHash()}`
            },
        });
        let responseTimeLine = await http.get(`https://${Global.getApiUrl()}/getTimelineList`, {
            headers: {
                Cookie: `userhash=${Global.getUserHash()}`
            },            
        });
        let dataTimeLine:any={};
        dataTimeLine.id=-1;
        dataTimeLine.name="时间线";
        dataTimeLine.forums=responseTimeLine.data;

        let forumData: any[] = [dataTimeLine, ...responseForum.data];
        return this.parseForumData(forumData);
    }

    private static parseForumData(data: any[]): Forum[] {
        return data.map(item => new Forum(
            item.id,
            item.name,
            item.forums ? this.parseForumData(item.forums) : [],
            item.thread_count
        ));
    }



    static renderPage(page: string, data: any = {}): string {
        const eta = new Eta({ views: path.join(Global.context!.extensionPath, "src", "templates") });
        const html = eta.render(page, data);
        return html;
    }

    static async getTopicList(fid: string, forumName:string, page:string): Promise<TopicList[]> {
        const response = await http.get(`https://${Global.getApiUrl()}/showf?id=${fid}&page=${page}`,{
            headers: {
                Cookie: `userhash=${Global.getUserHash()}`,
            },
        });
        const topicList :TopicList[]=[];
        if ('success' in response.data && response.data.success === false){
            console.error(response.data.error);
            vscode.window.showErrorMessage('登录失败, userhash无效');
            throw new Error('登录失败: userhash无效');
        }
        else{
            for(const topic of response.data){
                let newTopic=new TopicList(
                forumName,
                topic.id,
                topic.fid,
                topic.now,
                topic.user_hash,
                topic.content,
                [] as TopicList[],
                topic.sage,
                topic.hide,
                topic.ReplyCount,
                topic.img,
                topic.ext,
            );
            for(const reply of topic.Replies){
                newTopic.replies.push(new TopicList(
                    forumName,
                    reply.id,
                    reply.fid,
                    reply.now,
                    reply.user_hash,
                    reply.content,
                    [] as TopicList[],
                    reply.sage,
                    reply.hide,
                    reply.ReplyCount,
                    reply.img,
                    reply.ext,
                ));
            }
                topicList.push(newTopic);
            }   
        }
        return topicList;
    }

    static getImageUrlBase(): string {
        return `https://image.nmb.best/`;
    }

    static async getTopic(topicId: string, forumName:string, page:string, onlyAuthor:boolean): Promise<TopicList> {

        let response;
        if(onlyAuthor){
            response = await http.get(`https://${Global.getApiUrl()}/po?id=${topicId}&page=${page}`,{
                headers: {
                    Cookie: `userhash=${Global.getUserHash()}`
                },
            });
        }
        else{
            response = await http.get(`https://${Global.getApiUrl()}/thread?id=${topicId}&page=${page}`,{
                headers: {
                    Cookie: `userhash=${Global.getUserHash()}`
                },
            });            
        }
        const topicList :TopicList[]=[];
        let topic=response.data;
        let newTopic=new TopicList(
            forumName,
            topic.id,
            topic.fid,
            topic.now,
            topic.user_hash,
            topic.content,
            [] as TopicList[],
            topic.sage,
            topic.hide,
            topic.ReplyCount,
            topic.img,
            topic.ext,
        );
        for(const reply of topic.Replies){
            newTopic.replies.push(new TopicList(
                forumName,
                reply.id,
                topic.fid,
                reply.now,
                reply.user_hash,
                reply.content,
                [] as TopicList[],
                false,
                false,
                0,
                reply.img,
                reply.ext,
            ));
            topicList.push(newTopic);
        }   
        return newTopic;
    }

    /**
     * @description: 回复帖子
     * @param {string} replyPreContent 回复内容前缀,例如引用某个串
     * @param {string} resto 回复的帖子ID
     * @return {*}
     */
    static async reply(replyPreContent: string, resto:string):Promise<boolean>{
        let reply = await vscode.window.showInputBox({
            placeHolder: `请输入回复内容,已添加引用${replyPreContent}引用串请在前面加上>>No.串号`,
            prompt: '',
            value: ''
          });
        reply=replyPreContent+'\n'+reply;
        const options = ['插入图片（带水印）', '插入图片（不带水印）', '不插入图片'];
        const isInputImage = await vscode.window.showQuickPick(options, {
            placeHolder: '是否插入图片？',
            canPickMany: false,
            ignoreFocusOut: true
        });
        let fileUri;
        if (isInputImage === '插入图片（带水印）' ||isInputImage === '插入图片（不带水印）') {
            const options = {
                canSelectMany: false,    // 不允许多选
                openLabel: '选择文件',   // 对话框按钮的文字
                filters: {
                    '图像文件': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'], // 只显示图像文件
                    '所有文件': ['*'] // 显示所有文件
                }
            };
            fileUri=await vscode.window.showOpenDialog(options);
        }
        if (fileUri && fileUri[0]) {
            console.log('你选择的文件是：' + fileUri[0].fsPath);
        } else {
            console.log('未选择文件');
        }
        if(reply===""&&(fileUri===undefined||fileUri.length===0)){
            vscode.window.showErrorMessage('回复内容不能为空');
            return false;
        }
        const url=`https://www.nmbxd.com/home/forum/doReplyThread.html`;
        const headers= {
            Cookie: `userhash=${Global.getUserHash()}`,
            Host: "www.nmbxd1.com",
        };

        const payload=new FormData();
        payload.append('content', reply);
        payload.append('resto', resto);
        if(fileUri&&fileUri.length>0){
            payload.append('file', fs.createReadStream(fileUri[0].fsPath));
        }
        if(isInputImage==="插入图片（带水印）"){
            payload.append('water', '1');
        }else if(isInputImage==="插入图片（不带水印）"){
            payload.append('water', '0');
        }

        let response = await http.post(url, payload, {
            headers: {
                ...headers,
                ...payload.getHeaders() // 确保包含 FormData 的 headers
            }
        });
        const successIndicator = '回复成功';

        // 检查 HTML 响应中是否包含特定字符
        if (response.data.includes(successIndicator)) {
            vscode.window.showInformationMessage("回复成功");
            return true; // 如果包含，返回 true
        } else if (response.data.includes("未应用饼干，请在用户中心应用饼干")){
            vscode.window.showErrorMessage('未应用饼干，请在用户中心应用饼干');
            return false; 
        }  
        return  false;
    }



    static async postThread(fid:string):Promise<boolean>{
        let reply = await vscode.window.showInputBox({
            placeHolder: `请输入串内容`,
            prompt: '',
            value: ''
          });
        const options = ['插入图片（带水印）', '插入图片（不带水印）', '不插入图片'];
        const isInputImage = await vscode.window.showQuickPick(options, {
            placeHolder: '是否插入图片？',
            canPickMany: false,
            ignoreFocusOut: true
        });
        let fileUri;
        if (isInputImage === '插入图片（带水印）' ||isInputImage === '插入图片（不带水印）') {
            const options = {
                canSelectMany: false,    // 不允许多选
                openLabel: '选择文件',   // 对话框按钮的文字
                filters: {
                    '图像文件': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'], // 只显示图像文件
                    '所有文件': ['*'] // 显示所有文件
                }
            };
            fileUri=await vscode.window.showOpenDialog(options);
        }
        if (fileUri && fileUri[0]) {
            console.log('你选择的文件是：' + fileUri[0].fsPath);
        } else {
            console.log('未选择文件');
        }
        if(reply===""&&(fileUri===undefined||fileUri.length===0)){
            vscode.window.showErrorMessage('发串内容不能为空');
            return false;
        }
        const url=`https://www.nmbxd.com/home/forum/doPostThread.html`;
        const headers= {
            Cookie: `userhash=${Global.getUserHash()}`,
        };

        const payload=new FormData();
        payload.append('content', reply);
        payload.append('fid', fid);
        if(fileUri&&fileUri.length>0){
            payload.append('file', fs.createReadStream(fileUri[0].fsPath));
        }
        if(isInputImage==="插入图片（带水印）"){
            payload.append('water', '1');
        }else if(isInputImage==="插入图片（不带水印）"){
            payload.append('water', '0');
        }

        let response = await http.post(url,{
            headers:headers,
            payload:payload
        });
        const successIndicator = '发串成功';

        // 检查 HTML 响应中是否包含特定字符
        if (response.data.includes(successIndicator)) {
            vscode.window.showInformationMessage("发串成功");
            return true; // 如果包含，返回 true
        } else if (response.data.includes("未应用饼干，请在用户中心应用饼干")){
            vscode.window.showErrorMessage('未应用饼干，请在用户中心应用饼干');
            return false; 
        }  
        return  false;
    }


}

