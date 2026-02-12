// src/system-agents/loader.ts

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import type { SystemAgentDefinition } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.join(__dirname, 'agents');

/**
 * Load a system agent definition from the bundled agents directory.
 * Parses YAML frontmatter for name and description.
 */
export async function loadSystemAgent(name: string): Promise<SystemAgentDefinition> {
  const filePath = path.join(AGENTS_DIR, `${name}.md`);

  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`System agent "${name}" not found at ${filePath}`);
  }

  // Parse YAML frontmatter
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  let description = `System agent: ${name}`;
  let prompt = content;

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const descMatch = frontmatter.match(/description:\s*["']?(.+?)["']?\s*$/m);
    if (descMatch) {
      description = descMatch[1];
    }
    // Strip frontmatter from prompt
    prompt = content.slice(frontmatterMatch[0].length);
  }

  return { name, description, prompt };
}

/**
 * List all available system agents.
 */
export async function listSystemAgents(): Promise<string[]> {
  try {
    const files = await fs.readdir(AGENTS_DIR);
    return files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}
