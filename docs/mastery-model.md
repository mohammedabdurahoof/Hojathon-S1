# Mastery Strategy & Mathematical Models

## Overview

The platform supports multiple mastery calculation strategies via the `MasteryStrategy` design pattern:
1. **Weighted Accuracy Strategy (`weighted_accuracy`)** — Production Default
2. **Bayesian Knowledge Tracing (`bkt`)** — Probabilistic Strategy

---

## 1. Weighted Accuracy Strategy (Production Default)

$$\text{newMastery} = 0.70 \times \text{previousMastery} + 0.30 \times (\text{correctness} \times \text{difficultyMultiplier})$$

Where:
- $\text{correctness} = 1.0$ if correct, $0.0$ if incorrect.
- $\text{difficultyMultiplier} = 0.8 + (\text{difficulty} - 1) \times 0.10$ for levels 1 through 5.
- $\text{confidence} = \min(1.0, \frac{\text{attempts}}{10} - 0.05 \times \text{hintsUsed})$.

---

## 2. Bayesian Knowledge Tracing Strategy (BKT)

BKT updates student knowledge probability $P(L_n)$ after observing response $\text{Obs}_n \in \{0, 1\}$:

### Step 1: Posterior Update
If $\text{Obs}_n = 1$ (Correct):

$$P(L_n \mid \text{Correct}) = \frac{P(L_{n-1}) \cdot (1 - P(S))}{P(L_{n-1}) \cdot (1 - P(S)) + (1 - P(L_{n-1})) \cdot P(G)}$$

If $\text{Obs}_n = 0$ (Incorrect):

$$P(L_n \mid \text{Incorrect}) = \frac{P(L_{n-1}) \cdot P(S)}{P(L_{n-1}) \cdot P(S) + (1 - P(L_{n-1})) \cdot (1 - P(G))}$$

### Step 2: Learning Transition
$$P(L_n) = P(L_n \mid \text{Obs}_n) + (1 - P(L_n \mid \text{Obs}_n)) \cdot P(T)$$

### Configured Parameters
- $P(T) = 0.15$ (Learn probability)
- $P(G) = 0.20$ (Guess probability)
- $P(S) = 0.10$ (Slip probability)

---

## 3. Configuration

Switch calculation strategy via environment variable:

```env
# Options: weighted_accuracy | bkt
MASTERY_STRATEGY=weighted_accuracy
```
