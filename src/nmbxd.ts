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
            item.thread_count,
            'max_page' in item ? 1 : 0
        ));
    }



    static renderPage(page: string, data: any = {}): string {
        const eta = new Eta({ views: path.join(Global.context!.extensionPath, "src", "templates") });
        const html = eta.render(page, data);
        return html;
    }


    /**
     * @description: 获取引用帖子
     * @param {string} id
     * @return {*}
     */
    static async getReference(id:string):Promise<TopicList>{
        const response=await http.get(`https://${Global.getApiUrl()}/ref?id=${id}`,{
            headers: {
                Cookie: `userhash=${Global.getUserHash()}`,
            },
        });
        let newTopic=new TopicList(
            "",
            response.data.id,
            response.data.fid,
            response.data.now,
            response.data.user_hash,
            response.data.content,
            [] as TopicList[],
            response.data.sage,
            response.data.hide,
            response.data.ReplyCount,
            response.data.img,
            response.data.ext,
        );
        return newTopic;
    }
    
    
    // 获取版面的帖子列表，注意普通版面和时间线版面调用的api不一样
    static async getTopicList(fid: string, forumName:string, page:string, type:number): Promise<TopicList[]> {
        
        let response;
        // 0为普通板块，1为时间线板块
        if(type===0){
            response=await http.get(`https://${Global.getApiUrl()}/showf?id=${fid}&page=${page}`,{
                headers: {
                    Cookie: `userhash=${Global.getUserHash()}`,
                },
            });
        }else{
            response=await http.get(`https://${Global.getApiUrl()}/timeline?id=${fid}&page=${page}`,{
                headers: {
                    Cookie: `userhash=${Global.getUserHash()}`,
                },
            });
        }
        let topicList :TopicList[]=[];
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
        let reply;
        if(replyPreContent){
            reply = await vscode.window.showInputBox({
                placeHolder: `请输入回复内容,已添加引用${replyPreContent}`,
                prompt: '',
                value: ''
              });
        }else{
            reply = await vscode.window.showInputBox({
                placeHolder: `请输入回复内容,引用串请加上>>No.串号`,
                prompt: '',
                value: ''
              });
        }
        // 添加对 ESC 的处理
        if (reply === undefined) {
            vscode.window.showInformationMessage('已取消回帖');
            return false;
        }
        if(replyPreContent){
            reply=replyPreContent+'\n'+reply;
        }
        const options = ['插入图片（带水印）', '插入图片（不带水印）', '不插入图片'];
        const isInputImage = await vscode.window.showQuickPick(options, {
            placeHolder: '是否插入图片？',
            canPickMany: false,
            ignoreFocusOut: true
        });

        // 添加对图片选择 ESC 的处理
        if (isInputImage === undefined) {
            vscode.window.showInformationMessage('已取消回帖');
            return false;
        }
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
        if((reply===""||reply==="\n"||reply===undefined)&&(fileUri===undefined||fileUri.length===0)){
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
            payload.append('image', fs.createReadStream(fileUri[0].fsPath));
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
        } else{
            const errorMessage = Global.extractErrorMessage(response.data);
            if (errorMessage) {
                vscode.window.showErrorMessage(errorMessage);
            } else {
                vscode.window.showErrorMessage('回复失败');
            }
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
        }  else if (response.data.includes("没有上传文件的时候")){
            vscode.window.showErrorMessage('没有上传文件的时候，必须填写内容');
            return false;
        }
        return  false;
    }

    /**
     * 处理引用内容，将引用其他帖子的内容转移到quote字段。
     * @param detail 帖子详情
     * @returns 处理后的帖子详情
     */
    static handleQuote(detail: TopicList): TopicList {          
        // // 处理主贴内容
        // const quoteRegex = /^<font color=\"#789922\">&gt;&gt;No\.(\d+)<\/font><br \/>\n/;
        // let mainMatch;
        // while ((mainMatch = detail.content.match(quoteRegex)) !== null) {
        //     detail.quote.push(mainMatch[0]);  // 累积保存引用内容
        //     detail.content = detail.content.replace(quoteRegex, '');  // 移除原内容中的引用
        // }
    
        // // 处理回复内容
        // if (detail.replies) {
        //     detail.replies = detail.replies.map(reply => {
        //         let replyMatch;
        //         reply.quote = [];  // 初始化引用内容
        //         while ((replyMatch = reply.content.match(quoteRegex)) !== null) {
        //             reply.quote.push(replyMatch[0]);  // 累积保存引用内容
        //             reply.content = reply.content.replace(quoteRegex, '');  // 移除原内容中的引用
        //         }
        //         return reply;
        //     });
        // }
        return detail;
    }

    /**
     * 在VSCode中打开图片
     * @param imageUrl 图片URL
     */
    static async viewImage(imageUrl: string): Promise<void> {
        return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(imageUrl));
    }

}

