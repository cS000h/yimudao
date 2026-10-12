import { _decorator, AudioSource, Camera, Canvas, Color, Component, Game, game, isValid, Layers, Node, profiler, ResolutionPolicy, screen, sys, UITransform, view } from 'cc';
import { createPlatform } from './platform/CocosPlatform';
import { GameRuntime } from './runtime/GameRuntime';
import { NativeRenderer } from './ui/NativeRenderer';
import { Theme } from './ui/Theme';
const {ccclass,property}=_decorator;

/** 场景只挂这一个入口；运行时创建页面、声音和平台适配。 */
@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  @property({tooltip:'可选故事服务的 HTTPS 地址；留空时使用完整离线内容'})
  apiBaseUrl='';
  private runtime:GameRuntime;
  private renderer:NativeRenderer;
  private canvasNode:Node;
  private uiCamera:Camera;
  private layingOut=false;
  private resize=()=>{if(sys.isBrowser&&!this.layingOut&&this.runtime&&isValid(this.canvasNode,true))this.reflow();};
  private pause=()=>this.runtime?.setHidden(true);
  private resume=()=>this.runtime?.setHidden(false);

  start():void {
    this.configureResolution();
    Theme.fontFamily=sys.isBrowser?'system-ui,sans-serif':sys.os===sys.OS.WINDOWS?'Microsoft YaHei':sys.os===sys.OS.ANDROID?'sans-serif':'PingFang SC';
    const size=view.getVisibleSize();
    const canvasNode=this.canvasNode=new Node('Canvas');canvasNode.layer=Layers.Enum.UI_2D;this.node.addChild(canvasNode);
    canvasNode.addComponent(UITransform).setContentSize(size.width,size.height);
    const canvas=canvasNode.addComponent(Canvas);
    const cameraNode=new Node('UICamera');this.node.addChild(cameraNode);cameraNode.setPosition(0,0,1000);
    const camera=this.uiCamera=cameraNode.addComponent(Camera);camera.projection=Camera.ProjectionType.ORTHO;camera.orthoHeight=size.height/2;
    camera.clearFlags=Camera.ClearFlag.SOLID_COLOR;camera.clearColor=Color.fromHEX(new Color(),Theme.paper);
    camera.visibility=Layers.Enum.UI_2D;camera.near=.1;camera.far=2000;canvas.cameraComponent=camera;
    this.runtime=new GameRuntime(createPlatform(this.node.addComponent(AudioSource),this.apiBaseUrl));
    this.reflow();
    screen.on('window-resize',this.resize);
    profiler.hideStats();
    game.on(Game.EVENT_HIDE,this.pause);game.on(Game.EVENT_SHOW,this.resume);
  }

  private configureResolution():void {
    if(sys.isBrowser){
      const frame=screen.windowSize,dpr=screen.devicePixelRatio||1;
      // 保持网页的 CSS 字号；宽窗口用 520 上限，短窗口不缩小整幅游戏。
      view.setDesignResolutionSize(frame.width/dpr,frame.height/dpr,ResolutionPolicy.EXACT_FIT);
    }else view.setDesignResolutionSize(Theme.width,Theme.height,ResolutionPolicy.SHOW_ALL);
  }

  private reflow():void {
    if(!isValid(this.canvasNode,true)||!isValid(this.uiCamera,true))return;
    const frame=screen.windowSize;if(frame.width<1||frame.height<1)return;
    this.layingOut=true;
    try{
      const offset=this.renderer?.scrollTop||0;
      this.configureResolution();const size=view.getVisibleSize();
      this.canvasNode.getComponent(UITransform).setContentSize(size.width,size.height);this.uiCamera.orthoHeight=size.height/2;
      if(this.renderer){this.renderer.dispose();this.runtime.document.scrollTo(0,offset);}
      this.renderer=new NativeRenderer(this.canvasNode,this.runtime,sys.isBrowser?Math.min(520,size.width):size.width,size.height);
      this.renderer.sync();
    }finally{this.layingOut=false;}
  }

  update(deltaTime:number):void {
    if(!this.runtime)return;
    try{this.runtime.tick(Math.min(deltaTime,.25));this.renderer.sync();}
    catch(error){this.renderer.showError(error);this.runtime.setHidden(true);}
  }

  onDestroy():void {
    screen.off('window-resize',this.resize);
    game.off(Game.EVENT_HIDE,this.pause);game.off(Game.EVENT_SHOW,this.resume);
    this.runtime?.dispose();this.renderer?.dispose();
  }
}
