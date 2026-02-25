import { Navigate, useParams } from "react-router";

export const AnatomySongEdit = () => {
  const { id } = useParams();
  return <Navigate to={`../show/${id}?edit=true`} replace />;
};
