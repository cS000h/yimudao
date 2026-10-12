import { AudioClip, AudioSource, resources, sys } from 'cc';
import type { GamePlatform } from '../runtime/GameContext';

/** 离线内容默认完整可玩；填入服务地址后才请求原有的可选在线故事。 */
export function createPlatform(audio:AudioSource,apiBaseUrl:string):GamePlatform {
  const clips=new Map<string,AudioClip>();
  for(const name of ['tap','好','坏','钱','翻','抽','金','凶']) {
    resources.load('audio/'+name,AudioClip,(error,clip)=>{if(!error)clips.set(name,clip);});
  }
  return {
    storage:{getItem:key=>sys.localStorage.getItem(key),setItem:(key,value)=>sys.localStorage.setItem(key,value)},
    playSound:name=>{const clip=clips.get(name)||clips.get('tap');if(clip)audio.playOneShot(clip,.7);},
    request:(path,options={})=>new Promise((resolve,reject)=>{
      if(!apiBaseUrl){reject(new Error('Optional online content is disabled'));return;}
      const xhr=new XMLHttpRequest();xhr.open(options.method||'GET',apiBaseUrl.replace(/\/$/,'')+path);xhr.timeout=9000;
      for(const [key,value] of Object.entries(options.headers||{}))xhr.setRequestHeader(key,String(value));
      xhr.onload=()=>resolve({ok:xhr.status>=200&&xhr.status<300,status:xhr.status,json:async()=>JSON.parse(xhr.responseText)});
      xhr.onerror=()=>reject(new Error('Network request failed'));xhr.ontimeout=()=>reject(new Error('Network timeout'));
      if(options.signal?.aborted){reject(new Error('Request aborted'));return;}
      xhr.send(options.body??null);
    }),
  };
}
