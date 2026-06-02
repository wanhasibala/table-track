"use client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Bell, Search, ShoppingCart } from "lucide-react";
import Head from "next/head";
import React from "react";

const page = () => {
  const [drawer, setDrawer] = React.useState({
    open: false,
    id: null as null | string,
  });
  return (
    <>
      <div className="w-full h-full flex  justify-between items-center gap-5">
        <div>
          <p>Welcome to</p>
          <h3>Restaurant</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border p-2 border-primary/20">
            <ShoppingCart className="text-primary" strokeWidth={3} size={14} />
          </div>
          <div className="rounded-full border p-2 border-primary/20">
            <Bell className="text-primary " strokeWidth={3} size={14} />
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center border rounded-sm px-2 focus-visible:ring-2">
        <Search size={16} strokeWidth={2} />
        <Input
          placeholder="Search food or drink"
          className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {/* banner */}

      <div className="mt-5 bg-primary w-full h-32 rounded-md"></div>
      <div className="mt-5 space-y-3">
        Categories
        <div className=" mt-2 grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="bg-gray-200 py-2 flex justify-center items-center rounded-md">
              {index + 1}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5  ">
        <div className="flex justify-between border-b">
          <h4>Popular</h4>
          <Button variant={"link"}>View All</Button>
        </div>
        <div className="mt-2  ">
          <Drawer>
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index.toString()} className="mb-3">
                <DrawerTrigger
                  className="bg-primary/20 h-10 rounded-md mb-4 w-full"
                  onClick={() =>
                    setDrawer((prev) => ({
                      ...prev,
                      id: (index + 1).toString(),
                    }))
                  }
                >
                  <div>{index + 1}</div>
                </DrawerTrigger>
                <DrawerContent className="px-2 pb-20">
                  <div className="h-[100px] bg-primary/50" />
                  <DrawerTitle className="">{drawer.id}</DrawerTitle>{" "}
                </DrawerContent>
              </div>
            ))}
          </Drawer>
        </div>
      </div>
    </>
  );
};

export default page;
