import ScientificTeamComponent from "../components/scientific/ScientificTeam";

function ScientificTeam(props) {
  return <ScientificTeamComponent {...props} isSuperAdmin={true} />;
}

export default ScientificTeam;
