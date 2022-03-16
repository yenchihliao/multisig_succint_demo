import React from "react";
import PropTypes from "prop-types";

const InfoPanel = ({ data, completed }) => {
  return data ? (
    <>
      {data.map((item, index) => {
        return (
          <div key={index} className="info-card">
            <div className="info-card_branch">
              <div
                className={
                  completed || data.length > index + 1
                    ? "circle completed"
                    : "circle"
                }
              ></div>
              <div className="stick"></div>
            </div>
            <div className="info-card_msg">
              <div>No. {index + 1}</div>
              <div>簽署地址：{item.address}</div>
              <div>交易摘要：{item.msg}</div>
            </div>
          </div>
        );
      })}
    </>
  ) : (
    <></>
  );
};

InfoPanel.propTypes = {
  data: PropTypes.array,
  completed: PropTypes.bool,
};

export default InfoPanel;
