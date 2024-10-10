import http from './http';
import Global from "./global";
import { Forum, ForumData } from './models/forum';
import { TopicList } from './models/topicList';
import { Eta } from 'eta';
import * as path from 'path';
import * as vscode from 'vscode';
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
            item.forums ? this.parseForumData(item.forums) : []
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
                Cookie: `userhash=${Global.getUserHash()}`
            },
        });
        const topicList :TopicList[]=[];
        if ('success' in response.data && response.data.success === false){
            console.error(response.data.error);
            vscode.window.showErrorMessage('登录失败, userhash无效');
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
}

