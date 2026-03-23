import { useNavigate, useLoaderData, useParams, redirect, useOutletContext } from "react-router";
import { useEffect, useRef, useState } from "react";
import { generate3DView } from "../../lib/ai.action";
import { Box, Download, RefreshCcw, Share2, X } from "lucide-react";
import Button from "components/ui/Button";
import { createProject, getProjectById } from "../../lib/puter.action";

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
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useOutletContext<AuthContext>()
  const params = useParams();

  const [project, setproject] = useState<DesignItem | null>(null);
  const [isProjectLoading, setisProjectLoading] = useState(true)
  const hasInitialGenerated = useRef(false);

  const [isProcessing, setisProcessing] = useState(false)
  const [currentImage, setcurrentImage] = useState<string | null>(null)

  const handleBack = () => navigate('/');

  const runGeneration = async (item: DesignItem) => {
    if (!id || !item.sourceImage) return;

    try {
      setisProcessing(true);
      const result = await generate3DView({ sourceImage: item.sourceImage });

      if (result.renderedImage) {
        setcurrentImage(result.renderedImage);

        //update project in database with rendered image
        const updatedItem = {
          ...item,
          renderedImage: result.renderedImage,
          renderedPath: result.renderedPath,
          timestamp: Date.now(),
          ownerId: item.ownerId ?? userId ?? null,
          isPublic: item.isPublic ?? false,
        }

        const saved = await createProject({ item: updatedItem, visibility: "private" })

        if (saved) {
          setproject(saved);
          setcurrentImage(saved.renderedImage || result.renderedImage);
        }
      }
    } catch (error) {
      console.error('Generation failed: ', error)
    } finally {
      setisProcessing(false);
    }
  }


  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) {
        setisProjectLoading(false);
        return;
      }

      setisProjectLoading(true);

      const fetchedProject = await getProjectById({ id });

      if (!isMounted) return;

      setproject(fetchedProject);
      setcurrentImage(fetchedProject?.renderedImage || null);
      setisProjectLoading(false);
      hasInitialGenerated.current = false;
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (
      isProjectLoading ||
      hasInitialGenerated.current ||
      !project?.sourceImage
    )
      return;

    if (project.renderedImage) {
      setcurrentImage(project.renderedImage);
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    void runGeneration(project);
  }, [project, isProjectLoading]);

  return (
    <div className="visualizer">
      <nav className="topbar">
        <div className="logo">
          <Box className="logo" />

          <span className="name">Roomify</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBack}
          className="exit">
          <X className="icon" />Exit Editor
        </Button>
      </nav>

      <section className="content">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{project?.name || `Residence ${id}`}</h2>
              <p className="note">Created by You</p>
            </div>

            <div className="panel-actions">
              <Button
                size="sm"
                onClick={() => { }}
                className="export"
                disabled={!currentImage}
              >
                <Download className="w-4 h-4 mr-2" />Export
              </Button>
              <Button size="sm" onClick={() => { }} className="share">
                <Share2 className="w-4 h-4 mr-2" />Share
              </Button>
            </div>
          </div>
          <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
            {currentImage ? (
              <img src={currentImage} alt="AI Render"
                className="render-img" />
            ) : (
              <div className="render-placeholder">
                {project?.sourceImage && (
                  <img src={project?.sourceImage} alt="Original" className="render-fallback" />
                )}
              </div>
            )}

            {isProcessing && (
              <div className="render-overlay">
                <div className="rendering-card">
                  <RefreshCcw className="spinner" />
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