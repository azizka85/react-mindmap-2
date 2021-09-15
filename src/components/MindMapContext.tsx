export interface RootState {
  id?: number;
  children: NodeState[];
};

export interface NodeState extends RootState {  
  id: number;
  label: string;
  active: boolean;
  collapsed: boolean;
  updateCallback?: () => void;
};

const parents = new Map<number, NodeState>();

const root: RootState = {
  children: [
    getInitialNode()
  ]
};

let activeNode: NodeState | undefined = undefined;

const ctx = {
  canSave: false,
  rootCallback: () => {},
  toolbarUpdateCallback: () => {},

  get root(): RootState {
    return root;
  },

  get activeNode(): NodeState | undefined {
    return activeNode;
  },

  setNodeLabel(node: NodeState, label: string) {
    node.label = label;
    node.updateCallback?.();

    ctx.canSave = true;
    ctx.toolbarUpdateCallback?.();
  },

  setNodeActive(node: NodeState | undefined) {
    ctx.updateActiveNode(node);

    node?.updateCallback?.();
    ctx.toolbarUpdateCallback?.();        
  },

  setNodeCollapsed(node: NodeState, collapsed: boolean) {
    node.collapsed = collapsed;

    node.updateCallback?.();
    ctx.toolbarUpdateCallback?.();
  },

  parent(node: NodeState) {
    return parents.get(node.id);
  },

  canMoveToLeftNode(node: NodeState): boolean {
    return parents.get(node.id) !== undefined;
  },

  canMoveToRightNode(node: NodeState): boolean {
    return !node.collapsed && node.children.length > 0;
  },

  canMoveToUpNode(node: NodeState): boolean {
    const index = parents.get(node.id)?.children?.indexOf(node);

    return index !== undefined && index > 0;
  },

  canMoveToDownNode(node: NodeState): boolean {
    const index = parents.get(node.id)?.children?.indexOf(node);
    const length = parents.get(node.id)?.children?.length || 0;      

    return index !== undefined && index >= 0 && index < length - 1;
  },

  get canActivateLeftNode(): boolean {
    return activeNode !== undefined && ctx.canMoveToLeftNode(activeNode);
  },

  get canActivateRightNode(): boolean {
    return activeNode !== undefined && ctx.canMoveToRightNode(activeNode);
  },

  get canActivateUpNode(): boolean {
    return activeNode !== undefined && ctx.canMoveToUpNode(activeNode);
  },

  get canActivateDownNode(): boolean {
    return activeNode !== undefined && ctx.canMoveToDownNode(activeNode);
  },

  middleChildNode(node: NodeState): NodeState | undefined {
    if(node.children.length > 0) {
      const index = Math.floor((node.children.length - 1) / 2);  

      return node.children[index];
    }

    return undefined;
  },

  upNode(node: NodeState): NodeState | undefined {
    const index = parents.get(node.id)?.children?.indexOf(node); 

    if(index !== undefined && index > 0) {
      return parents.get(node.id)?.children[index-1];
    }

    return undefined;
  },

  downNode(node: NodeState): NodeState | undefined {
    const index = parents.get(node.id)?.children?.indexOf(node);
    const length = parents.get(node.id)?.children?.length || 0;   

    if(index !== undefined && index >= 0 && index < length - 1) {
      return parents.get(node.id)?.children[index + 1];
    }

    return undefined;
  },

  updateActiveNode(node: NodeState | undefined): void {
    if(!node || !activeNode || node.id !== activeNode.id) {      
      if(activeNode) {
        activeNode.active = false;
        activeNode.updateCallback?.();
      }

      if(node) {
        node.active = true;
      }

      activeNode = node;
    }
  },

  createChildNode(parent: NodeState | undefined): void {
    const newNode: NodeState = {
      id: Date.now(),
      label: '',
      active: false,
      collapsed: false,
      children: []          
    };

    addNode(parent, newNode);    
    ctx.updateActiveNode(newNode);

    if(parent) {
      parent.collapsed = false;
      parent.updateCallback?.();
    } else {
      ctx.rootCallback?.();
    }    

    ctx.canSave = true;
    ctx.toolbarUpdateCallback?.();
  },

  removeNode(node: NodeState): void {
    const parent = ctx.parent(node);
    const parentNode = parent || ctx.root;
    const index = parentNode.children.indexOf(node);
    const length = parentNode.children.length;  

    if(!parent && length < 2) return;        
  
    deleteNode(parentNode, node);    
  
    let focusIndex = parentNode.children.length - 1;
  
    if(parentNode.children.length > index) {
      focusIndex = index;
    }

    if(focusIndex >= 0) {
      const focusNode = parentNode.children[focusIndex];  

      ctx.updateActiveNode(focusNode);        
      focusNode.updateCallback?.();
    } else if(parent) {            
      ctx.updateActiveNode(parent);
    }

    if(parent) {
      parent.updateCallback?.();
    } else {
      ctx.rootCallback?.();
    }   

    ctx.canSave = true;
    ctx.toolbarUpdateCallback?.();
  },

  setChildNodesCollapsed(node: NodeState, collapsed: boolean): void {
    node.collapsed = false;
    node.updateCallback?.();

    node.children.forEach(child => {
      if(!collapsed || child.children.length > 0) {
        child.collapsed = collapsed;     
        child.updateCallback?.();
      }
    });

    ctx.toolbarUpdateCallback?.();
  },

  moveToLeftNode(node: NodeState): void {
    if(ctx.canMoveToLeftNode(node)) {
      const target = ctx.parent(node);
      ctx.updateActiveNode(target);
      ctx.toolbarUpdateCallback?.();
      target?.updateCallback?.();      
    }
  },

  moveToRightNode(node: NodeState): void {
    if(ctx.canMoveToRightNode(node)) {
      const childNode = ctx.middleChildNode(node);

      if(childNode) {
        ctx.updateActiveNode(childNode);
        ctx.toolbarUpdateCallback?.();
        childNode.updateCallback?.();        
      }
    }
  },

  moveToUpNode(node: NodeState): void {
    if(ctx.canMoveToUpNode(node)) {
      const upNode = ctx.upNode(node);

      if(upNode) {
        ctx.updateActiveNode(upNode);
        ctx.toolbarUpdateCallback?.();
        upNode.updateCallback?.();
      }
    }
  },

  moveToDownNode(node: NodeState): void {
    if(ctx.canMoveToDownNode(node)) {
      const downNode = ctx.downNode(node);

      if(downNode) {
        ctx.updateActiveNode(downNode);
        ctx.toolbarUpdateCallback?.();
        downNode.updateCallback?.();
      }
    }  
  },

  activateLeftNode(): void {
    if(activeNode && ctx.canActivateLeftNode) {
      ctx.moveToLeftNode(activeNode);
    }
  },

  activateRightNode(): void {
    if(activeNode && ctx.canActivateRightNode) {
      ctx.moveToRightNode(activeNode);
    }
  },

  activateUpNode(): void {
    if(activeNode && ctx.canActivateUpNode) {
      ctx.moveToUpNode(activeNode);
    }
  },

  activateDownNode(): void {
    if(activeNode && ctx.canActivateDownNode) {
      ctx.moveToDownNode(activeNode);
    }
  },

  saveToLocalStorage(): void {
    localStorage.setItem('mindmap', JSON.stringify(root.children));
  
    ctx.canSave = false;
    ctx.toolbarUpdateCallback?.();
  },

  loadFromLocalStorage(): void {
    let data = null;

    try {
      data = JSON.parse(localStorage.getItem('mindmap') || '');
    } catch(error) {
      console.error(error);
    }

    if(data && typeof data === 'object') {
      loadState(data);
    } else {
      setInitialState();
    }
  }
};

