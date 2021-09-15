import { useState } from "react";
import { MindMapContext as ctx } from "./MindMapContext";
import { Node } from "./Node";
import { ToolBar } from "./ToolBar";

export function MindMap() {
  const [root, setRoot] = useState(ctx.root);

  ctx.loadFromLocalStorage();

  ctx.rootCallback = () => {
    setRoot(ctx.root);
  };

  return (
    <div className="container">
      <ToolBar />
      <ul 
        className="mindmap" 
        onClick={() => ctx.setNodeActive(undefined)}
      >
          {root.children.map((node, index) => <Node 
            key={node.id}
            node={node}
            tabIndex={index}
          />)}
        </ul>
    </div>
  );
}
