import { useCallback, useState, useEffect } from "react";

export interface HierarchicalNode {
  id: string;
  children?: HierarchicalNode[];
  [key: string]: any;
}

export interface UseHierarchicalDataOptions {
  transform?: (item: any) => any;
  childrenKey?: string; // default: "children"
  childSourceKey?: string; // default: "childs" (for API response)
}

/**
 * Hook for managing hierarchical/tree data with dynamic children loading
 * Handles recursive transformation and updates to nested nodes
 */
export function useHierarchicalData<T extends HierarchicalNode>(
  initialData: any[] | undefined,
  options?: UseHierarchicalDataOptions,
) {
  const {
    transform = (item: any) => item,
    childrenKey = "children",
    childSourceKey = "childs",
  } = options || {};

  const [data, setData] = useState<T[]>([]);

  // Create a recursive transform function - wrapped to allow recursion
  useEffect(() => {
    if (!initialData || initialData.length === 0) {
      setData([]);
      return;
    }

    const transformItemRecursive = (item: any): T => {
      const transformed = transform(item);
      return {
        ...transformed,
        [childrenKey]: item[childSourceKey]?.map(transformItemRecursive) || [],
      } as T;
    };

    const transformedData = initialData.map(transformItemRecursive);
    setData(transformedData);
  }, [initialData, transform, childrenKey, childSourceKey]);

  // Recursively find and update a node at any depth
  const updateNodeRecursively = useCallback(
    (nodes: T[], targetId: string, newChildren: T[]): T[] => {
      return nodes.map((node) => {
        if (node.id === targetId) {
          return {
            ...node,
            [childrenKey]: newChildren,
          } as T;
        } else if (node[childrenKey] && node[childrenKey].length > 0) {
          return {
            ...node,
            [childrenKey]: updateNodeRecursively(
              node[childrenKey],
              targetId,
              newChildren,
            ),
          } as T;
        }
        return node;
      });
    },
    [childrenKey],
  );

  // Handle expanding a node to fetch and update its children
  const handleExpandNode = useCallback(
    (nodeId: string, newChildren: T[]) => {
      setData((prevData) =>
        updateNodeRecursively(prevData, nodeId, newChildren),
      );
    },
    [updateNodeRecursively],
  );

  return {
    data,
    setData,
    updateNodeRecursively,
    handleExpandNode,
  };
}
