export type ArtifactType = 'refinement' | 'architecture' | 'specification' | 'code' | 'test' | 'other'

export interface Artifact {
  filename: string
  type: ArtifactType
  description?: string
  savedAt?: string
  phase?: string
  versionCount: number
}
