"use client";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import React, { useState } from "react";
import { column } from "./menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MenuForm } from "./menu-form";

const page = () => {
  const columns = column();
  const [dialog, setDialog] = useState({
    open: false,
    id: "",
  });
  return (
    <>
      <h3>Menu Management</h3>
      <AdvancedTable
        columns={columns}
        data={[]}
        addButton={{
          text: "Add New Menu",
          onClick: () =>
            setDialog((prev) => ({ ...prev, open: true, id: "new" })),
        }}
      />
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <MenuForm id={dialog.id} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default page;
