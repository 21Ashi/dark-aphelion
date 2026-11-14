/**
 * The constellation. Each category becomes a cluster; edit freely.
 * Mobile and parts of Backend come from the previous portfolio; the rest
 * from the brief. Remove anything you would not defend in an interview.
 */
export type SkillCategory = {
  id: string
  label: string
  blurb: string
  skills: string[]
}

export const skillCategories: SkillCategory[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    blurb: 'Interfaces that are typed, accessible and fast.',
    skills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    blurb: 'Cross-platform apps from first commit to the stores.',
    skills: ['Flutter', 'Dart', 'BLoC', 'Riverpod', 'Firebase'],
  },
  {
    id: 'backend',
    label: 'Backend',
    blurb: 'APIs, data and the architecture that holds them.',
    skills: ['Node.js', 'C# .NET', 'Entity Framework', 'REST APIs', 'MySQL', 'Architecture'],
  },
  {
    id: 'creative',
    label: 'Creative',
    blurb: 'Real-time 3D, shaders and motion with intent.',
    skills: ['Three.js', 'WebGL', 'GLSL', 'GSAP', 'Motion design'],
  },
  {
    id: 'tools',
    label: 'Tools',
    blurb: 'The workshop: versioning, design and delivery.',
    skills: ['Git', 'Figma', 'Vite', 'Google Maps API', 'Unity'],
  },
]
