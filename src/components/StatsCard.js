import "./StatsCard.css";

function StatsCard(props) {
  return (
    <>
      <div className="statsCard">
        <div className="statsName">
          <span id="name">{props.name}</span>
          <span id="level">Level {props.level}</span>
        </div>
        <div className="statsOther">
          <span id="kills">
            Kills: <strong>{props.kills}</strong>
          </span>
          <span id="wins">
            Wins: <strong>{props.wins}</strong>
          </span>
          <span id="deaths">
            Deaths: <strong>{props.deaths}</strong>
          </span>
          <p id="winstreak">
            Winstrak: <strong>{props.winstreak}</strong>
          </p>
        </div>
      </div>
    </>
  );
}

export default StatsCard;
