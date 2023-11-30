import "./StatsCard.css";

function StatsCard(props) {
  return (
    <>
      <div className="statsCard">
        <div className="statsContent">
          <div id="level">
            <span>
              {props.type === "1" ? `[${props.level}✰] ` : null}
              <span id="name">{props.name}</span>
            </span>
          </div>
          <div id="kd">
            <span>{props.kd}</span>
          </div>
          <div id="fkd">
            <span>{props.fkd}</span>
          </div>
          <div id="wins">
            <span>{props.wins}</span>
          </div>
          <div id="games">
            <span>{props.games}</span>
          </div>
          <div id="ws">
            <span>{props.ws}</span>
          </div>
          <div id="maxws">
            <span>{props.maxws}</span>
          </div>
        </div>
      </div>
      {props.type === "0" ? <br /> : null}
    </>
  );
}

export default StatsCard;
