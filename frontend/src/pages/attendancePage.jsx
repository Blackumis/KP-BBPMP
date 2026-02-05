import PublicAttendancePage from "../components/PublicAttendancePage";
import "../index.css";
import { useParams, useNavigate } from "react-router-dom";

const AttendancePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  return <PublicAttendancePage eventId={token} />;
};

export default AttendancePage;
