import { useLocation, useNavigate, useLoaderData, useParams, redirect } from "react-router";
import { useEffect } from "react";

// loader will run on route match; attempt to resolve project info by id
export async function loader({ params }: { params: Record<string, string> }) {
  const id = params.id;
  if (!id) {
    // no id in url, send user home
    throw redirect("/");
  }
  // TODO: implement real fetch to backend/kv using id
  // For now return an empty object that can be extended later
  return { id };
}

const VisualizerId = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const loaderData = useLoaderData() as { initialImage?: string; name?: string; id?: string };

  // prefer location state but fall back to loader values
  const initialImage = (location.state && (location.state as any).initialImage) || loaderData.initialImage;
  const name = (location.state && (location.state as any).name) || loaderData.name;

  useEffect(() => {
    if (!initialImage) {
      // nothing to show, attempt redirect or show message
      console.warn("No initial image available for project", params.id);
      navigate("/", { replace: true });
    }
  }, [initialImage, params.id, navigate]);

  return (
    <section>
      <h1>{name || "Untitled Project"}</h1>
      <div className="visualizer">
        {initialImage && (
          <div className="image-container">
            <h2>Source Image</h2>
            <img src={initialImage} alt="source" />
          </div>
        )}
      </div>
    </section>
  );
};

export default VisualizerId;