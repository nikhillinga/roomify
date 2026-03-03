import { useLocation, useNavigate, useLoaderData, useParams, redirect } from "react-router";
import { useEffect, useRef, useState } from "react";
import { generate3DView } from "lib/ai.action";
import { Box, Download, RefreshCcw, Share2, X } from "lucide-react";
import Button from "components/ui/Button";

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

  const { initialImage, initialRender, name } = location.state || {}

  const hasInitialGenerated = useRef(false);

  const [isProcessing, setisProcessing] = useState(false)
  const [currentImage, setcurrentImage] = useState<string | null>(initialRender || null)

  const handleBack = () => navigate('/');

  const runGeneration = async() => {
    if(!initialImage) return;

    try{
      setisProcessing(true);
      const result = await generate3DView({ sourceImage: initialImage });

      if(result.renderedImage){
        setcurrentImage(result.renderedImage);

        //update project in database with rendered image
      }
    } catch(error){
      console.error('Generation failed: ', error)
    }finally{
      setisProcessing(false);
    }
  }


  useEffect(() => {
    if (!initialImage) {
      // no source to generate from, go home
      console.warn("No initial image available for project", params.id);
      navigate("/", { replace: true });
      return;
    }

    if (hasInitialGenerated.current) {
      // already ran once, nothing to do
      return;
    }

    if (initialRender) {
      setcurrentImage(initialRender);
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    runGeneration();
  }, [initialImage, params.id, navigate, initialRender]);

  return (
    <div className="visualizer">
      <nav className = "topbar">
        <div className = "logo">
          <Box className="logo" />
                        
          <span className="name">Roomify</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBack}
          className="exit">
            <X className="icon" />Exit Editor
          </Button>
      </nav>

      <section className="content">
        <div className = "panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{name ?? 'Untitled Project'}</h2>
              <p className = "note">Created by You</p>
            </div>

            <div className = "panel-actions">
              <Button 
                size="sm"
                onClick={()=>{}}
                className="export"
                disabled={!currentImage}
              >
                <Download className = "w-4 h-4 mr-2" />Export
              </Button>
              <Button size="sm" onClick={() => {}} className="share">
                <Share2 className="w-4 h-4 mr-2" />Share
              </Button>
            </div>
          </div>
          <div className = {`render-area ${isProcessing ? 'is-processing':''}`}>
            {currentImage ? (
              <img src={currentImage} alt="AI Render"
                className="render-img" />
            ) : (
              <div className="render-placeholder">
                {initialImage && (
                  <img src={initialImage} alt="Original" className="render-fallback" />
                )}
              </div>
            )}

            {isProcessing && (
              <div className="render-overlay">
                <div className = "rendering-card">
                  <RefreshCcw className="spinner"/>
                  <span className="title">Rendering...</span>
                  <span className="subtitle">Generating your 3D visualization</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VisualizerId;