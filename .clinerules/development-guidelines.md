# Development Guidelines

## Basic Rules

- Follow Instructions
  - Execute tasks as per defined requirements
  - Report progress or issues proactively

- Autonomous Problem Solving
  - Analyze and propose solutions when errors or problems occur
  - Clearly state recommended options if multiple approaches exist
  - Report issues that might be outside of the code

- Respect Existing Code
  - Follow existing code style and patterns
  - Explain if major changes are necessary

- Handling Repeated Failures
  - If a test fails twice in a row, summarize the situation with reproduction steps, logs, and error messages, and report it
  - Do not repeat the same action — always propose a solution

## Security

### Confidential Files

Do not read or modify the following under any circumstances

- .env file
- Any file containing API keys, tokens, or credentials

If changes to confidential files are necessary, contact the project owner.

Also follow these security practices:

- Never commit confidential files
- Use environment variables for secrets
- Avoid logging sensitive data (auth/user info)

## Workflow

Follow these four steps during development:

1. Requirements (PM Mode)
   - Clarify and refine requirements
   - Ask questions or make suggestions if needed

2. Design (Architect Mode)
   - Choose appropriate architecture or design patterns
   - Design components, data flows, and use case diagrams

3. Implementation (Code Mode)
   - Write code based on the design
   - Create unit tests
     - Must be executable via Vitest
     - 100% test coverage required for:
       - statements
       - branches
       - functions
       - lines
     - Each function/component should be tested with mocked external dependencies

4. Quality Check (PMO Mode)
   - Code Review
     - Lint/format checks (ESLint / Prettier)
     - Validate user input properly
     - Consider performance and security
   - Requirement Verification

AI should make autonomous decisions to progress through these steps and deliver complete results in a single request whenever possible.
