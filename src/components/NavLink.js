import React from "react";
import { Link } from "react-router-dom";

const NavLink = (props) => {
  return (
    <Link to={"/" + props.href} className={props.id}>
      {props.children}
    </Link>
  );
};

export default NavLink;
