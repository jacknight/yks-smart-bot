import React from 'react';

const NavButton = (props) => {
  return (
    <button className={props.id} onClick={props.onClick}>
      {props.children}
    </button>
  );
};

export default NavButton;
