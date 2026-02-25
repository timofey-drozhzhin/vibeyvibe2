import { Navigate, useParams } from "react-router";

export const BinSourceEdit = () => {
  const { id } = useParams();
  return <Navigate to={`../show/${id}?edit=true`} replace />;
};
