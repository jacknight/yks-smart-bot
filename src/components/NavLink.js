import React from "react";
import { Link } from "react-router-dom";

const NavLink = ({ href, id, children }) => {
  return (
    <Link to={"/" + href} className={id}>
      {children}
    </Link>
  );
};

export default NavLink;
