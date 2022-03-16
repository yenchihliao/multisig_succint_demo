import React from "react";
import PropTypes from "prop-types";

const InfoPanel = ({ data }) => {
  return data ? (
    <>
      {data.map((item, index) => {
        return (
          <div key={index} className="info-card">
            <div className="info-card_branch">
              <div
                className={
                  data.length > index + 1 ? "circle completed" : "circle"
                }
              ></div>
              <div className="stick"></div>
            </div>
            <div className="info-card_msg">
              <div>第{index + 1}名簽署者</div>
              <div>簽署地址：{item.address}</div>
              <div>完成資訊：{item.msg}</div>
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
};

export default InfoPanel;
