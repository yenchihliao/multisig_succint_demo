import React from "react";
import PropTypes from "prop-types";

const FirstPanel = ({ created }) => {
  return (
    <div className="info-card">
      <div className="info-card_branch">
        <div className={created ? "circle completed" : "circle"}></div>
        <div className="stick"></div>
      </div>
      <div className="info-card_msg">
        <div>{created ? "Created" : "Waited to be Created"}</div>
      </div>
    </div>
  );
};

FirstPanel.propTypes = {
  created: PropTypes.bool,
};

export default FirstPanel;
