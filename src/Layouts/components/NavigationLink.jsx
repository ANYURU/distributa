import { NavLink } from "react-router-dom";
import cn from "../../utils/cn";

const NavigationLink = ({
  to,
  Icon,
  children = null,
  exact = false,
  ...props
}) => {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        cn("flex w-full gap-x-4 py-5", {
          "bg-grey border border-greyborder rounded-lg": isActive,
          "border border-transparent": !isActive,
          "px-8": children,
          "justify-center": !children,
        })
      }
      {...props}
    >
      {Icon && <Icon variation="black" />}
      {children && <span className="">{children}</span>}
    </NavLink>
  );
};

export default NavigationLink;
