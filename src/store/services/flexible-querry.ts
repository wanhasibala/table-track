import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/database.types";

const supabase = createClient();

type PublicSchema = Database["public"];
export type TableName = keyof PublicSchema["Tables"];

export type Row<T extends TableName> = PublicSchema["Tables"][T]["Row"];
export type InsertRow<T extends TableName> = PublicSchema["Tables"][T]["Insert"];
export type UpdateRow<T extends TableName> = PublicSchema["Tables"][T]["Update"];

// 🚀 🔥 THE MAGIC TYPE: Maps valid columns for the specific table selected
type QueryParams<T extends TableName> = {
  [K in keyof Row<T>]?: Row<T>[K] | Row<T>[K][]; // Allows filtering by column values or an array of values (.in())
} & {
  sort?: keyof Row<T> & string; // 👈 Enforces sort must be a valid column name string
  order?: "asc" | "desc";       // 👈 Enforces order must be exactly 'asc' or 'desc'
};

interface ResourceQueryArgs<T extends TableName = TableName> {
  resource: T;
  params?: QueryParams<T>; // Pass down the generic context
  refetch?: boolean;
}

interface ResourceByIdArgs<T extends TableName = TableName> {
  resource: T;
  id: string | number;
  params?: QueryParams<T>;
  refetch?: boolean;
}

interface ResourceMutationArgs<T extends TableName = TableName> {
  resource: T;
  id?: string | number;
  body: InsertRow<T> | UpdateRow<T>;
}

export const api = createApi({
  reducerPath: "flexibleApi",
  baseQuery: fakeBaseQuery(),
  keepUnusedDataFor: 30,
  tagTypes: ["Resource"],
  endpoints: (builder) => ({
    
    // READ LIST
    getResource: builder.query<{ data: any[] }, ResourceQueryArgs<any>>({
      async queryFn({ resource, params = {} }) {
        try {
          let query = supabase.from(resource).select("*");

          const sortColumn = params.sort as string | undefined;
          const sortOrder = params.order as "asc" | "desc" | undefined;

          Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (key === "sort" || key === "order") return; 
            
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          });

          if (sortColumn) {
            query = query.order(sortColumn, { 
              ascending: sortOrder !== "desc"
            });
          }

          const { data, error } = await query;
          if (error) return { error };

          return { data: { data: data || [] } };
        } catch (err: any) {
          return { error: { message: err.message } };
        }
      },
      providesTags: (result, error, { resource }) =>
        result?.data
          ? [
              { type: "Resource" as const, id: "LIST" },
              ...result.data.map(({ id }: any) => ({ type: "Resource" as const, id })),
            ]
          : [{ type: "Resource" as const, id: "LIST" }],
    }),

    // READ SINGLE RECORD
    getResourceById: builder.query<{ data: any }, ResourceByIdArgs<any>>({
      async queryFn({ resource, id }) {
        try {
          const { data, error } = await supabase
            .from(resource)
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (error) return { error };
          return { data: { data } };
        } catch (err: any) {
          return { error: { message: err.message } };
        }
      },
      providesTags: (result, error, { id }) => [{ type: "Resource" as const, id }],
    }),

    // CREATE RECORD
    createResource: builder.mutation<{ data: any }, ResourceMutationArgs<any>>({
      async queryFn({ resource, body }) {
        try {
          const { data, error } = await supabase
            .from(resource)
            // @ts-ignore
            .insert(body)
            .select()
            .single();

          if (error) return { error };
          return { data: { data } };
        } catch (err: any) {
          return { error: { message: err.message } };
        }
      },
      invalidatesTags: [{ type: "Resource" as const, id: "LIST" }],
    }),

    // UPDATE RECORD
    updateResource: builder.mutation<{ data: any }, ResourceMutationArgs<any>>({
      async queryFn({ resource, id, body }) {
        if (!id) return { error: { message: "An explicit ID argument is required for modifications." } };
        try {
          const { data, error } = await supabase
            .from(resource)
            // @ts-ignore
            .update(body)
            .eq("id", id)
            .select()
            .single();

          if (error) return { error };
          return { data: { data } };
        } catch (err: any) {
          return { error: { message: err.message } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Resource" as const, id },
        { type: "Resource" as const, id: "LIST" },
      ],
    }),

    // DELETE RECORD
    deleteResource: builder.mutation<{ data: any }, { resource: TableName; id: string | number }>({
      async queryFn({ resource, id }) {
        try {
          const { data, error } = await supabase
            .from(resource)
            .delete()
            .eq("id", id)
            .select()
            .maybeSingle();

          if (error) return { error };
          return { data: { data } };
        } catch (err: any) {
          return { error: { message: err.message } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Resource" as const, id },
        { type: "Resource" as const, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetResourceQuery,
  useLazyGetResourceQuery,
  useGetResourceByIdQuery,
  useLazyGetResourceByIdQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
} = api;