---
name: ecc-core
description: >-
  Executes the core ECC (Agent Harness Operating System) workflow: plan -> test -> implement -> review -> verify -> remember -> improve. Use this skill when building new features, large architectural components, or whenever a structured engineering process is required.
---

# ECC Core Workflow

This skill applies the ECC engineering system. Following these steps ensures robust, secure, and well-tested code delivery.

## Core Principles

1. **Agent-First** - Delegate to specialized agents (or logical roles) for domain tasks.
2. **Test-Driven** - Write tests before implementation, 80%+ coverage required.
3. **Security-First** - Never compromise on security; validate all inputs.
4. **Immutability** - Prefer creating new objects over mutating existing ones.
5. **Plan Before Execute** - Plan complex features before writing code.

## Workflow Steps

When tasked with building a feature (like a real-time Emotion Scanner), execute the following phases:

### Phase 1: Plan
- Analyze requirements and outline a step-by-step implementation plan.
- Identify components, tech stack, and testing strategy.
- If necessary, present the plan to the user for approval before coding.

### Phase 2: Test (TDD)
- Write tests for the core logic (e.g., mock inputs, expected outputs) before implementing the actual logic.
- Ensure the tests fail initially (Red).

### Phase 3: Implement
- Write the minimum necessary code to make the tests pass (Green).
- Follow language-specific best practices and existing project architecture.

### Phase 4: Review & Refactor
- Act as a `code-reviewer` and `security-reviewer`.
- Clean up dead code, optimize logic, and check for vulnerabilities (e.g., XSS, insecure inputs).
- Refactor the code for better maintainability (Refactor).

### Phase 5: Verify
- Run the tests to ensure they still pass.
- Verify that the code handles edge cases gracefully.

### Phase 6: Document (Remember)
- Update README.md or project documentation to reflect the new feature.
- Document any architectural decisions or required setup steps.

## Acceptance Criteria
To complete a task using `ecc-core`, you must explicitly declare completion of each phase in your response, proving that the code was planned, tested, implemented, and reviewed.
