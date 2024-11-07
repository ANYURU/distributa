import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks";
import Logo from "../../../components/common/Logos/Logo";
import LogoCondensed from "../../../components/common/Logos/LogoCondensed";
import { FileText, PlusSquare, Book } from "../../../components/common/icons";
import NavigationLink from "../NavigationLink";
import { useState } from "react";
import cn from "../../../utils/cn";
import useMediaQuery from "../../../hooks/useMediaQuery";

function SideBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collapseMenu, setCollapseMenu] = useState(false);
  const toggleCollapse = () =>
    setCollapseMenu((prevCollapseState) => !prevCollapseState);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  console.log("isDesktop: ", isDesktop);

  return (
    <aside
      className={`h-full hidden md:flex flex-col justify-between py-16 border-r border-r-gray-100 flex-shrink-0 ${cn(
        {
          "px-8": isDesktop || !collapseMenu,
          "px-4": !isDesktop || collapseMenu,
        }
      )}`}
    >
      <section className="flex flex-col gap-y-8">
        <button onClick={toggleCollapse} disabled={!isDesktop}>
          {collapseMenu || !isDesktop ? (
            // <LogoCondensed className="fill-none w-[2.813rem] h-[2.063rem]" />
            <LogoCondensed className="fill-none w-[2.813rem] h-6" />
          ) : (
            <Logo
              className="w-[5.758rem] h-[1.125rem] md:w-32 md:h-6"
              variant="blue"
            />
          )}
        </button>
        <nav className="flex flex-col gap-y-4 w-full text-center">
          <NavigationLink
            to="/invoices"
            Icon={FileText}
            children={collapseMenu || !isDesktop ? null : "My invoices"}
            exact={true}
          />
          <NavigationLink
            to="/invoices/new"
            Icon={PlusSquare}
            children={collapseMenu || !isDesktop ? null : "New Invoice"}
            exact={true}
          />
          <NavigationLink
            to="/transactions"
            Icon={Book}
            children={collapseMenu || !isDesktop ? null : "My Transactions"}
            exact={true}
          />
        </nav>
      </section>
      <div className="flex flex-col gap-y-4">
        <button
          className={cn("text-black w-fit px-8", {
            "px-4": collapseMenu,
          })}
          onClick={async () => {
            await logout();
            navigate("/");
          }}
        >
          Logout
        </button>
        <button
          className={cn("text-black w-fit px-8", {
            "px-4": collapseMenu,
          })}
          onClick={() => navigate("/settings")}
        >
          Settings
        </button>
      </div>
    </aside>
  );
}

export default SideBar;
