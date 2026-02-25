import { Navigate, useParams } from "react-router";

export const AnatomyArtistEdit = () => {
  const { id } = useParams();
  return <Navigate to={`../show/${id}?edit=true`} replace />;
};
