import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ChevronRight, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface IVRMenuItem {
  key: string;
  label: string;
  submenus?: IVRMenuItem[];
}

interface IVRConfigEditorProps {
  menuStructure: IVRMenuItem[];
  onChange: (structure: IVRMenuItem[]) => void;
  disabled?: boolean;
}

export const IVRConfigEditor = ({ menuStructure, onChange, disabled }: IVRConfigEditorProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const addMenuItem = (parentPath?: string) => {
    const newItem: IVRMenuItem = {
      key: "",
      label: "",
      submenus: [],
    };

    if (!parentPath) {
      onChange([...menuStructure, newItem]);
    } else {
      const updateNested = (items: IVRMenuItem[], path: string[]): IVRMenuItem[] => {
        if (path.length === 0) return items;
        
        return items.map((item, idx) => {
          if (idx.toString() === path[0]) {
            if (path.length === 1) {
              return {
                ...item,
                submenus: [...(item.submenus || []), newItem],
              };
            }
            return {
              ...item,
              submenus: updateNested(item.submenus || [], path.slice(1)),
            };
          }
          return item;
        });
      };

      onChange(updateNested(menuStructure, parentPath.split(".")));
    }
  };

  const updateMenuItem = (path: string, field: "key" | "label", value: string) => {
    const updateNested = (items: IVRMenuItem[], pathArr: string[]): IVRMenuItem[] => {
      return items.map((item, idx) => {
        if (idx.toString() === pathArr[0]) {
          if (pathArr.length === 1) {
            return { ...item, [field]: value };
          }
          return {
            ...item,
            submenus: updateNested(item.submenus || [], pathArr.slice(1)),
          };
        }
        return item;
      });
    };

    onChange(updateNested(menuStructure, path.split(".")));
  };

  const removeMenuItem = (path: string) => {
    const removeNested = (items: IVRMenuItem[], pathArr: string[]): IVRMenuItem[] => {
      if (pathArr.length === 1) {
        return items.filter((_, idx) => idx.toString() !== pathArr[0]);
      }
      return items.map((item, idx) => {
        if (idx.toString() === pathArr[0]) {
          return {
            ...item,
            submenus: removeNested(item.submenus || [], pathArr.slice(1)),
          };
        }
        return item;
      });
    };

    onChange(removeNested(menuStructure, path.split(".")));
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedItems(newExpanded);
  };

  const renderMenuItem = (item: IVRMenuItem, path: string, depth: number = 0) => {
    const hasSubmenus = item.submenus && item.submenus.length > 0;
    const isExpanded = expandedItems.has(path);

    return (
      <motion.div
        key={path}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-2"
        style={{ marginLeft: depth * 24 }}
      >
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
          {hasSubmenus && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => toggleExpand(path)}
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              />
            </Button>
          )}
          
          <div className="flex items-center gap-2 flex-1">
            <div className="w-16">
              <Input
                placeholder="Tecla"
                value={item.key}
                onChange={(e) => updateMenuItem(path, "key", e.target.value)}
                disabled={disabled}
                className="text-center font-mono"
                maxLength={1}
              />
            </div>
            <span className="text-muted-foreground">→</span>
            <Input
              placeholder="Descrição da opção"
              value={item.label}
              onChange={(e) => updateMenuItem(path, "label", e.target.value)}
              disabled={disabled}
              className="flex-1"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              onClick={() => {
                addMenuItem(path);
                setExpandedItems(new Set([...expandedItems, path]));
              }}
              disabled={disabled}
              title="Adicionar submenu"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => removeMenuItem(path)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && item.submenus && item.submenus.length > 0 && (
            <div className="space-y-2 border-l-2 border-primary/30 ml-3 pl-2">
              {item.submenus.map((submenu, subIdx) =>
                renderMenuItem(submenu, `${path}.${subIdx}`, depth + 1)
              )}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <Card className="border-purple-500/30 bg-purple-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Phone className="h-5 w-5 text-purple-400" />
          Configuração do Menu IVR
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure as opções que o contato poderá digitar durante a ligação
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence>
          {menuStructure.map((item, idx) => renderMenuItem(item, idx.toString()))}
        </AnimatePresence>

        <Button
          variant="outline"
          size="sm"
          onClick={() => addMenuItem()}
          disabled={disabled}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar opção do menu
        </Button>

        {menuStructure.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Prévia do áudio:</p>
            <p className="text-sm text-muted-foreground italic">
              "
              {menuStructure
                .filter((m) => m.key && m.label)
                .map((m) => `Digite ${m.key} para ${m.label}`)
                .join(". ") || "Configure as opções acima"}
              "
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
