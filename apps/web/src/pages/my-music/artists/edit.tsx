import { Navigate, useParams } from "react-router";

export const ArtistEdit = () => {
  const { id } = useParams();
  return <Navigate to={`../show/${id}?edit=true`} replace />;
};
