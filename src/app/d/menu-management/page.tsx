"use client";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import React, { useMemo, useState } from "react";
import { column } from "./menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MenuForm } from "./menu-form";
import {
  useGetResourceQuery,
  useGetResourceByIdQuery,
} from "@/store/services/flexible-querry";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  Plus,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Layers,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table as TableUI,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

const getImages = (imageUrl: unknown): string[] => {
  if (!imageUrl) return [];
  if (Array.isArray(imageUrl)) {
    return imageUrl.length > 0 ? imageUrl : [];
  }
  if (typeof imageUrl === "string") {
    if (imageUrl.startsWith("[")) {
      try {
        const parsed = JSON.parse(imageUrl);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [imageUrl];
  }
  return [];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

interface MenuItemData {
  id: string;
  name: string;
  price: number;
  category: string;
  category_id?: string;
  available: boolean;
  stock: number;
  image_url?: unknown;
  is_available?: boolean;
}

const MenuCard = ({
  item,
  onClick,
}: {
  item: MenuItemData;
  onClick: () => void;
}) => {
  const images = getImages(item.image_url);
  const hasImage = images.length > 0;
  const firstImage = hasImage ? images[0] : "";

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden border border-border/80 bg-card/70 backdrop-blur-md flex flex-col h-full relative"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/40 border-b border-border/50">
        {hasImage ? (
          <img
            src={firstImage}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-primary/10 via-secondary/10 to-accent/10 flex flex-col items-center justify-center text-muted-foreground/50 p-4">
            <ChefHat className="w-12 h-12 mb-2 stroke-[1.5] text-primary/40 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-xs font-medium tracking-wide">
              No image uploaded
            </span>
          </div>
        )}

        {/* Category Badge */}
        {item.category && (
          <div className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] px-2 py-0.5 rounded font-mono font-medium shadow-sm">
            {item.category}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded font-semibold border shadow-sm backdrop-blur-md",
              item.available
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20",
            )}
          >
            {item.available ? "Available" : "Unavailable"}
          </span>
        </div>

        {/* Multi-photo indicator badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-mono font-medium border border-white/5">
            +{images.length - 1} photos
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1">
          <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
            {item.name}
          </h4>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            {item.stock > 0 ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Stock: {item.stock}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                Out of stock
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1">
          <span className="text-base font-extrabold text-foreground tracking-tight">
            {formatCurrency(item.price)}
          </span>
          <div className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-0.5">
            Edit Details
          </div>
        </div>
      </div>
    </Card>
  );
};

const Page = () => {
  // Get active tenant subscription tier
  const userStr =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const tenantId = user?.tenant_id;

  const columns = column();
  const [dialog, setDialog] = useState({
    open: false,
    id: "",
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [groupByCategory, setGroupByCategory] = useState<boolean>(true);
  const [view, setView] = useState<"table" | "list">("list");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});

  const { data, refetch } = useGetResourceQuery(
    {
      resource: "menu_item",
      params: {
        select: "*, category(name)",
        tenant_id: tenantId,
      },
    },
    { skip: !tenantId },
  );

  const { data: categoryData } = useGetResourceQuery(
    {
      resource: "category",
      params: {
        tenant_id: tenantId,
        order: "asc",
        sort: "name",
      },
    },
    { skip: !tenantId },
  );

  const { data: tenantData } = useGetResourceByIdQuery(
    { resource: "tenant", id: tenantId! },
    { skip: !tenantId },
  );

  const menuData = useMemo<MenuItemData[]>(() => {
    return (
      data?.data.map((item: any) => ({
        ...item,
        category: item.category?.name || "Uncategorized",
        available: item.is_available,
      })) || []
    );
  }, [data]);

  // Extract all distinct categories
  const categoriesList = useMemo(() => {
    const fromApi: string[] =
      categoryData?.data?.map((c: any) => c.name).filter(Boolean) || [];
    const fromItems: string[] = Array.from(
      new Set(menuData.map((item) => item.category || "Uncategorized")),
    );
    const all = Array.from(new Set([...fromApi, ...fromItems]));

    return all.sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
  }, [categoryData, menuData]);

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    menuData.forEach((item) => {
      const cat = item.category || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [menuData]);

  // Filter menu items by search query and category
  const filteredData = useMemo(() => {
    return menuData.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [menuData, searchQuery, selectedCategory]);

  // Grouped data structure: categoryName -> items[]
  const groupedData = useMemo(() => {
    const groups: { category: string; items: MenuItemData[] }[] = [];

    const categoriesToDisplay =
      selectedCategory === "all"
        ? categoriesList
        : categoriesList.filter((c) => c === selectedCategory);

    categoriesToDisplay.forEach((cat) => {
      const items = filteredData.filter((item) => item.category === cat);
      if (items.length > 0 || (searchQuery === "" && selectedCategory === cat)) {
        groups.push({ category: cat, items });
      }
    });

    // Also catch any items whose category might not be in categoriesList
    const listedCategories = new Set(categoriesToDisplay);
    const orphanItems = filteredData.filter(
      (item) => !listedCategories.has(item.category),
    );
    if (orphanItems.length > 0) {
      groups.push({
        category: "Other",
        items: orphanItems,
      });
    }

    return groups;
  }, [categoriesList, filteredData, selectedCategory, searchQuery]);

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleAddNewMenu = () => {
    const tier = tenantData?.data?.subscription_tier || "free";
    if (tier === "free" && menuData.length >= 5) {
      toast.error(
        "You've reached the free tier limit of 5 menu items. Please upgrade to Pro to add more!",
      );
      return;
    }
    setDialog((prev) => ({ ...prev, open: true, id: "new" }));
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Menu Management</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize and manage your restaurant menu items and categories
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Group By Category Toggle */}
          <Button
            variant={groupByCategory ? "secondary" : "outline"}
            size="sm"
            onClick={() => setGroupByCategory((prev) => !prev)}
            className="h-9 gap-1.5 text-xs font-medium"
            title="Group menu items by category"
          >
            <Layers className="h-4 w-4" />
            <span>Group by Category</span>
            <Badge
              variant="outline"
              className={cn(
                "ml-1 text-[10px] px-1.5 py-0 h-4 leading-none",
                groupByCategory
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {groupByCategory ? "ON" : "OFF"}
            </Badge>
          </Button>

          {/* View Switcher */}
          <div className="flex items-center border rounded-md p-0.5 bg-muted/20">
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-8 px-2.5",
                view === "list" && "bg-background shadow-sm",
              )}
              onClick={() => setView("list")}
              title="Grid/Card view"
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Grid</span>
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-8 px-2.5",
                view === "table" && "bg-background shadow-sm",
              )}
              onClick={() => setView("table")}
              title="Table view"
            >
              <TableIcon className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Table</span>
            </Button>
          </div>

          {/* Add New Menu Button */}
          <Button onClick={handleAddNewMenu} size="sm" className="h-9">
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Menu
          </Button>
        </div>
      </div>

      {/* Category Tabs & Quick Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/20 border rounded-xl p-2.5">
        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-1">
          <Button
            variant={selectedCategory === "all" ? "default" : "ghost"}
            size="sm"
            className="h-8 rounded-lg text-xs font-medium shrink-0 px-3"
            onClick={() => setSelectedCategory("all")}
          >
            All Items
            <Badge
              variant="secondary"
              className={cn(
                "ml-1.5 text-[10px] px-1.5 py-0 h-4 leading-none rounded-full",
                selectedCategory === "all"
                  ? "bg-background text-foreground"
                  : "bg-muted-foreground/15 text-muted-foreground",
              )}
            >
              {menuData.length}
            </Badge>
          </Button>

          {categoriesList.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;

            return (
              <Button
                key={cat}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className="h-8 rounded-lg text-xs font-medium shrink-0 px-3"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1.5 text-[10px] px-1.5 py-0 h-4 leading-none rounded-full",
                    isSelected
                      ? "bg-background text-foreground"
                      : "bg-muted-foreground/15 text-muted-foreground",
                  )}
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {groupByCategory ? (
        /* Grouped By Category View */
        <div className="space-y-6">
          {groupedData.length === 0 ? (
            <div className="border rounded-2xl p-12 text-center bg-card flex flex-col items-center justify-center gap-3">
              <ChefHat className="h-12 w-12 text-muted-foreground/40 stroke-[1.5]" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">No menu items found</p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query or category filter."
                    : "Get started by adding your first menu item."}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={handleAddNewMenu} size="sm" className="mt-2">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add New Menu
                </Button>
              )}
            </div>
          ) : (
            groupedData.map((group) => {
              const isCollapsed = collapsedCategories[group.category] || false;
              const availableCount = group.items.filter(
                (item) => item.available,
              ).length;

              return (
                <div
                  key={group.category}
                  className="border rounded-2xl bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm transition-all"
                >
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategoryCollapse(group.category)}
                    className="flex items-center justify-between px-5 py-3.5 bg-muted/30 border-b cursor-pointer hover:bg-muted/50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <UtensilsCrossed className="h-4 w-4" />
                      </div>
                      <h4 className="font-semibold text-base text-foreground tracking-tight">
                        {group.category}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      >
                        {group.items.length}{" "}
                        {group.items.length === 1 ? "item" : "items"}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline-block">
                        • {availableCount} available
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        aria-label="Toggle section"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Category Items Content */}
                  {!isCollapsed && (
                    <div className="p-4 sm:p-5">
                      {group.items.length === 0 ? (
                        <div className="text-center py-8 text-xs text-muted-foreground">
                          No menu items in this category.
                        </div>
                      ) : view === "list" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {group.items.map((item) => (
                            <MenuCard
                              key={item.id}
                              item={item}
                              onClick={() =>
                                setDialog({ id: item.id || "", open: true })
                              }
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded-xl overflow-hidden bg-card">
                          <TableUI>
                            <TableHeader>
                              <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="w-[80px]">Photo</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.items.map((item) => {
                                const images = getImages(item.image_url);
                                const firstImage = images.length > 0 ? images[0] : "";

                                return (
                                  <TableRow
                                    key={item.id}
                                    className="cursor-pointer hover:bg-muted/40"
                                    onClick={() =>
                                      setDialog({ id: item.id || "", open: true })
                                    }
                                  >
                                    <TableCell className="py-2">
                                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted/50 border flex items-center justify-center">
                                        {firstImage ? (
                                          <img
                                            src={firstImage}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <ChefHat className="h-6 w-6 text-muted-foreground/40" />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                      {item.name}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {item.category}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold text-foreground">
                                      {formatCurrency(item.price)}
                                    </TableCell>
                                    <TableCell>
                                      {item.stock > 0 ? (
                                        <span className="text-xs font-medium text-muted-foreground">
                                          {item.stock} in stock
                                        </span>
                                      ) : (
                                        <span className="text-xs font-semibold text-destructive">
                                          Out of stock
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <span
                                        className={cn(
                                          "text-[11px] px-2 py-0.5 rounded font-semibold border",
                                          item.available
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                                            : "bg-destructive/10 text-destructive border-destructive/20",
                                        )}
                                      >
                                        {item.available ? "Available" : "Unavailable"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-primary hover:underline h-7 px-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDialog({ id: item.id || "", open: true });
                                        }}
                                      >
                                        Edit
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </TableUI>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Flat AdvancedTable View */
        <AdvancedTable
          columns={columns}
          data={filteredData}
          view={view}
          onViewChange={setView}
          addButton={{
            text: "Add New Menu",
            onClick: handleAddNewMenu,
          }}
          listRender={(data: any) => (
            <MenuCard
              item={data}
              onClick={() => setDialog({ id: data.id || "", open: true })}
            />
          )}
          row_click={(id) => setDialog({ id: id || "", open: true })}
        />
      )}

      {/* Edit / New Menu Dialog */}
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="overflow-y-auto max-h-[80vh]">
          <DialogTitle>
            {dialog.id === "new" ? "Add New Menu" : "Edit Menu"}
          </DialogTitle>
          <MenuForm
            id={dialog.id}
            onSuccess={() => {
              setDialog((prev) => ({ ...prev, open: false, id: "" }));
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;

