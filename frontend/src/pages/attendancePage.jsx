import PublicAttendancePage from "../components/PublicAttendancePage";
import "../index.css";
import { useParams, useNavigate } from "react-router-dom";

const AttendancePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return <PublicAttendancePage eventId={id} />;
};

export default AttendancePage;
