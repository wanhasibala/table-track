import { Children } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <div className="w-full h-full p-5 md:p-4">{children} </div>;
};

export default Layout;
