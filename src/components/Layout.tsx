import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[430px] mx-auto relative">
      <Header />
      <main className="flex-1 px-md pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};