import http from './http';
import Global from "./global";
import { Forum, ForumData } from './models/forum';
import { TopicList } from './models/topicList';
import { Eta } from 'eta';
import * as path from 'path';

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
        const response = await http.get(`https://${Global.getApiUrl()}/getForumList`, {
            headers: {
                Cookie: `userhash=${Global.getUserHash()}`
            },
        });
        const forumData: any[] = response.data;
        
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

    static async getTopicList(fid: string, name:string, page:string): Promise<TopicList[]> {
        const response = await http.get(`https://${Global.getApiUrl()}/showf?id=${fid}`,{
            headers: {
                Cookie: `userhash=${Global.getUserHash()}`
            },
        });
        const topicList :TopicList[]=[];
        for(const topic of response.data){
            let newTopic=new TopicList(
                name,
                topic.id,
                topic.fid,
                topic.now,
                topic.user_hash,
                topic.content,
                [] as TopicList[],
                topic.sage,
                topic.hide,
            );
            for(const reply of topic.Replies){
                newTopic.replies.push(new TopicList(
                    name,
                    reply.id,
                    reply.fid,
                    reply.now,
                    reply.user_hash,
                    reply.content,
                    [] as TopicList[],
                    reply.sage,
                    reply.hide,
                ));
            }
            topicList.push(newTopic);
        }   
        return topicList;
    }
}

