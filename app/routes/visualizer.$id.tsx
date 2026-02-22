import { useParams } from "react-router";
import { useEffect, useState } from "react";

const VisualizerId = () => {
  const { id } = useParams();
  const [base64Image, setBase64Image] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      // Retrieve image from localStorage using the same key convention
      const storedImage = localStorage.getItem(`roomify_image_${id}`);
      if (storedImage) {
        setBase64Image(storedImage);
      }
    }

    // Cleanup: remove image from localStorage on unmount
    return () => {
      if (id) {
        localStorage.removeItem(`roomify_image_${id}`);
      }
    };
  }, [id]);

  return (
    <div>
      <h1>Visualizer - {id}</h1>
      {base64Image ? (
        <img src={base64Image} alt="Floor Plan" style={{ maxWidth: "100%" }} />
      ) : (
        <p>Loading floor plan...</p>
      )}
    </div>
  );
};

export default VisualizerId;