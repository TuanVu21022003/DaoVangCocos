import { _decorator, Component, instantiate, Node, Prefab, resources } from 'cc';
import { UICanvas } from './UICanvas';
import { UIGamePLay } from './UIGamePLay';
import { UIHome } from './UIHome';
import { UISetting } from './UISetting';
import { UIVictory } from './UIVictory';
import { UIFail } from './UIFail';
import { UIEnd } from './UIEnd';
import { GameManager } from '../GameManager';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    public static Instance: UIManager = null

    private canvasActives: Map<Function, Node> = new Map();
    private canvasPrefabs: Map<Function, Prefab> = new Map();

    start() {
        UIManager.Instance = this;
        this.loadUI();
    }

    loadUI() {
        const loadPromise = new Promise<void>((resolve, reject) => {
            resources.loadDir('UI/', Prefab, (err, prefabs) => {
                if (err) {
                    console.error('Failed to load UI prefabs', err);
                    reject(err);
                } else {
                    prefabs.forEach(prefab => {
                        const comp = prefab.data.getComponent(UICanvas);
                        if (comp) {
                            this.canvasPrefabs.set(comp.constructor, prefab);
                        }
                    });
                    resolve();
                }
            });
        });
    
        loadPromise.then(() => {
            GameManager.Instance.hideLoadingToast();
            this.openUI(UIHome);
            GameManager.Instance.player.node.active = true;
        }).catch(error => {
            console.error('Failed to load UI prefabs', error);
        });
    }

    openUI<T extends UICanvas>(UIClass: new () => T): T {
        const canvas = this.getUI(UIClass);
        canvas.open();

        return canvas as T;
    }

    closeUI<T extends UICanvas>(UIClass: new () => T, time: number) {
        if (this.isOpenedUI(UIClass)) {
            const canvas = this.canvasActives.get(UIClass);
            if (canvas) {
                canvas.getComponent(UICanvas).close(time);
            }
        }
    }

    closeDirectlyUI<T extends UICanvas>(UIClass: new () => T) {
        if (this.isOpenedUI(UIClass)) {
            const canvas = this.canvasActives.get(UIClass);
            if (canvas) {
                canvas.getComponent(UICanvas).closeDirectionly();
            }
        }
    }

    getUI<T extends UICanvas>(UIClass: new () => T): T {
        if (!this.isLoadedUI(UIClass)) {
            const prefab = this.getUIPrefab(UIClass);
            if (prefab) {
                const canvasNode = instantiate(prefab);
                if (canvasNode) { // Kiểm tra xem canvasNode đã được tạo ra thành công chưa
                    canvasNode.parent = this.node;
                    const uiComponent = canvasNode.getComponent(UICanvas);
                    if (uiComponent) { // Kiểm tra xem có thành phần UICanvas hay không
                        this.canvasActives.set(UIClass, canvasNode);
                        return uiComponent as T;
                    } else {
                        console.error('Failed to get UI component for', UIClass.name);
                        return null;
                    }
                } else {
                    console.error('Failed to instantiate UI for', UIClass.name);
                    return null;
                }
            }
        }
        return this.canvasActives.get(UIClass).getComponent(UICanvas) as T;
    }

    isLoadedUI<T extends UICanvas>(UIClass: new () => T): boolean {
        return this.canvasActives.has(UIClass) && this.canvasActives.get(UIClass) !== null;
    }

    isOpenedUI<T extends UICanvas>(UIClass: new () => T): boolean {
        return this.isLoadedUI(UIClass) && this.canvasActives.get(UIClass).active;
    }

    getUIPrefab<T extends UICanvas>(UIClass: new () => T): Prefab {
        return this.canvasPrefabs.get(UIClass);
    }

    closeAllUI() {
        this.canvasActives.forEach((canvasNode) => {
            if (canvasNode && canvasNode.active) {
                canvasNode.getComponent(UICanvas).close(0);
            }
        });
    }
}