function getInitialNode(): NodeState {
  return {
    id: Date.now(),
    label: 'Press Space or double click to edit',
    active: false,
    collapsed: false,
    children: []      
  };
}

function addNode(parent: NodeState | undefined, newNode: NodeState) {    
  if(parent) {
    parent.children.push(newNode);
    addParent(parent, newNode);      
  } else {
    root.children.push(newNode);
  }  
}

function addParent(parent: NodeState | undefined, node: NodeState) {
  if(parent) {
    parents.set(node.id, parent);
  }
}

function deleteNode(parent: NodeState | RootState, node: NodeState) {
  const index = parent.children.findIndex(elem => elem.id === node.id);    
  parent.children.splice(index, 1);  
  parents.delete(node.id);
}

function setInitialState() {
  const initialNode = getInitialNode();

  ctx.canSave = false;
  activeNode = undefined;
  root.children = [ initialNode ];  

  parents.clear();
}

function loadState(children: NodeState[]) {
  parents.clear();

  activeNode = undefined;

  initChildren(children, undefined);  

  ctx.canSave = false;  
  root.children = children;     
}  

function initChildren(children: NodeState[], parent: NodeState | undefined) {
  children.forEach(child => {   
    if(child.active) {
      activeNode = child;
    }
    
    if(parent) {
      parents.set(child.id, parent); 
    }

    if(child.children.length > 0) {
      initChildren(child.children, child);
    }      
  });
}

export const MindMapContext = ctx;
