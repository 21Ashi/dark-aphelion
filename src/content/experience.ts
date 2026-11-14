export type Job = {
  role: string
  company: string
  period: string
  type: string
  description: string
  stack: string[]
}

// From the previous version of the portfolio — keep these current.
export const jobs: Job[] = [
  // Title and dates from the owner (April 2026, straight after Matrix / Sajaya).
  // The stack is Jola's, Tamrah's own platform.
  {
    role: 'Developer Lead',
    company: 'Tamrah',
    period: 'Apr 2026 — Present',
    type: 'Full-time',
    description:
      'Building apps, APIs and dashboards in Qatar; lead developer on Jola, Tamrah’s party-games platform, since September 2026.',
    stack: ['React Native', 'Next.js', 'Supabase'],
  },
  {
    role: 'Full-Stack Developer',
    company: 'Matrix / Sajaya',
    // three months, per the owner; their commits in the Sajaya app run Feb–Apr 2026
    period: 'Jan 2026 — Apr 2026',
    type: 'Full-time',
    description:
      'Production Flutter front ends paired with C# .NET and Entity Framework back ends. Live apps used every day by enterprise clients.',
    stack: ['Flutter', 'C# .NET', 'Entity Framework', 'Firebase', 'MySQL'],
  },
  {
    role: 'Prompt Engineering Intern',
    company: 'Optimiza',
    period: '2024',
    type: 'Internship',
    description:
      'Designed LLM workflows and prompt chains that cut manual processing by 40–50%, and wired AI into production pipelines.',
    stack: ['LLM', 'Prompt engineering', 'AI workflows', 'Python'],
  },
  {
    role: 'Independent Game Developer',
    company: 'Self-employed',
    period: '2022 — 2024',
    type: 'Independent',
    description:
      'Published “Wrong Answers” on Android and iOS and reached 15,000+ downloads organically. The full solo cycle: design, build, ship.',
    stack: ['Unity', 'C#', 'Android', 'iOS', 'Game design'],
  },
]
