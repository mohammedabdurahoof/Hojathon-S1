# Academic Intelligence & Remedial Learning Engine Documentation

This document explains the deterministic algorithms, data models, and API interfaces powering the **AI Remedial Learning Platform**.

---

## 1. Curriculum Hierarchy & Concept Graph

The academic structure is organized hierarchically:

```
Subject (e.g. Mathematics)
  └── Chapter (e.g. Algebraic Foundations)
        └── Topic (e.g. Remedial Core Competencies)
              └── Concept (e.g. Division, Fractions, Algebra)
```

Each `Concept` represents a discrete, measurable micro-skill. 

---

## 2. Concept Relationships & Cycle Detection

Concepts are linked via a directed acyclic graph (DAG) defined by the `ConceptPrerequisite` relationship:

```
Addition ➔ Multiplication ➔ Division ➔ Fractions ➔ Decimals ➔ Percentages ➔ Algebra
```

### Graph Business Rules & Cycle Detection
1. **Self-Reference Protection**: A concept cannot list itself as a prerequisite (`conceptId !== prerequisiteId`).
2. **Duplicate Prevention**: A unique constraint `@@unique([conceptId, prerequisiteId])` prevents redundant edges.
3. **Cycle Detection Algorithm**: When creating a prerequisite link `POST /api/concepts/:id/prerequisites`, a Breadth-First Search (BFS) / Depth-First Search (DFS) traverses candidate prerequisite paths. If adding `A ➔ B` would form a cycle (`B ➔ ... ➔ A`), the request is rejected with `400 Bad Request: "Circular prerequisite dependency detected."`

---

## 3. Mastery Calculation Model

The platform uses a transparent, exponential moving average formula to update a student's concept mastery score after every assessment attempt:

$$\text{newMastery} = (\text{previousMastery} \times 0.7) + (\text{currentAssessmentAccuracy} \times 0.3)$$

The result is clamped between $0.0$ and $1.0$.

### Mastery Level Classifications
- **Critical**: $< 0.40$
- **Weak**: $0.40 - 0.59$
- **Developing**: $0.60 - 0.79$
- **Mastered**: $\ge 0.80$

---

## 4. Learning Gap Calculation

`GET /api/students/:studentId/learning-gaps`

Identifies all concepts where student mastery score is $< 0.70$. Returns concepts sorted from lowest mastery score to highest.

---

## 5. Root Gap Detection Algorithm

`GET /api/students/:studentId/root-gaps`

Rather than simply recommending advanced concepts where a student fails (e.g., *Algebra = 20%*), the **Root Gap Algorithm** recursively traverses prerequisite dependencies backwards:

```
Algebra (20%) ➔ Percentages (25%) ➔ Decimals (30%) ➔ Fractions (35%) ➔ Division (40%) ➔ Multiplication (90%)
```

1. The engine checks `Multiplication = 90%` (Mastered).
2. The deepest unmastered prerequisite before `Multiplication` is **`Division (40%)`** and **`Fractions (35%)`**.
3. The engine isolates `Division` & `Fractions` as the **Primary Root Gaps**, ignoring higher-level topics until root prerequisites are remediated.

---

## 6. Remedial Learning Plan Generation

`POST /api/students/:studentId/learning-plans/generate`

1. Fetches student's current masteries and root gaps.
2. Performs a **Topological Sort** (Kahn's Algorithm) over weak concepts to ensure prerequisite concepts strictly precede dependent concepts.
3. Generates a `LearningPlan` and ordered `LearningPlanItem` sequence.

---

## 7. Future Bayesian Knowledge Tracing (BKT) Integration Roadmap

In Phase 3+, the transparent moving average formula will be augmented or replaced with **Bayesian Knowledge Tracing (BKT)** or **Deep Knowledge Tracing (DKT)**:

- $P(L_0)$: Initial probability of knowing the concept.
- $P(T)$: Probability of transitioning from unlearned to learned state.
- $P(S)$: Probability of slip (knowing the concept but answering incorrectly).
- $P(G)$: Probability of guess (not knowing the concept but answering correctly).

The modular `MasteryService` is abstracted to allow swapping the scoring strategy without altering the Assessment or Learning Plan engines.
