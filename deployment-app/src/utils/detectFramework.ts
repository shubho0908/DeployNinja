import axios from 'axios';
import { Framework, FrameworkSchema } from '@/types/models/Framework.model';


const frameworkChecks = [
  { name: 'Next.js', dependency: 'next' },
  { name: 'Nuxt.js', dependency: 'nuxt' },
  { name: 'Vue.js', dependency: 'vue' },
  { name: 'React', dependency: 'react' },
  { name: 'Angular', dependency: '@angular/core' },
  { name: 'Svelte', dependency: 'svelte' },
] as const;

async function detectFrontendFramework(repoUrl: string): Promise<Framework> {
  try {
    // Extract owner and repo from GitHub URL
    const [owner, repo] = repoUrl
      .replace('https://github.com/', '')
      .split('/')
      .filter(Boolean);

    if (!owner || !repo) {
      throw new Error('Invalid GitHub repository URL');
    }

    // Fetch raw package.json content
    const response = await axios.get(
      `https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`
    );

    const packageJson = response.data;
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const framework of frameworkChecks) {
      if (dependencies[framework.dependency]) {
        return FrameworkSchema.parse({
          name: framework.name,
        });
      }
    }

    // Make sure the user sees 'Select a framework' in the UI, if unable to detect a framework
    return FrameworkSchema.parse({
      name: 'Unknown',
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Either the repository does not exist or package.json not found in repository');
    }
    throw error;
  }
}

export { detectFrontendFramework, FrameworkSchema };
export type { Framework };