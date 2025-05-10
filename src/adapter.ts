import type { Root, RootContentMap } from 'hast';

export type HastUnionType<
  K extends keyof RootContentMap,
  V extends RootContentMap[K],
> = V;

export type HtmlAST =
  | HastUnionType<keyof RootContentMap, RootContentMap[keyof RootContentMap]>
  | Root;

type Keyof<T> = T extends unknown ? keyof T : never;

type WalkerFn<ONode extends object> = (
  o: NodeProps<ONode>,
  context: Map<string, string>,
) => Promise<void> | void;

export type NodeProps<Node extends object> = {
  node: Node;
  next?: Node | null;
  parent: NodeProps<Node> | null;
  prop: Keyof<Node> | null;
  index: number | null;
};

// Ported from https://github.com/Rich-Harris/estree-walker MIT License
export class ASTWalker<ONode extends object> {
  private _context: Map<string, string> = new Map();

  private _enter: WalkerFn<ONode> | undefined;

  private _isONode!: (node: unknown) => node is ONode;

  private _leave: WalkerFn<ONode> | undefined;

  private readonly _visit = async (o: NodeProps<ONode>) => {
    if (!o.node) return this._context;

    if (this._enter) {
      await this._enter(o, this._context);
    }

    for (const key in o.node) {
      const value = o.node[key];

      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (
            let i = 0;
            i < value.length;
            i += 1
          ) {
            const item = value[i];
            if (
              item !== null &&
              typeof item === 'object' &&
              this._isONode(item)
            ) {
              const nextItem = value[i + 1] ?? null;
              await this._visit({
                node: item,
                next: nextItem,
                parent: o,
                prop: key as unknown as Keyof<ONode>,
                index: i,
              });
            }
          }
        } else if (
          this._isONode(value)
        ) {
          await this._visit({
            node: value,
            next: null,
            parent: o,
            prop: key as unknown as Keyof<ONode>,
            index: null,
          });
        }
      }
    }

    if (this._leave) {
      await this._leave(o, this._context);
    }

    return this._context;
  };

  setEnter = (fn: WalkerFn<ONode>) => {
    this._enter = fn;
  };

  setLeave = (fn: WalkerFn<ONode>) => {
    this._leave = fn;
  };

  setONodeTypeGuard = (fn: (node: unknown) => node is ONode) => {
    this._isONode = fn;
  };

  walk = async (oNode: ONode) => {
    return await this._visit({ node: oNode, parent: null, prop: null, index: null });
  };
}