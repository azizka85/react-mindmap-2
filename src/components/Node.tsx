import classNames from "classnames";
import { createRef, KeyboardEvent, MouseEvent, useEffect, useState } from "react";
import { NodeState } from "./MindMapContext";
import { MindMapContext as ctx } from "./MindMapContext";

interface NodeProps {
  node: NodeState,
  tabIndex: number
};

export function Node({node, tabIndex}: NodeProps) {
  const [state, setState] = useState({
    id: node.id,
    label: node.label,
    active: node.active,
    collapsed: node.collapsed,
    children: node.children,
    childrenCollapsed: false
  });

  const articleRef = createRef<HTMLElement>();

  node.updateCallback = () => {
    setState({
      ...node,
      childrenCollapsed: state.childrenCollapsed
    });
  };

  useEffect(() => {
    updateArticleContent(state.label);
    updateArticleFocus(state.active);
  });

  function updateArticleContent(content: string | null) {
    if(articleRef.current) {
      articleRef.current.textContent = content;
    }    
  }

  function updateArticleFocus(active: boolean | undefined) {
    if(active) {
      articleRef.current?.focus();
    } else {
      articleRef.current?.blur();
    }
  }

  function onNodeInput() {       
    ctx.setNodeLabel(
      node, 
      articleRef.current?.textContent?.replace(/(<([^>]+)>)/gi, "") || ''
    );
  }

  function onNodeClicked(evt: MouseEvent<HTMLElement>) {
    evt.stopPropagation();

    ctx.setNodeActive(node);
  }

  function onNodeKeyPressed(evt: KeyboardEvent<HTMLElement>) {
    if(evt.code === 'Tab') {
      evt.preventDefault();

      ctx.createChildNode(node);
    } else if(evt.code === 'Enter' || evt.code === 'NumpadEnter') {
      evt.preventDefault();

      ctx.createChildNode(ctx.parent(node));
    } else if(evt.ctrlKey) {
      if(evt.code === 'Delete') {
        evt.preventDefault();
        ctx.removeNode(node); 
      } else if(evt.code === 'ArrowLeft' || evt.code === 'Numpad4') {
        ctx.moveToLeftNode(node);
      } else if(evt.code === 'ArrowRight' || evt.code === 'Numpad6') {
        ctx.moveToRightNode(node);
      } else if(evt.code === 'ArrowUp' || evt.code === 'Numpad8') {
        ctx.moveToUpNode(node);
      } else if(evt.code === 'ArrowDown' || evt.code === 'Numpad2') {
        ctx.moveToDownNode(node);
      }
    } else if(evt.shiftKey) {
      if(evt.code === 'KeyD') {
        state.childrenCollapsed = !state.childrenCollapsed;

        evt.preventDefault();
        ctx.setChildNodesCollapsed?.(node, state.childrenCollapsed);
      }
      else if(evt.code === 'KeyE') {
        evt.preventDefault();
        ctx.setNodeCollapsed(node, !state.collapsed);
      }
    }    
  }

  return (
    <li>
      <article
        ref={articleRef}
        className={classNames({
          collapsed: state.collapsed, 
          editable: true, 
          active: state.active
        })}
        tabIndex={tabIndex}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={onNodeInput}
        onClick={onNodeClicked}
        onKeyDown={onNodeKeyPressed}
      />
      { !state.collapsed && state.children.length 
        ? <ul>
            { state.children.map((child, index) => <Node 
                key={child.id}
                node={child}
                tabIndex={index}
              />) }
          </ul> 
        : null }
    </li>
  );
}
