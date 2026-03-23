import puter from "@heyputer/puter.js";
import { getOrCreateHostingConfig, uploadImageToHosting } from "./puter.hosting";
import { isHostedUrl } from "./utils";
import { PUTER_WORKER_URL } from "./constants";

export const signIn = async () => await puter.auth.signIn();
export const signOut = async () => await puter.auth.signOut();

export const getCurrentUser = async () => {
    try {
        return await puter.auth.getUser();
    } catch {
        return null;
    }
}

export async function createProject({ item }: CreateProjectParams):
    Promise<DesignItem | null | undefined> {
    const projectId = item.id;

    const hosting = await getOrCreateHostingConfig();

    const hostedSource = projectId
        ? await uploadImageToHosting({
            hosting,
            url: item.sourceImage,
            projectId,
            label: 'source',
        })
        : null;

    const hostedRender = projectId && item.renderedImage
        ? await uploadImageToHosting({
            hosting,
            url: item.renderedImage,
            projectId,
            label: 'rendered',
        })
        : null;

    const resolvedSource =
        hostedSource?.url || (isHostedUrl(item.sourceImage) ? item.sourceImage : '');

    if (!resolvedSource) {
        console.warn(`Failed to host source image, skipping save.`);
        return null;
    }

    const resolvedRender = hostedRender?.url
        ? hostedRender?.url
        : item.renderedImage && isHostedUrl(item.renderedImage)
            ? item.renderedImage
            : undefined;

    const {
        sourcePath: _sourcePath,
        renderedPath: _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item;

    const payload = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRender,
    };

    try {
        //Call the Puter worker to store project in kv
        if (!PUTER_WORKER_URL) {
            console.warn('Missing VITE_PUTER_WORKER_URL; skip project save;');
            return null;
        }

        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
            method: 'POST',
            body: JSON.stringify({ project: payload }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to save project', await response.text());
            return null;
        }

        return payload;
    } catch (e) {
        console.log('Failed to save Project', e);
        return null;
    }
}

export const getProjects = async () => {
    if (!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch;');
        return []
    }
    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/list`, { method: 'GET' });

        if (!response.ok) {
            console.error('Failed to fetch history', await response.text());
            return [];
        }

        const data = (await response.json()) as { projects: DesignItem[] | null };
        return Array.isArray(data?.projects) ? data.projects : [];
    } catch (e) {
        console.error('Failed to get projects', e);
        return [];
    }
}

export const getProjectById = async ({ id }: { id: string }): Promise<DesignItem | null> => {
    if (!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip project fetch;');
        return null;
    }
    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/get?id=${id}`, { method: 'GET' });

        if (!response.ok) {
            console.error('Failed to fetch project', await response.text());
            return null;
        }

        const data = (await response.json()) as { project: DesignItem | null };
        return data?.project || null;
    } catch (e) {
        console.error('Failed to get project by id', e);
        return null;
    }
}