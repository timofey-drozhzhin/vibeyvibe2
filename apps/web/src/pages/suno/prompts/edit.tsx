import { Navigate, useParams } from "react-router";

export const SunoPromptEdit = () => {
  const { id } = useParams();
  return <Navigate to={`../show/${id}?edit=true`} replace />;
};
